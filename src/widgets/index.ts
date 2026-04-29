import type { AnyWidgetModule } from "./types";
import blankCanvas from "./blank-canvas/widget";
import integrationRail from "./integration-rail/widget";
import integrationsAtlas from "./integrations-atlas/widget";
import markdownNotes from "./markdown-notes/widget";
import roleCommandCenter from "./role-command-center/widget";
import webPreview from "./web-preview/widget";

/**
 * Widget registry. Adding a new widget is two steps:
 *  1. Create `src/widgets/<slug>/widget.tsx` exporting a default `WidgetModule`.
 *  2. Add the import to this file.
 *
 * v1 keeps registration explicit so the bundler can statically include each
 * widget. A real auto-discovery pass (filesystem walk + dynamic import) is
 * a v1.5 task; the contract is the same either way.
 */
// `WidgetModule` is invariant in its prop type, so the cast through `unknown`
// is required when collecting modules with different concrete prop shapes
// into a single registry. The `WidgetHost` validates each instance's props
// against the module's own schema before rendering, so the loss of static
// info at the registry boundary is safe at runtime.
const visibleModules: AnyWidgetModule[] = [
  blankCanvas as unknown as AnyWidgetModule,
  integrationRail as unknown as AnyWidgetModule,
  markdownNotes as unknown as AnyWidgetModule,
  roleCommandCenter as unknown as AnyWidgetModule,
  webPreview as unknown as AnyWidgetModule,
];

const renderModules: AnyWidgetModule[] = [
  ...visibleModules,
  // Existing saved frames from prior iterations can still render the atlas,
  // but new users discover integrations from the toolbar sheet instead.
  integrationsAtlas as unknown as AnyWidgetModule,
];

const bySlug = new Map<string, AnyWidgetModule>(
  renderModules.map((m) => [m.meta.slug, m]),
);

export function listWidgets(): AnyWidgetModule[] {
  return visibleModules;
}

export function getWidget(slug: string): AnyWidgetModule | undefined {
  return bySlug.get(slug);
}

export function widgetSlugs(): string[] {
  return visibleModules.map((m) => m.meta.slug);
}
