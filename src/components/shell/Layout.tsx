"use client";

import { Fragment, type ReactNode } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { GripVertical, GripHorizontal } from "lucide-react";

import type { LayoutNode } from "@/lib/shell/schema";
import { cn } from "@/lib/utils";

export interface ShellLayoutProps {
  node: LayoutNode;
  renderWidget: (instanceId: string) => ReactNode;
  /**
   * Stable key prefix for the top-level group. Letting the caller change this
   * on shell-id changes forces `react-resizable-panels` to drop its persisted
   * size state cleanly when the document structure changes.
   */
  layoutKey: string;
  className?: string;
}

export function ShellLayout({
  node,
  renderWidget,
  layoutKey,
  className,
}: ShellLayoutProps) {
  return (
    <div className={cn("h-full w-full overflow-hidden", className)}>
      <LayoutNodeView
        node={node}
        renderWidget={renderWidget}
        path={`${layoutKey}:0`}
      />
    </div>
  );
}

interface NodeViewProps {
  node: LayoutNode;
  renderWidget: (instanceId: string) => ReactNode;
  path: string;
}

function LayoutNodeView({ node, renderWidget, path }: NodeViewProps) {
  if (node.kind === "widget") {
    return (
      <div
        className="bg-background h-full w-full overflow-auto"
        data-instance-id={node.instanceId}
        role="region"
        aria-label={`Widget ${node.instanceId}`}
      >
        {renderWidget(node.instanceId)}
      </div>
    );
  }

  const equalSize = 100 / node.children.length;

  return (
    <Group
      orientation={node.direction}
      id={path}
      className="h-full w-full"
    >
      {node.children.map((child, i) => {
        const childPath = `${path}/${i}`;
        const size = node.sizes?.[i] ?? equalSize;
        return (
          <Fragment key={childPath}>
            <Panel
              id={childPath}
              defaultSize={size}
              minSize={10}
              className="overflow-hidden"
            >
              <LayoutNodeView
                node={child}
                renderWidget={renderWidget}
                path={childPath}
              />
            </Panel>
            {i < node.children.length - 1 ? (
              <ResizeSeparator direction={node.direction} index={i} path={path} />
            ) : null}
          </Fragment>
        );
      })}
    </Group>
  );
}

function ResizeSeparator({
  direction,
  index,
  path,
}: {
  direction: "horizontal" | "vertical";
  index: number;
  path: string;
}) {
  const isHorizontal = direction === "horizontal";
  return (
    <Separator
      id={`${path}/sep/${index}`}
      className={cn(
        "group/sep bg-border data-[active]:bg-ring/60 hover:bg-ring/40",
        "relative flex items-center justify-center transition-colors",
        isHorizontal
          ? "w-px cursor-col-resize hover:w-1"
          : "h-px cursor-row-resize hover:h-1",
      )}
    >
      <span
        className={cn(
          "text-foreground/40 group-hover/sep:text-foreground/80 group-data-[active]/sep:text-foreground/80",
          "pointer-events-none absolute opacity-0 transition-opacity",
          "group-hover/sep:opacity-100 group-data-[active]/sep:opacity-100",
        )}
        aria-hidden
      >
        {isHorizontal ? (
          <GripVertical className="size-3.5" />
        ) : (
          <GripHorizontal className="size-3.5" />
        )}
      </span>
    </Separator>
  );
}
