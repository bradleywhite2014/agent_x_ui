/**
 * Semantic CSS variables consumed by shadcn/Tailwind v4 + globals.css.
 * Keys omit the leading `--` — resolveThemeVarsToCss prefixes them.
 */

export const CSS_VAR_KEYS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "radius",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
] as const;

export type CssVarKey = (typeof CSS_VAR_KEYS)[number];

export type CssVarRecord = Partial<Record<CssVarKey, string>>;

export type ThemePresetId =
  | "default"
  | "slate"
  | "forest"
  | "sunset"
  | "mono";

export const THEME_PRESET_IDS: readonly ThemePresetId[] = [
  "default",
  "slate",
  "forest",
  "sunset",
  "mono",
];

export type Density = "compact" | "normal" | "comfortable";

export type FontFamilyPreference = "sans" | "mono";

/** Multiplier applied via `--density` on themed wrappers + Shell layout gaps. */
export const DENSITY_MULTIPLIER: Record<Density, number> = {
  compact: 0.82,
  normal: 1,
  comfortable: 1.18,
};

export interface PalettePair {
  light: CssVarRecord;
  dark: CssVarRecord;
}

export interface ThemePresetDefinition {
  id: ThemePresetId;
  name: string;
  description: string;
  palettes: PalettePair;
}

/** Convert `{ background: "oklch(...)" }` → `{ "--background": "oklch(...)" }` */
export function toCssCustomProps(vars: CssVarRecord): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(vars) as (keyof CssVarRecord)[]) {
    const v = vars[key];
    if (v !== undefined) {
      out[`--${String(key)}`] = v;
    }
  }
  return out;
}

/* -------------------------------- Defaults -------------------------------- */

/** Mirrors `:root` in globals.css (light). */
const DEFAULT_LIGHT: CssVarRecord = {
  background: "oklch(1 0 0)",
  foreground: "oklch(0.145 0 0)",
  card: "oklch(1 0 0)",
  "card-foreground": "oklch(0.145 0 0)",
  popover: "oklch(1 0 0)",
  "popover-foreground": "oklch(0.145 0 0)",
  primary: "oklch(0.205 0 0)",
  "primary-foreground": "oklch(0.985 0 0)",
  secondary: "oklch(0.97 0 0)",
  "secondary-foreground": "oklch(0.205 0 0)",
  muted: "oklch(0.97 0 0)",
  "muted-foreground": "oklch(0.556 0 0)",
  accent: "oklch(0.97 0 0)",
  "accent-foreground": "oklch(0.205 0 0)",
  destructive: "oklch(0.577 0.245 27.325)",
  border: "oklch(0.922 0 0)",
  input: "oklch(0.922 0 0)",
  ring: "oklch(0.708 0 0)",
  "chart-1": "oklch(0.87 0 0)",
  "chart-2": "oklch(0.556 0 0)",
  "chart-3": "oklch(0.439 0 0)",
  "chart-4": "oklch(0.371 0 0)",
  "chart-5": "oklch(0.269 0 0)",
  radius: "0.625rem",
  sidebar: "oklch(0.985 0 0)",
  "sidebar-foreground": "oklch(0.145 0 0)",
  "sidebar-primary": "oklch(0.205 0 0)",
  "sidebar-primary-foreground": "oklch(0.985 0 0)",
  "sidebar-accent": "oklch(0.97 0 0)",
  "sidebar-accent-foreground": "oklch(0.205 0 0)",
  "sidebar-border": "oklch(0.922 0 0)",
  "sidebar-ring": "oklch(0.708 0 0)",
};

/** Mirrors `.dark` in globals.css */
const DEFAULT_DARK: CssVarRecord = {
  background: "oklch(0.145 0 0)",
  foreground: "oklch(0.985 0 0)",
  card: "oklch(0.205 0 0)",
  "card-foreground": "oklch(0.985 0 0)",
  popover: "oklch(0.205 0 0)",
  "popover-foreground": "oklch(0.985 0 0)",
  primary: "oklch(0.922 0 0)",
  "primary-foreground": "oklch(0.205 0 0)",
  secondary: "oklch(0.269 0 0)",
  "secondary-foreground": "oklch(0.985 0 0)",
  muted: "oklch(0.269 0 0)",
  "muted-foreground": "oklch(0.708 0 0)",
  accent: "oklch(0.269 0 0)",
  "accent-foreground": "oklch(0.985 0 0)",
  destructive: "oklch(0.704 0.191 22.216)",
  border: "oklch(1 0 0 / 10%)",
  input: "oklch(1 0 0 / 15%)",
  ring: "oklch(0.556 0 0)",
  "chart-1": "oklch(0.87 0 0)",
  "chart-2": "oklch(0.556 0 0)",
  "chart-3": "oklch(0.439 0 0)",
  "chart-4": "oklch(0.371 0 0)",
  "chart-5": "oklch(0.269 0 0)",
  radius: "0.625rem",
  sidebar: "oklch(0.205 0 0)",
  "sidebar-foreground": "oklch(0.985 0 0)",
  "sidebar-primary": "oklch(0.488 0.243 264.376)",
  "sidebar-primary-foreground": "oklch(0.985 0 0)",
  "sidebar-accent": "oklch(0.269 0 0)",
  "sidebar-accent-foreground": "oklch(0.985 0 0)",
  "sidebar-border": "oklch(1 0 0 / 10%)",
  "sidebar-ring": "oklch(0.556 0 0)",
};

