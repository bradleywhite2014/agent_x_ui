"use client";

import { Fragment } from "react";

import type { LayoutNode, Shell } from "@/lib/shell/schema";
import { cn } from "@/lib/utils";

/**
 * Read-only structural preview of a shell. Intentionally does NOT mount real
 * widgets — the proposal preview is for shape comparison only, not for live
 * data, and avoiding mounts keeps any side-effecting widget (iframes, network
 * fetches) out of the ratify path.
 */
export function ShellOutline({
  shell,
  highlight,
  emptyHint,
}: {
  shell: Shell | null;
  /** instance ids to draw with the "added" accent. */
  highlight?: ReadonlySet<string>;
  emptyHint?: string;
}) {
  if (!shell) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed p-3 text-xs italic">
        {emptyHint ?? "No frame"}
      </div>
    );
  }
  return (
    <div className="border-border bg-muted/30 rounded-md border p-2 text-[11px]">
      <div className="text-foreground/80 mb-1.5 font-mono text-[0.65rem] tracking-[0.16em] uppercase">
        {shell.name} · {shell.template}
      </div>
      <OutlineNode
        node={shell.layout}
        widgets={shell.widgets}
        depth={0}
        highlight={highlight ?? new Set()}
      />
    </div>
  );
}

function OutlineNode({
  node,
  widgets,
  depth,
  highlight,
}: {
  node: LayoutNode;
  widgets: Shell["widgets"];
  depth: number;
  highlight: ReadonlySet<string>;
}) {
  if (node.kind === "widget") {
    const inst = widgets[node.instanceId];
    const isNew = highlight.has(node.instanceId);
    return (
      <div
        className={cn(
          "border-border ml-2 flex items-center gap-2 rounded-sm border-l-2 py-0.5 pl-2",
          isNew && "border-primary bg-primary/10",
        )}
        style={{ marginLeft: depth * 8 }}
      >
        <code className="text-muted-foreground font-mono text-[10px]">
          {node.instanceId}
        </code>
        <span className="text-foreground/80">
          {inst?.type ?? <em>missing</em>}
        </span>
        {isNew ? (
          <span className="text-primary ml-auto font-mono text-[9px] tracking-wider uppercase">
            new
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ marginLeft: depth * 8 }}>
      <div className="text-muted-foreground py-0.5 font-mono text-[10px]">
        {node.direction} split
        {node.sizes ? ` (${node.sizes.join("/")})` : ""}
      </div>
      <div>
        {node.children.map((child, i) => (
          <Fragment key={i}>
            <OutlineNode
              node={child}
              widgets={widgets}
              depth={depth + 1}
              highlight={highlight}
            />
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export function diffWidgets(prev: Shell, next: Shell): {
  added: Set<string>;
  removed: Set<string>;
  changed: Set<string>;
} {
  const added = new Set<string>();
  const removed = new Set<string>();
  const changed = new Set<string>();
  for (const id of Object.keys(next.widgets)) {
    const before = prev.widgets[id];
    const after = next.widgets[id];
    if (!before) {
      added.add(id);
    } else if (after && before.type !== after.type) {
      changed.add(id);
    }
  }
  for (const id of Object.keys(prev.widgets)) {
    if (!next.widgets[id]) removed.add(id);
  }
  return { added, removed, changed };
}
