import { z } from "zod";

const presetEnum = z.enum([
  "default",
  "slate",
  "forest",
  "sunset",
  "mono",
]);

export const globalThemeSchema = z.object({
  presetId: presetEnum,
  overridesLight: z.record(z.string(), z.string()).optional(),
  overridesDark: z.record(z.string(), z.string()).optional(),
  density: z.enum(["compact", "normal", "comfortable"]).optional(),
  fontFamily: z.enum(["sans", "mono"]).optional(),
});

export type GlobalThemeState = z.infer<typeof globalThemeSchema>;