function preset(
  id: ThemePresetId,
  name: string,
  description: string,
  light: CssVarRecord,
  dark: CssVarRecord,
): ThemePresetDefinition {
  return {
    id,
    name,
    description,
    palettes: {
      light: { ...DEFAULT_LIGHT, ...light },
      dark: { ...DEFAULT_DARK, ...dark },
    },
  };
}

/**
 * Five curated palettes — light + dark pairs tuned for contrast + hue harmony.
 */
export const THEME_PRESETS: Record<ThemePresetId, ThemePresetDefinition> = {
  default: preset(
    "default",
    "Default",
    "Neutral Agent X baseline — matches shipped globals.",
    {},
    {},
  ),

  slate: preset(
    "slate",
    "Slate",
    "Cool blue-gray surfaces with a crisp indigo primary.",
    {
      primary: "oklch(0.45 0.18 264)",
      "primary-foreground": "oklch(0.99 0 0)",
      secondary: "oklch(0.94 0.015 250)",
      "secondary-foreground": "oklch(0.22 0.03 260)",
      muted: "oklch(0.94 0.012 250)",
      accent: "oklch(0.93 0.025 250)",
      border: "oklch(0.88 0.02 250)",
      sidebar: "oklch(0.97 0.012 250)",
      "sidebar-primary": "oklch(0.45 0.18 264)",
    },
    {
      primary: "oklch(0.72 0.14 264)",
      "primary-foreground": "oklch(0.15 0.03 260)",
      secondary: "oklch(0.28 0.03 260)",
      "secondary-foreground": "oklch(0.96 0.01 250)",
      muted: "oklch(0.28 0.025 260)",
      accent: "oklch(0.30 0.04 260)",
      border: "oklch(1 0 0 / 12%)",
      "sidebar-primary": "oklch(0.72 0.14 264)",
    },
  ),

  forest: preset(
    "forest",
    "Forest",
    "Muted sage surfaces with a deep evergreen primary.",
    {
      primary: "oklch(0.42 0.09 160)",
      "primary-foreground": "oklch(0.99 0.01 160)",
      secondary: "oklch(0.94 0.02 145)",
      muted: "oklch(0.93 0.025 145)",
      accent: "oklch(0.92 0.03 145)",
      border: "oklch(0.88 0.03 145)",
      sidebar: "oklch(0.97 0.015 145)",
      "sidebar-primary": "oklch(0.42 0.09 160)",
    },
    {
      primary: "oklch(0.72 0.11 160)",
      "primary-foreground": "oklch(0.14 0.03 155)",
      secondary: "oklch(0.27 0.03 155)",
      muted: "oklch(0.27 0.035 155)",
      accent: "oklch(0.30 0.045 155)",
      border: "oklch(1 0 0 / 11%)",
      "sidebar-primary": "oklch(0.72 0.11 160)",
    },
  ),

  sunset: preset(
    "sunset",
    "Sunset",
    "Warm cream surfaces with an ember primary.",
    {
      background: "oklch(0.985 0.012 85)",
      foreground: "oklch(0.22 0.04 35)",
      primary: "oklch(0.52 0.19 35)",
      "primary-foreground": "oklch(0.99 0.01 85)",
      secondary: "oklch(0.94 0.03 75)",
      muted: "oklch(0.93 0.035 75)",
      accent: "oklch(0.92 0.04 75)",
      border: "oklch(0.88 0.04 75)",
      sidebar: "oklch(0.97 0.02 85)",
      "sidebar-primary": "oklch(0.52 0.19 35)",
    },
    {
      background: "oklch(0.16 0.03 35)",
      foreground: "oklch(0.96 0.02 85)",
      primary: "oklch(0.72 0.16 35)",
      "primary-foreground": "oklch(0.14 0.03 35)",
      secondary: "oklch(0.26 0.04 40)",
      muted: "oklch(0.26 0.045 40)",
      accent: "oklch(0.30 0.05 40)",
      border: "oklch(1 0 0 / 11%)",
      card: "oklch(0.22 0.035 35)",
      popover: "oklch(0.22 0.035 35)",
      sidebar: "oklch(0.20 0.035 35)",
      "sidebar-primary": "oklch(0.72 0.16 35)",
    },
  ),

  mono: preset(
    "mono",
    "Mono",
    "High-contrast monochrome — minimal hue.",
    {
      primary: "oklch(0.25 0 0)",
      "primary-foreground": "oklch(1 0 0)",
      secondary: "oklch(0.93 0 0)",
      "secondary-foreground": "oklch(0.20 0 0)",
      muted: "oklch(0.93 0 0)",
      "muted-foreground": "oklch(0.45 0 0)",
      accent: "oklch(0.92 0 0)",
      border: "oklch(0.88 0 0)",
      sidebar: "oklch(0.97 0 0)",
      "sidebar-primary": "oklch(0.25 0 0)",
      ring: "oklch(0.45 0 0)",
    },
    {
      primary: "oklch(0.92 0 0)",
      "primary-foreground": "oklch(0.15 0 0)",
      secondary: "oklch(0.28 0 0)",
      "secondary-foreground": "oklch(0.96 0 0)",
      muted: "oklch(0.28 0 0)",
      "muted-foreground": "oklch(0.65 0 0)",
      accent: "oklch(0.30 0 0)",
      border: "oklch(1 0 0 / 14%)",
      sidebar: "oklch(0.20 0 0)",
      "sidebar-primary": "oklch(0.92 0 0)",
      ring: "oklch(0.65 0 0)",
    },
  ),
};

export function getPreset(id: string | undefined): ThemePresetDefinition {
  if (id && id in THEME_PRESETS) {
    return THEME_PRESETS[id as ThemePresetId];
  }
  return THEME_PRESETS.default;
}
