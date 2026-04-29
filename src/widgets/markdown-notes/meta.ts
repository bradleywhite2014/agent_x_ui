import { z } from "zod";

import type { WidgetMeta } from "../types";

/**
 * Server-importable metadata for the markdown-notes widget. Kept in its own
 * module so the capability catalog (and other server code) can read it
 * without pulling in the React component, which is `"use client"`.
 */

export const propsSchema = z.object({
  title: z.string().max(80).optional(),
  content: z.string().default(""),
  placeholder: z.string().max(120).optional(),
});

export type Props = z.infer<typeof propsSchema>;

export const defaultProps: Props = {
  title: "Notes",
  content: "",
  placeholder: "Write something…",
};

export const meta: WidgetMeta = {
  slug: "markdown-notes",
  name: "Notes",
  description: "A plain-text notes panel. Use Cmd/Ctrl+S to save.",
  icon: "notebook-pen",
};
