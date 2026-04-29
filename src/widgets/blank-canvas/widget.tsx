"use client";

import { Blocks, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { WidgetComponentProps, WidgetModule } from "../types";
import { defaultProps, meta, propsSchema, type Props } from "./meta";

function BlankCanvas({ props }: WidgetComponentProps<Props>) {
  return (
    <div className="bg-background flex h-full min-h-0 items-center justify-center p-8">
      <div className="max-w-xl text-center">
        <div className="bg-primary/10 text-primary mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl">
          <Blocks className="size-5" aria-hidden />
        </div>
        <Badge variant="secondary" className="mb-3 gap-1.5">
          <Sparkles className="size-3" aria-hidden />
          agent-composable
        </Badge>
        <h2 className="text-2xl font-semibold tracking-tight">
          {props.title ?? "Blank canvas"}
        </h2>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          Start empty, then add a widget from Edit mode or ask Agent X to build
          a layout. Every change becomes a revision you can revert from History.
        </p>
        <div className="text-muted-foreground mt-6 grid gap-2 text-left text-xs sm:grid-cols-3">
          <div className="rounded-lg border p-3">
            <div className="text-foreground mb-1 font-medium">Finance</div>
            “Build a treasury dashboard.”
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-foreground mb-1 font-medium">Support</div>
            “Show my SLA risk queue.”
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-foreground mb-1 font-medium">Ops</div>
            “Add incident pressure + inventory.”
          </div>
        </div>
      </div>
    </div>
  );
}

const blankCanvasModule: WidgetModule<Props> = {
  meta,
  propsSchema,
  defaultProps,
  Component: BlankCanvas,
};

export default blankCanvasModule;
