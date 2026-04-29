import type { ComponentType } from "react";
import type { z } from "zod";

/**
 * Public widget contract. Every widget folder under `src/widgets/<slug>/`
 * exports a default `WidgetModule` that satisfies this shape.
 *
 * Widgets are pure: they receive `props` (validated by the widget's own
 * `propsSchema`) and a small `host` API for emitting prop updates back to
 * the shell. They never read from globals; everything that affects render
 * lives in `props`.
 */
export interface WidgetMeta {
  slug: string;
  name: string;
  description: string;
  icon: string;
}

export interface WidgetHostApi {
  /** Stable id of the widget instance in the shell document. */
  instanceId: string;
  /**
   * Whether the surrounding shell is currently in edit mode.
   * Widgets use this to decide whether to expose configuration UI.
   */
  editing: boolean;
  /**
   * Propose a partial update to this widget's props. The shell will:
   *  1. validate the new props against the widget's `propsSchema`
   *  2. write a new revision with reasoning = "Updated <slug> props"
   *  3. re-render with the new value
   *
   * The promise resolves once the revision is persisted.
   */
  updateProps: (next: Record<string, unknown>) => Promise<void>;
}

export interface WidgetComponentProps<TProps> {
  props: TProps;
  host: WidgetHostApi;
}

export interface WidgetModule<TProps = Record<string, unknown>> {
  meta: WidgetMeta;
  propsSchema: z.ZodType<TProps>;
  defaultProps: TProps;
  Component: ComponentType<WidgetComponentProps<TProps>>;
}

/**
 * Loose-typed variant used by the registry. Real widgets keep their narrow
 * generic at the call site.
 */
export type AnyWidgetModule = WidgetModule<Record<string, unknown>>;
