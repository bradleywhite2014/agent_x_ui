import type { z } from "zod";

import type { WidgetMeta } from "./types";
import * as markdownNotesMeta from "./markdown-notes/meta";
import * as webPreviewMeta from "./web-preview/meta";

/**
 * Server-importable widget registry. Contains only metadata + props schema +
 * default props — never the React component (which is `"use client"` and
 * would break server-only consumers like `/api/capabilities`).
 *
 * Client code (`WidgetHost`, `ShellView`, etc.) keeps using `@/widgets`,
 * which exports the full `WidgetModule` including the rendered component.
 */
export interface WidgetMetaEntry {
  meta: WidgetMeta;
  propsSchema: z.ZodType<Record<string, unknown>>;
  defaultProps: Record<string, unknown>;
}

const entries: WidgetMetaEntry[] = [
  {
    meta: markdownNotesMeta.meta,
    propsSchema: markdownNotesMeta.propsSchema as unknown as z.ZodType<Record<string, unknown>>,
    defaultProps: markdownNotesMeta.defaultProps as unknown as Record<string, unknown>,
  },
  {
    meta: webPreviewMeta.meta,
    propsSchema: webPreviewMeta.propsSchema as unknown as z.ZodType<Record<string, unknown>>,
    defaultProps: webPreviewMeta.defaultProps as unknown as Record<string, unknown>,
  },
];

const bySlug = new Map<string, WidgetMetaEntry>(
  entries.map((e) => [e.meta.slug, e]),
);

export function listWidgetMetas(): WidgetMetaEntry[] {
  return entries;
}

export function getWidgetMeta(slug: string): WidgetMetaEntry | undefined {
  return bySlug.get(slug);
}

export function widgetMetaSlugs(): string[] {
  return entries.map((e) => e.meta.slug);
}
