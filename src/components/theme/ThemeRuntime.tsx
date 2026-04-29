"use client";

import { useEffect } from "react";

import { serializeGlobalThemeStyle } from "@/lib/theme/resolve";
import type { GlobalThemeState } from "@/lib/theme/schema";

const STYLE_ID = "agent-x-global-theme";

/**
 * Injects merged global palette into `:root` / `.dark` so non-frame routes pick up
 * prefs-driven theming. Frame routes additionally wrap content with scoped vars.
 */
export function ThemeRuntime({ global }: { global: GlobalThemeState }) {
  useEffect(() => {
    const css = serializeGlobalThemeStyle(global);
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ID;
      document.head.append(el);
    }
    el.textContent = css;
  }, [global]);

  return null;
}
