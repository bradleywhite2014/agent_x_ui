"use client";

import { AlertTriangle } from "lucide-react";

import type { WidgetInstance } from "@/lib/shell/schema";
import { getWidget } from "@/widgets";
import type { WidgetHostApi } from "@/widgets/types";

export interface WidgetHostProps {
  instance: WidgetInstance;
  host: WidgetHostApi;
}

/**
 * Resolve a widget instance to its registered module and render it.
 *
 * If the type is unknown or the instance's props fail validation, render a
 * structured error card instead of the widget so the shell doesn't crash.
 * This is the only widget-rendering boundary; everywhere else assumes a
 * resolved, validated widget.
 */
export function WidgetHost({ instance, host }: WidgetHostProps) {
  const mod = getWidget(instance.type);
  if (!mod) {
    return (
      <WidgetError
        title={`Unknown widget type "${instance.type}"`}
        detail="No widget with this slug is registered. Add it under src/widgets/ or remove the instance."
      />
    );
  }

  const parsed = mod.propsSchema.safeParse({
    ...mod.defaultProps,
    ...instance.props,
  });
  if (!parsed.success) {
    return (
      <WidgetError
        title={`Invalid props for "${instance.type}"`}
        detail={parsed.error.issues
          .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
          .join("\n")}
      />
    );
  }

  const Component = mod.Component;
  return <Component props={parsed.data} host={host} />;
}

function WidgetError({ title, detail }: { title: string; detail: string }) {
  return (
    <div
      role="alert"
      className="flex h-full w-full flex-col items-start gap-2 p-4"
    >
      <div className="text-foreground/80 flex items-center gap-2 text-sm font-medium">
        <AlertTriangle className="text-destructive size-4" aria-hidden />
        {title}
      </div>
      <pre className="text-muted-foreground bg-muted/40 max-w-full overflow-auto rounded-md border p-3 font-mono text-xs whitespace-pre-wrap">
        {detail}
      </pre>
    </div>
  );
}
