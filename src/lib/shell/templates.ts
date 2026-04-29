import type { Shell } from "./schema";
import { SHELL_VERSION } from "./schema";

/**
 * Built-in template seeds. Each template is a function so the caller can
 * stamp a fresh `id` per shell while keeping the rest of the document
 * deterministic.
 *
 * Templates are intentionally simple in P1 — they exist to prove the
 * config-driven shell, not to be the user's preferred surface. Phase 5
 * (TASK-29..33) brings the rich templates.
 */

export interface TemplateMeta {
  slug: string;
  name: string;
  description: string;
  icon: string;
}

export interface Template extends TemplateMeta {
  build: (id: string) => Shell;
}

export const TEMPLATES: Template[] = [
  {
    slug: "daily-operator",
    name: "Daily Operator",
    description:
      "App-shell layout: left integration rail, stacked notes + web preview, bottom integrations atlas for mocked APIs.",
    icon: "calendar-clock",
    build: (id) => ({
      $schema: SHELL_VERSION,
      id,
      name: "Daily Operator",
      template: "daily-operator",
      layout: {
        kind: "split",
        direction: "horizontal",
        sizes: [20, 80],
        children: [
          { kind: "widget", instanceId: "rail-1" },
          {
            kind: "split",
            direction: "vertical",
            sizes: [58, 42],
            children: [
              {
                kind: "split",
                direction: "horizontal",
                sizes: [50, 50],
                children: [
                  { kind: "widget", instanceId: "notes-1" },
                  { kind: "widget", instanceId: "preview-1" },
                ],
              },
              { kind: "widget", instanceId: "atlas-1" },
            ],
          },
        ],
      },
      widgets: {
        "rail-1": {
          type: "integration-rail",
          props: {
            productLabel: "Agent X",
          },
        },
        "notes-1": {
          type: "markdown-notes",
          props: {
            title: "Today",
            content:
              "# Today\n\n- [ ] Write the morning brief\n- [ ] Review yesterday's loose ends\n- [ ] One thing that would make today a win\n",
          },
        },
        "preview-1": {
          type: "web-preview",
          props: {
            title: "Workspace",
            url: "https://example.com",
          },
        },
        "atlas-1": {
          type: "integrations-atlas",
          props: {
            title: "Middleware catalog",
          },
        },
      },
      metadata: {
        description:
          "Operator console: integration rail, notes + preview stack, integrations atlas strip.",
        icon: "calendar-clock",
      },
    }),
  },
  {
    slug: "scratch",
    name: "Scratchpad",
    description:
      "A single notes panel. The simplest possible shell — useful for sanity-checking edits and revisions.",
    icon: "notebook-pen",
    build: (id) => ({
      $schema: SHELL_VERSION,
      id,
      name: "Scratchpad",
      template: "scratch",
      layout: { kind: "widget", instanceId: "notes-1" },
      widgets: {
        "notes-1": {
          type: "markdown-notes",
          props: {
            title: "Scratch",
            content:
              "# Scratchpad\n\nA single notes panel. Use it to draft, paste, think.\n",
          },
        },
      },
      metadata: {
        description: "Single-panel notes surface.",
        icon: "notebook-pen",
      },
    }),
  },
];

export function findTemplate(slug: string): Template | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}
