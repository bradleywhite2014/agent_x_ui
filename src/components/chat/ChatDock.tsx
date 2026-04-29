"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart, getToolName } from "ai";
import {
  ArrowRight,
  Bot,
  Loader2,
  MessageSquare,
  PanelRightClose,
  Sparkles,
  User2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ProposalCard,
  ProposalErrorCard,
  type ProposalEnvelope,
  type ProposalErrorEnvelope,
} from "./ProposalCard";
import type { Shell } from "@/lib/shell/schema";
import { cn } from "@/lib/utils";

export interface ChatDockProps {
  frameId: string;
  currentShell: Shell;
  parentRevisionId: string;
  onRatified: (newShell: Shell) => void;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}

const PROPOSER_NAMES = new Set(["proposeShell", "proposeWidgetAddition"]);

export function ChatDock({
  frameId,
  currentShell,
  parentRevisionId,
  onRatified,
  open,
  onOpenChange,
}: ChatDockProps) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ frameId }),
      }),
    [frameId],
  );

  const { messages, sendMessage, status, error, clearError } = useChat({
    transport,
  });

  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function submit() {
    const text = draft.trim();
    if (!text) return;
    if (status === "submitted" || status === "streaming") return;
    sendMessage({ text });
    setDraft("");
  }

  if (!open) {
    return (
      <div className="border-l">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenChange(true)}
          className="text-muted-foreground hover:text-foreground h-full rounded-none px-3"
          aria-label="Open agent chat"
        >
          <MessageSquare className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "border-border bg-background flex w-[24rem] shrink-0 flex-col border-l",
        "min-h-0",
      )}
      aria-label="Agent chat"
    >
      <header className="flex items-center gap-2 border-b px-3 py-2">
        <Sparkles className="text-primary size-4" />
        <div className="flex flex-col">
          <span className="text-foreground text-sm font-semibold">
            Agent X
          </span>
          <span className="text-muted-foreground font-mono text-[0.6rem] tracking-[0.16em] uppercase">
            catalog-driven · proposals only
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenChange(false)}
          className="ml-auto"
          aria-label="Collapse agent chat"
        >
          <PanelRightClose className="size-4" />
        </Button>
      </header>

      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-3 overflow-y-auto p-3"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((m) => (
            <MessageRow
              key={m.id}
              message={m}
              currentShell={currentShell}
              parentRevisionId={parentRevisionId}
              frameId={frameId}
              onRatified={onRatified}
            />
          ))
        )}
        {status === "submitted" || status === "streaming" ? (
          <div className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            <Loader2 className="size-3 animate-spin" />
            agent thinking…
          </div>
        ) : null}
        {error ? (
          <div className="border-destructive/40 bg-destructive/5 text-destructive flex items-start gap-2 rounded-md border p-2 text-xs">
            <X className="mt-0.5 size-3" />
            <div className="flex-1">
              <div className="font-medium">Chat error</div>
              <div className="text-foreground/80">{error.message}</div>
            </div>
            <button
              onClick={clearError}
              className="text-foreground/60 hover:text-foreground"
              aria-label="Dismiss error"
            >
              <X className="size-3" />
            </button>
          </div>
        ) : null}
      </div>

      <form
        className="border-t p-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="border-border focus-within:border-ring flex items-end gap-1.5 rounded-md border p-1.5 transition-colors">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask Agent X to add or restructure widgets…"
            rows={2}
            className="placeholder:text-muted-foreground min-h-[2.5rem] flex-1 resize-none bg-transparent px-1.5 py-1 text-sm focus:outline-none"
            aria-label="Message Agent X"
          />
          <Button
            type="submit"
            size="sm"
            disabled={
              !draft.trim() || status === "submitted" || status === "streaming"
            }
            aria-label="Send message"
          >
            <ArrowRight className="size-4" />
          </Button>
        </div>
        <div className="text-muted-foreground mt-1 px-1 text-[10px]">
          Enter to send · Shift+Enter for newline · Agent only sees frame
          structure, not contents
        </div>
      </form>
    </aside>
  );
}

function MessageRow({
  message,
  currentShell,
  parentRevisionId,
  frameId,
  onRatified,
}: {
  message: ReturnType<typeof useChat>["messages"][number];
  currentShell: Shell;
  parentRevisionId: string;
  frameId: string;
  onRatified: (newShell: Shell) => void;
}) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex gap-2",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser ? (
        <div className="bg-primary/10 text-primary mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full">
          <Bot className="size-3.5" />
        </div>
      ) : null}
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-1.5 rounded-md text-sm",
          isUser
            ? "bg-primary text-primary-foreground px-3 py-2"
            : "text-foreground",
        )}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <p key={i} className={cn(!isUser && "leading-relaxed")}>
                {part.text}
              </p>
            );
          }
          if (isToolUIPart(part)) {
            const toolName = getToolName(part);
            if (!PROPOSER_NAMES.has(toolName as string)) {
              return (
                <ToolFallback key={i} name={toolName as string} state={part.state} />
              );
            }
            if (part.state === "input-streaming" || part.state === "input-available") {
              return (
                <ToolPending key={i} name={toolName as string} />
              );
            }
            if (part.state === "output-available") {
              const out = part.output as
                | { ok: true; proposal: ProposalEnvelope }
                | { ok: false; error: ProposalErrorEnvelope };
              if (out.ok) {
                return (
                  <ProposalCard
                    key={i}
                    proposal={out.proposal}
                    currentShell={currentShell}
                    parentRevisionId={parentRevisionId}
                    frameId={frameId}
                    onRatified={onRatified}
                  />
                );
              }
              return <ProposalErrorCard key={i} error={out.error} />;
            }
            if (part.state === "output-error") {
              return (
                <ProposalErrorCard
                  key={i}
                  error={{ code: "tool_error", message: part.errorText }}
                />
              );
            }
          }
          return null;
        })}
      </div>
      {isUser ? (
        <div className="bg-muted text-muted-foreground mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full">
          <User2 className="size-3.5" />
        </div>
      ) : null}
    </div>
  );
}

function ToolPending({ name }: { name: string }) {
  return (
    <div className="border-border bg-muted/30 flex items-center gap-1.5 rounded-md border p-2 text-xs">
      <Loader2 className="size-3 animate-spin" />
      <code className="font-mono text-[11px]">{name}</code>
      <span className="text-muted-foreground">building proposal…</span>
    </div>
  );
}

function ToolFallback({
  name,
  state,
}: {
  name: string;
  state: string;
}) {
  return (
    <div className="border-border bg-muted/30 flex items-center gap-1.5 rounded-md border p-2 text-xs">
      <Badge variant="outline" className="font-mono text-[10px]">
        tool
      </Badge>
      <code className="font-mono text-[11px]">{name}</code>
      <span className="text-muted-foreground ml-auto text-[10px]">{state}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
      <Sparkles className="text-primary size-5" />
      <p className="text-foreground text-sm font-medium">
        Hi. I read the capability catalog, not your data.
      </p>
      <p className="text-xs leading-relaxed">
        Tell me what to add, restructure, or build from scratch. I propose; you
        ratify. I cannot read your widget contents or the database.
      </p>
      <ul className="text-foreground/70 mt-1 list-disc pl-4 text-left text-[11px]">
        <li>&ldquo;Add a markdown notes widget next to the preview&rdquo;</li>
        <li>&ldquo;Replace the preview with two side-by-side notes&rdquo;</li>
        <li>&ldquo;Give me a research workspace from scratch&rdquo;</li>
      </ul>
    </div>
  );
}
