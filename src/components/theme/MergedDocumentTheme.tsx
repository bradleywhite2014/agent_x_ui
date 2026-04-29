"use client";

import { useLayoutEffect } from "react";

import type { Shell } from "@/lib/shell/schema";
import { serializeMergedDocumentStyle } from "@/lib/theme/resolve";

import { useGlobalTheme } from "./GlobalThemeProvider";

const STYLE_ID = "agent-x-merged-document-theme";

/**
 * While a frame is mounted, re-declares `:root` / `.dark` semantic variables
 * using global prefs **merged with** `shell.theme` so shadcn primitives portaled
 * to `document.body` (Dialog, Sheet, Select, DropdownMenu, …) match the canvas.
 *
 * Must load **after** `#agent-x-global-theme` in document order — ShellView
 * mounts deeper than `ThemeRuntime`, so this stylesheet wins on cascade.
 */
export function MergedDocumentTheme({ shell }: { shell: Shell }) {
  const { global } = useGlobalTheme();

  useLayoutEffect(() => {
    const css = serializeMergedDocumentStyle(global, shell.theme);
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ID;
      document.head.append(el);
    }
    el.textContent = css;
    return () => {
      el?.remove();
    };
  }, [global, shell.theme]);

  return null;
}
