import { z } from "zod";

/**
 * The Shell document — the user-visible work surface, expressed as typed JSON.
 *
 * The agent edits an instance of this shape; the user ratifies, rejects, or
 * reverts the resulting revision. Everything load-bearing about a "frame"
 * (layout, widget instances, theme override) lives here. Anything not
 * captured by this schema is not a real part of the surface.
 */

export const SHELL_VERSION = "agent-x/shell/v1" as const;

const baseSplitSize = z.number().min(5).max(95);

/**
 * Zod 4's discriminated union doesn't auto-recurse through `z.lazy`, so we
 * type the tree manually and use `z.lazy` to break the cycle.
 */
export type LayoutNode = LayoutWidgetNode | LayoutSplitNode;

export interface LayoutWidgetNode {
  kind: "widget";
  instanceId: string;
}

export interface LayoutSplitNode {
  kind: "split";
  direction: "horizontal" | "vertical";
  /** 2-or-more children. Single-child splits are normalized away on save. */
  children: LayoutNode[];
  /** Per-child sizes in percent. Must sum to ~100. Optional → equal split. */
  sizes?: number[];
}

const layoutWidgetSchema: z.ZodType<LayoutWidgetNode> = z.object({
  kind: z.literal("widget"),
  instanceId: z.string().min(1),
});

const layoutSplitSchema: z.ZodType<LayoutSplitNode> = z.lazy(() =>
  z
    .object({
      kind: z.literal("split"),
      direction: z.enum(["horizontal", "vertical"]),
      children: z.array(layoutNodeSchema).min(1).max(8),
      sizes: z.array(baseSplitSize).optional(),
    })
    .refine(
      (node) => node.sizes === undefined || node.sizes.length === node.children.length,
      { message: "split.sizes length must match split.children length" },
    )
    .refine(
      (node) => {
        if (!node.sizes) return true;
        const total = node.sizes.reduce((a, b) => a + b, 0);
        return Math.abs(total - 100) < 1;
      },
      { message: "split.sizes must sum to 100 (±1)" },
    ),
);

export const layoutNodeSchema: z.ZodType<LayoutNode> = z.lazy(() =>
  z.union([layoutWidgetSchema, layoutSplitSchema]),
);

export const widgetInstanceSchema = z.object({
  /** Slug of a registered widget — must match `widgetRegistry[type].meta.slug`. */
  type: z.string().min(1),
  /** Per-widget props, validated by the widget's own `propsSchema`. */
  props: z.record(z.string(), z.unknown()).default({}),
});

export type WidgetInstance = z.infer<typeof widgetInstanceSchema>;

export const themeOverrideSchema = z
  .object({
    presetId: z.string().optional(),
    /** Legacy: merged into light palette only. */
    tokens: z.record(z.string(), z.string()).optional(),
    overridesLight: z.record(z.string(), z.string()).optional(),
    overridesDark: z.record(z.string(), z.string()).optional(),
    density: z.enum(["compact", "normal", "comfortable"]).optional(),
    fontFamily: z.enum(["sans", "mono"]).optional(),
  })
  .optional();

export type ThemeOverride = z.infer<typeof themeOverrideSchema>;

export const shellMetadataSchema = z
  .object({
    description: z.string().max(280).optional(),
    icon: z.string().max(32).optional(),
    pinned: z.boolean().optional(),
  })
  .partial()
  .optional();

export type ShellMetadata = z.infer<typeof shellMetadataSchema>;

export const shellSchema = z
  .object({
    $schema: z.literal(SHELL_VERSION).default(SHELL_VERSION),
    id: z.string().min(1),
    name: z.string().min(1).max(80),
    template: z.string().min(1),
    layout: layoutNodeSchema,
    widgets: z.record(z.string().min(1), widgetInstanceSchema),
    theme: themeOverrideSchema,
    metadata: shellMetadataSchema,
  })
  .superRefine((shell, ctx) => {
    const referenced = collectWidgetRefs(shell.layout);
    for (const id of referenced) {
      if (!shell.widgets[id]) {
        ctx.addIssue({
          code: "custom",
          path: ["layout"],
          message: `Layout references unknown widget instance "${id}".`,
        });
      }
    }
    for (const id of Object.keys(shell.widgets)) {
      if (!referenced.has(id)) {
        ctx.addIssue({
          code: "custom",
          path: ["widgets", id],
          message: `Widget instance "${id}" is defined but not placed in the layout.`,
        });
      }
    }
  });

export type Shell = z.infer<typeof shellSchema>;

/**
 * Walk a layout tree and yield every widget instance id it references.
 * Order is depth-first, document order — used by both validation and rendering.
 */
export function* walkWidgets(node: LayoutNode): Generator<string> {
  if (node.kind === "widget") {
    yield node.instanceId;
    return;
  }
  for (const child of node.children) {
    yield* walkWidgets(child);
  }
}

export function collectWidgetRefs(node: LayoutNode): Set<string> {
  return new Set(walkWidgets(node));
}

/**
 * Validate-and-parse a candidate shell document. Returns the typed value or
 * throws a `ZodError` whose `issues` list points at the first problem path.
 *
 * Use this on every config load and at the boundary of every mutation.
 */
export function validateShell(input: unknown): Shell {
  return shellSchema.parse(input);
}

export function safeValidateShell(input: unknown): {
  ok: true;
  shell: Shell;
} | {
  ok: false;
  error: z.ZodError;
} {
  const parsed = shellSchema.safeParse(input);
  return parsed.success
    ? { ok: true, shell: parsed.data }
    : { ok: false, error: parsed.error };
}
