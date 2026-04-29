"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  ArrowLeft,
  Eye,
  History,
  Loader2,
  MessageSquare,
  Palette,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeManagerSheet } from "@/components/theme/ThemeManagerSheet";
import { useGlobalTheme } from "@/components/theme/GlobalThemeProvider";
import { buildThemeWrapperStyle, fontFamilyClass } from "@/lib/theme/resolve";
import { ShellLayout } from "@/components/shell/Layout";
import { WidgetHost } from "@/components/shell/WidgetHost";
import { ChatDock } from "@/components/chat/ChatDock";
import { listWidgets } from "@/widgets";
import type {
  LayoutNode,
  Shell,
  ThemeOverride,
  WidgetInstance,
} from "@/lib/shell/schema";
import type {
  FrameSummary,
  RevisionSummary,
} from "@/lib/shell/repo";
import { cn } from "@/lib/utils";

export interface ShellViewProps {
  frame: FrameSummary;
  shell: Shell;
  revisionId: string;
  initialRevisions: RevisionSummary[];
}

export function ShellView({
  frame,
  shell: initialShell,
  revisionId: initialRevisionId,
  initialRevisions,
}: ShellViewProps) {
  const router = useRouter();
  const [shell, setShell] = useState<Shell>(initialShell);
  const [revisionId, setRevisionId] = useState<string>(initialRevisionId);
  const [revisions, setRevisions] =
    useState<RevisionSummary[]>(initialRevisions);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [themeSheetOpen, setThemeSheetOpen] = useState(false);

  const { global } = useGlobalTheme();
  const { resolvedTheme } = useTheme();
  const resolvedDark = resolvedTheme === "dark";
  const wrapperStyle = buildThemeWrapperStyle(
    global,
    shell.theme,
    resolvedDark,
  );
  const ffClass = fontFamilyClass(global, shell.theme);

  // Resync local state when the server-rendered prop changes (e.g. after a
  // `router.refresh()` following a revert). We track the last seen
  // `initialRevisionId` so locally-applied saves — which advance our own
  // `revisionId` without a server refresh — aren't undone.
  const [lastSeenServerRevision, setLastSeenServerRevision] =
    useState<string>(initialRevisionId);
  if (initialRevisionId !== lastSeenServerRevision) {
    setLastSeenServerRevision(initialRevisionId);
    setShell(initialShell);
    setRevisionId(initialRevisionId);
    setRevisions(initialRevisions);
  }

  const widgetCatalog = useMemo(() => listWidgets(), []);

  const commitRevision = useCallback(
    async (
      next: Shell,
      reasoning: string,
      authoredBy: "user" | "agent" = "user",
    ) => {
      const res = await fetch(`/api/frames/${frame.id}/revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: next,
          parentRevisionId: revisionId,
          reasoning,
          authoredBy,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string; issues?: unknown[] }
          | null;
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as { revision: RevisionSummary };
      setShell(next);
      setRevisionId(body.revision.id);
      setRevisions((prev) => [body.revision, ...prev]);
      return body.revision;
    },
    [frame.id, revisionId],
  );

  const applyFrameTheme = useCallback(
    async (next: ThemeOverride | undefined) => {
      await commitRevision(
        { ...shell, theme: next },
        next === undefined ? "Cleared frame theme" : "Updated frame theme",
      );
    },
    [shell, commitRevision],
  );

  const updateWidgetProps = useCallback(
    async (instanceId: string, nextProps: Record<string, unknown>) => {
      const current = shell.widgets[instanceId];
      if (!current) {
        toast.error(`Unknown widget instance "${instanceId}"`);
        return;
      }
      const next: Shell = {
        ...shell,
        widgets: {
          ...shell.widgets,
          [instanceId]: { ...current, props: nextProps },
        },
      };
      try {
        await commitRevision(next, `Updated ${current.type} props`);
        toast.success("Saved");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to save changes",
        );
      }
    },
    [shell, commitRevision],
  );

  const addWidget = useCallback(
    (slug: string) => {
      const mod = widgetCatalog.find((m) => m.meta.slug === slug);
      if (!mod) return;
      const instanceId = `${slug}-${Date.now().toString(36).slice(-5)}`;
      const next = withAddedWidget(shell, instanceId, slug, mod.defaultProps);
      startTransition(async () => {
        try {
          await commitRevision(next, `Added ${mod.meta.name} widget`);
          toast.success(`Added ${mod.meta.name}`);
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Failed to add widget",
          );
        }
      });
    },
    [widgetCatalog, shell, commitRevision],
  );

  const removeWidget = useCallback(
    (instanceId: string) => {
      const current = shell.widgets[instanceId];
      if (!current) return;
      const next = withRemovedWidget(shell, instanceId);
      if (!next) {
        toast.error("Can't remove the last widget — frames need at least one.");
        return;
      }
      startTransition(async () => {
        try {
          await commitRevision(next, `Removed ${current.type} widget`);
          toast.success(`Removed ${current.type}`);
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Failed to remove widget",
          );
        }
      });
    },
    [shell, commitRevision],
  );

  const revertTo = useCallback(
    (target: RevisionSummary) => {
      startTransition(async () => {
        try {
          const res = await fetch(`/api/frames/${frame.id}/revert`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetRevisionId: target.id }),
          });
          if (!res.ok) {
            const body = (await res.json().catch(() => null)) as
              | { error?: string }
              | null;
            throw new Error(body?.error ?? `HTTP ${res.status}`);
          }
          toast.success(
            `Reverted to ${target.id.slice(0, 8)} — created a new revision`,
          );
          // Pull authoritative state back from the server.
          router.refresh();
          setHistoryOpen(false);
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Failed to revert",
          );
        }
      });
    },
    [frame.id, router],
  );

  const handleAgentRatified = useCallback(
    (newShell: Shell) => {
      // The proposal card already wrote the revision to the server. Pull the
      // fresh revision list from the server (and the new active revisionId)
      // by refreshing this segment. The dock stays mounted; the chat
      // conversation persists across the refresh because it lives client-side.
      setShell(newShell);
      router.refresh();
    },
    [router],
  );

  const renderWidget = useCallback(
    (instanceId: string) => {
      const instance = shell.widgets[instanceId];
      if (!instance) {
        return (
          <div className="text-muted-foreground p-4 text-sm">
            Missing widget instance: <code>{instanceId}</code>
          </div>
        );
      }
      return (
        <div className="relative h-full w-full">
          <WidgetHost
            instance={instance}
            host={{
              instanceId,
              editing,
              updateProps: (next) =>
                updateWidgetProps(instanceId, next),
            }}
          />
          {editing ? (
            <button
              type="button"
              onClick={() => removeWidget(instanceId)}
              className={cn(
                "border-border bg-background/80 text-muted-foreground hover:text-destructive",
                "absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-md border backdrop-blur",
                "shadow-sm transition-colors",
              )}
              aria-label={`Remove widget ${instanceId}`}
              disabled={pending}
            >
              <Trash2 className="size-3.5" />
            </button>
          ) : null}
        </div>
      );
    },
    [shell.widgets, editing, updateWidgetProps, removeWidget, pending],
  );

  const placedSet = useMemo(() => collectIds(shell.layout), [shell.layout]);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-1 flex-col",
        ffClass,
      )}
      style={wrapperStyle}
    >
      <header className="bg-background sticky top-0 z-10 border-b">
        <div className="flex items-center gap-2 px-4 py-2.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href="/frames"
                  className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-8 items-center justify-center rounded-md transition-colors"
                  aria-label="Back to frames"
                />
              }
            >
              <ArrowLeft className="size-4" />
            </TooltipTrigger>
            <TooltipContent>Back to frames</TooltipContent>
          </Tooltip>

          <div className="flex min-w-0 flex-col">
            <span className="text-foreground truncate text-sm font-semibold tracking-tight">
              {frame.name}
            </span>
            <span className="text-muted-foreground font-mono text-[0.65rem] tracking-[0.16em] uppercase">
              {frame.template} · rev {revisionId.slice(0, 8)}
            </span>
          </div>

          {pending ? (
            <Loader2
              className="text-muted-foreground ml-2 size-3.5 animate-spin"
              aria-hidden
            />
          ) : null}

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              size="sm"
              variant={chatOpen ? "default" : "outline"}
              onClick={() => setChatOpen((v) => !v)}
              aria-pressed={chatOpen}
            >
              <MessageSquare data-icon="inline-start" />
              Agent
            </Button>

            <Button
              size="sm"
              variant={editing ? "default" : "outline"}
              onClick={() => setEditing((v) => !v)}
              aria-pressed={editing}
            >
              {editing ? (
                <>
                  <Eye data-icon="inline-start" />
                  Done
                </>
              ) : (
                <>
                  <Pencil data-icon="inline-start" />
                  Edit
                </>
              )}
            </Button>

            <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
              <SheetTrigger
                render={
                  <Button size="sm" variant="ghost">
                    <History data-icon="inline-start" />
                    History
                    <Badge variant="secondary" className="ml-1 font-mono">
                      {revisions.length}
                    </Badge>
                  </Button>
                }
              />
              <SheetContent side="right" className="sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Revision history</SheetTitle>
                  <SheetDescription>
                    Every change creates an immutable revision. Reverts also
                    create a new revision — history is append-only.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-auto px-4 pb-4">
                  <ol className="flex flex-col gap-1.5">
                    {revisions.map((r) => {
                      const isActive = r.id === revisionId;
                      return (
                        <li
                          key={r.id}
                          className={cn(
                            "border-border rounded-md border p-3",
                            isActive && "bg-muted/50",
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <Badge
                              variant={
                                r.authoredBy === "agent"
                                  ? "default"
                                  : r.authoredBy === "revert"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="font-mono"
                            >
                              {r.authoredBy}
                            </Badge>
                            <code className="text-muted-foreground font-mono text-[0.65rem]">
                              {r.id.slice(0, 8)}
                            </code>
                            <span className="text-muted-foreground ml-auto text-[0.65rem]">
                              {timeAgo(r.createdAt)}
                            </span>
                          </div>
                          {r.reasoning ? (
                            <p className="text-foreground/80 mt-1.5 text-sm">
                              {r.reasoning}
                            </p>
                          ) : null}
                          <div className="mt-2 flex items-center gap-2">
                            {isActive ? (
                              <span className="text-muted-foreground text-xs">
                                Active
                              </span>
                            ) : (
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => revertTo(r)}
                                disabled={pending}
                              >
                                Revert here
                              </Button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </SheetContent>
            </Sheet>

            <Separator orientation="vertical" className="mx-1 h-6" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Frame theme"
              onClick={() => setThemeSheetOpen(true)}
            >
              <Palette className="size-4" />
            </Button>
            <ThemeManagerSheet
              open={themeSheetOpen}
              onOpenChange={setThemeSheetOpen}
              scope="frame"
              shell={shell}
              onApplyFrameTheme={applyFrameTheme}
            />
            <ThemeToggle />
          </div>
        </div>

        {editing ? (
          <div className="bg-muted/40 flex items-center gap-2 border-t px-4 py-2">
            <span className="text-muted-foreground font-mono text-[0.65rem] tracking-[0.16em] uppercase">
              Add widget
            </span>
            <div className="flex flex-wrap gap-1.5">
              {widgetCatalog.map((m) => (
                <Button
                  key={m.meta.slug}
                  size="xs"
                  variant="outline"
                  onClick={() => addWidget(m.meta.slug)}
                  disabled={pending}
                >
                  <Plus data-icon="inline-start" />
                  {m.meta.name}
                </Button>
              ))}
            </div>
            {placedSet.size === 0 ? (
              <span className="text-destructive ml-auto inline-flex items-center gap-1 text-xs">
                <X className="size-3" />
                Frame has no widgets
              </span>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <ShellLayout
            node={shell.layout}
            renderWidget={renderWidget}
            layoutKey={frame.id}
            className="bg-muted/20"
          />
        </div>
        <ChatDock
          frameId={frame.id}
          currentShell={shell}
          parentRevisionId={revisionId}
          onRatified={handleAgentRatified}
          open={chatOpen}
          onOpenChange={setChatOpen}
        />
      </div>
    </div>
  );
}

/* ---------------------------- shell mutations ---------------------------- */

function collectIds(node: LayoutNode, into = new Set<string>()): Set<string> {
  if (node.kind === "widget") {
    into.add(node.instanceId);
    return into;
  }
  for (const c of node.children) collectIds(c, into);
  return into;
}

function withAddedWidget(
  shell: Shell,
  instanceId: string,
  type: string,
  defaultProps: Record<string, unknown>,
): Shell {
  const widget: WidgetInstance = { type, props: { ...defaultProps } };

  // If the current root is a single widget, wrap it in a horizontal split.
  if (shell.layout.kind === "widget") {
    const rootSplit: LayoutNode = {
      kind: "split",
      direction: "horizontal",
      sizes: [50, 50],
      children: [
        shell.layout,
        { kind: "widget", instanceId },
      ],
    };
    return {
      ...shell,
      layout: rootSplit,
      widgets: { ...shell.widgets, [instanceId]: widget },
    };
  }

  // Otherwise, append at the end of the top-level split.
  const childCount = shell.layout.children.length + 1;
  const evenSize = Math.round(100 / childCount);
  // Build sizes that sum to 100 within the schema's tolerance.
  const sizes = Array.from({ length: childCount }, (_, i) =>
    i === childCount - 1
      ? 100 - evenSize * (childCount - 1)
      : evenSize,
  );

  const rootSplit: LayoutNode = {
    kind: "split",
    direction: shell.layout.direction,
    sizes,
    children: [
      ...shell.layout.children,
      { kind: "widget", instanceId },
    ],
  };
  return {
    ...shell,
    layout: rootSplit,
    widgets: { ...shell.widgets, [instanceId]: widget },
  };
}

function withRemovedWidget(shell: Shell, instanceId: string): Shell | null {
  const placed = collectIds(shell.layout);
  if (!placed.has(instanceId)) return null;
  if (placed.size <= 1) return null;

  const newLayout = stripFromLayout(shell.layout, instanceId);
  if (!newLayout) return null;
  const { [instanceId]: _removed, ...rest } = shell.widgets;
  void _removed;
  return { ...shell, layout: newLayout, widgets: rest };
}

function stripFromLayout(
  node: LayoutNode,
  instanceId: string,
): LayoutNode | null {
  if (node.kind === "widget") {
    return node.instanceId === instanceId ? null : node;
  }
  const remaining = node.children
    .map((c) => stripFromLayout(c, instanceId))
    .filter((c): c is LayoutNode => c !== null);
  if (remaining.length === 0) return null;
  if (remaining.length === 1) return remaining[0] ?? null;
  // Distribute sizes evenly when the count changes.
  const evenSize = Math.round(100 / remaining.length);
  const sizes = Array.from({ length: remaining.length }, (_, i) =>
    i === remaining.length - 1
      ? 100 - evenSize * (remaining.length - 1)
      : evenSize,
  );
  return {
    kind: "split",
    direction: node.direction,
    sizes,
    children: remaining,
  };
}

/* ------------------------------- helpers -------------------------------- */

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.round(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
