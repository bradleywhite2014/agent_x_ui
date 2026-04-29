import type { CSSProperties } from "react";

import type { ThemeOverride } from "@/lib/shell/schema";

import {
  type CssVarRecord,
  type Density,
  DENSITY_MULTIPLIER,
  type FontFamilyPreference,
  getPreset,
  type ThemePresetId,
  toCssCustomProps,
  type CssVarKey,
} from "./tokens";

import type { GlobalThemeState } from "./schema";

export function defaultGlobalThemeState(): GlobalThemeState {
  return {
    presetId: "default",
    density: "normal",
    fontFamily: "sans",
  };
}

function flattenLegacyTokens(
  theme: ThemeOverride | undefined,
): { light?: CssVarRecord; dark?: CssVarRecord } {
  if (!theme?.tokens || typeof theme.tokens !== "object") return {};
  const legacy = theme.tokens as Record<string, unknown>;
  const stripEntries = Object.fromEntries(
    Object.entries(legacy).filter(([, v]) => typeof v === "string"),
  ) as CssVarRecord;
  return { light: stripEntries };
}

function paletteRecordFromOverrides(o?: CssVarRecord): CssVarRecord {
  return { ...(o ?? {}) };
}

/**
 * Merge global palette + optional frame override into one CssVarRecord for the
 * active color mode (`resolvedDark` mirrors `.dark` on `document.documentElement`).
 */
export function resolveMergedPalette(
  global: GlobalThemeState,
  frame: ThemeOverride | undefined,
  resolvedDark: boolean,
): CssVarRecord {
  const mode = resolvedDark ? "dark" : "light";
  const gp = getPreset(global.presetId).palettes[mode];

  let merged: CssVarRecord = { ...gp };
  merged = {
    ...merged,
    ...paletteRecordFromOverrides(
      mode === "light" ? global.overridesLight : global.overridesDark,
    ),
  };

  if (frame?.presetId) {
    const fp = getPreset(frame.presetId).palettes[mode];
    merged = { ...merged, ...fp };
  }

  const frameOv =
    mode === "light" ? frame?.overridesLight : frame?.overridesDark;
  merged = { ...merged, ...paletteRecordFromOverrides(frameOv) };

  const legacy = flattenLegacyTokens(frame);
  merged = { ...merged, ...paletteRecordFromOverrides(legacy[mode]) };

  return merged;
}

export function resolvedDensity(
  global: GlobalThemeState,
  frame: ThemeOverride | undefined,
): Density {
  return frame?.density ?? global.density ?? "normal";
}

export function resolvedFontFamily(
  global: GlobalThemeState,
  frame: ThemeOverride | undefined,
): FontFamilyPreference {
  return frame?.fontFamily ?? global.fontFamily ?? "sans";
}

/** React `style` props for a themed wrapper — sets semantic vars + `--density`. */
export function buildThemeWrapperStyle(
  global: GlobalThemeState,
  frame: ThemeOverride | undefined,
  resolvedDark: boolean,
): CSSProperties {
  const palette = resolveMergedPalette(global, frame, resolvedDark);
  const density = resolvedDensity(global, frame);
  const css = toCssCustomProps(palette);
  css["--density"] = String(DENSITY_MULTIPLIER[density]);
  return css as CSSProperties;
}

/** Inline font stack — uses Next.js font CSS variables from layout. */
export function fontFamilyClass(
  global: GlobalThemeState,
  frame: ThemeOverride | undefined,
): string {
  const ff = resolvedFontFamily(global, frame);
  return ff === "mono" ? "font-mono" : "font-sans";
}

/**
 * Serialize global-only theme into `<style>` blocks for `:root` and `.dark`.
 * Used by ThemeRuntime to paint non-frame routes.
 */
export function serializeGlobalThemeStyle(global: GlobalThemeState): string {
  const gp = getPreset(global.presetId);
  const ol = {
    ...gp.palettes.light,
    ...paletteRecordFromOverrides(global.overridesLight),
  };
  const od = {
    ...gp.palettes.dark,
    ...paletteRecordFromOverrides(global.overridesDark),
  };
  const density = DENSITY_MULTIPLIER[global.density ?? "normal"];

  const rootVars = { ...toCssCustomProps(ol), "--density": String(density) };
  const darkVars = { ...toCssCustomProps(od), "--density": String(density) };

  const rootBody = Object.entries(rootVars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");
  const darkBody = Object.entries(darkVars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");

  return `:root {\n${rootBody}\n}\n.dark {\n${darkBody}\n}`;
}

/** Keys safe to expose as editable targets in Theme Manager (subset). */
export const EDITABLE_THEME_KEYS: readonly CssVarKey[] = [
  "primary",
  "secondary",
  "accent",
  "background",
  "foreground",
  "muted",
  "border",
  "destructive",
  "radius",
];

export function resetPresetState(presetId: ThemePresetId): GlobalThemeState {
  return {
    presetId,
    density: "normal",
    fontFamily: "sans",
    overridesLight: undefined,
    overridesDark: undefined,
  };
}
