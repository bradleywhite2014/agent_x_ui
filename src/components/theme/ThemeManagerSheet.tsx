"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { Shell, ThemeOverride } from "@/lib/shell/schema";
import {
  EDITABLE_THEME_KEYS,
  resetPresetState,
  defaultGlobalThemeState,
} from "@/lib/theme/resolve";
import type { GlobalThemeState } from "@/lib/theme/schema";
import type { CssVarRecord } from "@/lib/theme/tokens";
import { THEME_PRESETS, THEME_PRESET_IDS } from "@/lib/theme/tokens";
import type { Density } from "@/lib/theme/tokens";

import { useGlobalTheme } from "./GlobalThemeProvider";

/** Frame-local draft — mirrors optional fields on `ThemeOverride`. */
interface ThemeFrameDraft {
  presetId?: string;
  tokens?: Record<string, string>;
  overridesLight?: CssVarRecord;
  overridesDark?: CssVarRecord;
  density?: Density;
  fontFamily?: "sans" | "mono";
}

export interface ThemeManagerSheetProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  scope: "global" | "frame";
  shell?: Shell;
  onApplyFrameTheme?: (next: ThemeOverride | undefined) => Promise<void>;
}

function patchOverridesKey(
  prev: CssVarRecord | undefined,
  key: string,
  value: string,
): CssVarRecord | undefined {
  const next: CssVarRecord = { ...(prev ?? {}) };
  const k = key as keyof CssVarRecord;
  if (!value) {
    delete next[k];
  } else {
    next[k] = value;
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

export function ThemeManagerSheet({
  open,
  onOpenChange,
  scope,
  shell,
  onApplyFrameTheme,
}: ThemeManagerSheetProps) {
  const router = useRouter();
  const { global, setGlobal } = useGlobalTheme();

  const [draftGlobal, setDraftGlobal] = useState<GlobalThemeState>(global);
  const [draftFrame, setDraftFrame] = useState<ThemeFrameDraft>({});
  const [busy, setBusy] = useState(false);

  function handleOpenChange(next: boolean) {
    if (next) {
      if (scope === "global") {
        setDraftGlobal(global);
      } else if (shell) {
        const t = shell.theme;
        setDraftFrame(
          t && typeof t === "object" ? { ...t } : {},
        );
      }
    }
    onOpenChange(next);
  }

  async function saveGlobal() {
    setBusy(true);
    try {
      const res = await fetch("/api/theme/global", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftGlobal),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as { theme: GlobalThemeState };
      setGlobal(body.theme);
      toast.success("Global theme saved");
      router.refresh();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveFrame() {
    if (!onApplyFrameTheme) return;
    const hasKeys =
      draftFrame.presetId ||
      draftFrame.tokens ||
      draftFrame.overridesLight ||
      draftFrame.overridesDark ||
      draftFrame.density ||
      draftFrame.fontFamily;
    const payload: ThemeOverride | undefined = hasKeys
      ? (draftFrame as ThemeOverride)
      : undefined;
    setBusy(true);
    try {
      await onApplyFrameTheme(payload);
      toast.success("Frame theme saved");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  function resetGlobalDefaults() {
    setDraftGlobal(defaultGlobalThemeState());
    toast.message("Defaults loaded — Save to persist.");
  }

  function resetGlobalPresetOnly() {
    setDraftGlobal(resetPresetState(draftGlobal.presetId));
    toast.message("Preset reset — Save to persist.");
  }

  function clearFrameTheme() {
    setDraftFrame({});
    toast.message("Draft cleared — Save to remove frame overrides.");
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Theme Manager</SheetTitle>
          <SheetDescription>
            {scope === "global"
              ? "Global defaults apply everywhere until a frame carries its own overrides."
              : "Overrides apply only to this frame; leave empty to inherit global."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-6 px-4 pb-8">
          <section>
            <h3 className="text-muted-foreground mb-2 font-mono text-[0.65rem] tracking-[0.16em] uppercase">
              Presets
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {THEME_PRESET_IDS.map((id) => {
                const def = THEME_PRESETS[id];
                const active =
                  scope === "global"
                    ? draftGlobal.presetId === id
                    : draftFrame.presetId === id;
                return (
                  <Button
                    key={id}
                    type="button"
                    variant={active ? "default" : "outline"}
                    size="sm"
                    className="justify-start text-left"
                    onClick={() => {
                      if (scope === "global") {
                        setDraftGlobal((d) => ({ ...d, presetId: id }));
                      } else {
                        setDraftFrame((d) => ({ ...d, presetId: id }));
                      }
                    }}
                  >
                    <span className="font-medium">{def.name}</span>
                  </Button>
                );
              })}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-muted-foreground font-mono text-[0.65rem] tracking-[0.16em] uppercase">
              Density
            </h3>
            <div className="flex flex-wrap gap-2">
              {(["compact", "normal", "comfortable"] as const).map((d) => (
                <Button
                  key={d}
                  type="button"
                  size="sm"
                  variant={
                    (scope === "global"
                      ? draftGlobal.density ?? "normal"
                      : draftFrame.density ?? "normal") === d
                      ? "default"
                      : "outline"
                  }
                  onClick={() => {
                    if (scope === "global") {
                      setDraftGlobal((g) => ({ ...g, density: d }));
                    } else {
                      setDraftFrame((f) => ({ ...f, density: d }));
                    }
                  }}
                >
                  {d}
                </Button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-muted-foreground font-mono text-[0.65rem] tracking-[0.16em] uppercase">
              Font
            </h3>
            <div className="flex gap-2">
              {(["sans", "mono"] as const).map((f) => (
                <Button
                  key={f}
                  type="button"
                  size="sm"
                  variant={
                    (scope === "global"
                      ? draftGlobal.fontFamily ?? "sans"
                      : draftFrame.fontFamily ?? "sans") === f
                      ? "default"
                      : "outline"
                  }
                  onClick={() => {
                    if (scope === "global") {
                      setDraftGlobal((g) => ({ ...g, fontFamily: f }));
                    } else {
                      setDraftFrame((fr) => ({ ...fr, fontFamily: f }));
                    }
                  }}
                >
                  {f}
                </Button>
              ))}
            </div>
          </section>

          <Separator />

          <section className="flex flex-col gap-3">
            <h3 className="text-muted-foreground font-mono text-[0.65rem] tracking-[0.16em] uppercase">
              Semantic tokens (light)
            </h3>
            <p className="text-muted-foreground text-xs">
              Overrides apply to every shadcn primitive that reads CSS variables
              (`bg-primary`, `border-border`, `--sidebar-*`, charts, `--radius`,
              …). Empty inherits from the preset for that slot.
            </p>
            <div className="grid max-h-[min(50vh,28rem)] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {EDITABLE_THEME_KEYS.map((key) => (
                <label key={key} className="flex flex-col gap-1">
                  <span className="text-muted-foreground font-mono text-[11px]">
                    {key}
                  </span>
                  <Input
                    value={
                      (scope === "global"
                        ? draftGlobal.overridesLight?.[key as keyof CssVarRecord]
                        : draftFrame.overridesLight?.[key as keyof CssVarRecord]) ??
                      ""
                    }
                    placeholder={`preset ${key}`}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      if (scope === "global") {
                        setDraftGlobal((g) => ({
                          ...g,
                          overridesLight: patchOverridesKey(
                            g.overridesLight,
                            key,
                            v,
                          ),
                        }));
                      } else {
                        setDraftFrame((f) => ({
                          ...f,
                          overridesLight: patchOverridesKey(
                            f.overridesLight,
                            key,
                            v,
                          ),
                        }));
                      }
                    }}
                  />
                </label>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            {scope === "global" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={resetGlobalPresetOnly}
                >
                  <RotateCcw data-icon="inline-start" />
                  Reset preset
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={resetGlobalDefaults}
                >
                  Defaults (Agent X)
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={clearFrameTheme}
              >
                Clear frame overrides
              </Button>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              disabled={busy}
              onClick={scope === "global" ? saveGlobal : saveFrame}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
