import type { LayoutNode, Shell } from "@/lib/shell/schema";

/**
 * Build a structure-only summary of a frame's layout for the agent prompt.
 *
 * Critical: this function MUST NOT emit widget contents (notes text, URLs,
 * any prop value). It emits only the topology (instance ids, types,
 * placement) so the agent can talk about the frame and propose deltas
 * without seeing the user's data.
 *
 * The agent sees this string instead of `shell` itself; the rest of the
 * shell never crosses the model boundary.
 */
export interface FrameStructureSummary {
  frameId: string;
  frameName: string;
  template: string;
  /** One line per widget instance: `<id> :: <type> @ <path>`. */
  widgets: string[];
  /** Multi-line ASCII outline of the layout tree. */
  layoutOutline: string;
}

export function summarizeFrameStructure(shell: Shell): FrameStructureSummary {
  const widgetLines: string[] = [];
  const outline: string[] = [];
  walk(shell.layout, [], (node, path, depth) => {
    const indent = "  ".repeat(depth);
    if (node.kind === "widget") {
      const inst = shell.widgets[node.instanceId];
      const type = inst ? inst.type : "<unknown>";
      widgetLines.push(`${node.instanceId} :: ${type} @ ${path.join(".") || "root"}`);
      outline.push(`${indent}- ${node.instanceId} (${type})`);
    } else {
      const sizes = node.sizes ? ` sizes=[${node.sizes.join(",")}]` : "";
      outline.push(`${indent}- ${node.direction} split${sizes}`);
    }
  });
  return {
    frameId: shell.id,
    frameName: shell.name,
    template: shell.template,
    widgets: widgetLines,
    layoutOutline: outline.join("\n"),
  };
}

export function renderStructureForPrompt(s: FrameStructureSummary): string {
  return [
    `frame.id: ${s.frameId}`,
    `frame.name: ${s.frameName}`,
    `template: ${s.template}`,
    `widget instances:`,
    ...s.widgets.map((w) => `  - ${w}`),
    `layout outline:`,
    s.layoutOutline,
  ].join("\n");
}

type Visit = (node: LayoutNode, path: ReadonlyArray<number>, depth: number) => void;

function walk(node: LayoutNode, path: ReadonlyArray<number>, visit: Visit, depth = 0): void {
  visit(node, path, depth);
  if (node.kind === "split") {
    node.children.forEach((child, i) => walk(child, [...path, i], visit, depth + 1));
  }
}
