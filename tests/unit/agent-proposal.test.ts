import { describe, expect, it } from "vitest";

import { findTemplate } from "@/lib/shell/templates";
import {
  resolveProposeShell,
  resolveProposeWidgetAddition,
} from "@/lib/agent/proposal";
import { collectWidgetRefs } from "@/lib/shell/schema";

const dailyOperator = () => {
  const tmpl = findTemplate("daily-operator");
  if (!tmpl) throw new Error("template not found");
  return tmpl.build("frame-1");
};

describe("resolveProposeWidgetAddition", () => {
  it("rejects unknown widget slugs with a structured error", () => {
    const result = resolveProposeWidgetAddition({
      currentShell: dailyOperator(),
      type: "no-such-widget",
      placement: { mode: "append" },
      reasoning: "test",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("unknown_widget");
      expect(result.error.path).toEqual(["type"]);
    }
  });

  it("rejects invalid props with a structured error", () => {
    const result = resolveProposeWidgetAddition({
      currentShell: dailyOperator(),
      type: "web-preview",
      props: { url: "not-a-url" },
      placement: { mode: "append" },
      reasoning: "test",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("invalid_props");
    }
  });

  it("appends a widget to the root layout in append mode", () => {
    const result = resolveProposeWidgetAddition({
      currentShell: dailyOperator(),
      type: "markdown-notes",
      placement: { mode: "append", direction: "horizontal" },
      reasoning: "Add a side note",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const ids = collectWidgetRefs(result.proposal.shell.layout);
      expect(ids.size).toBe(3);
      expect(result.proposal.kind).toBe("widgetAddition");
    }
  });

  it("splits next to a known anchor in split-after mode", () => {
    const result = resolveProposeWidgetAddition({
      currentShell: dailyOperator(),
      type: "markdown-notes",
      placement: {
        mode: "split-after",
        anchorInstanceId: "dashboard-1",
        direction: "vertical",
      },
      reasoning: "Stack a note under the dashboard",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const ids = collectWidgetRefs(result.proposal.shell.layout);
      expect(ids.has("dashboard-1")).toBe(true);
      expect(ids.size).toBe(3);
    }
  });

  it("rejects split-after with no anchor", () => {
    const result = resolveProposeWidgetAddition({
      currentShell: dailyOperator(),
      type: "markdown-notes",
      placement: { mode: "split-after" },
      reasoning: "Bad placement",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("invalid_placement");
    }
  });

  it("rejects split-after when the anchor isn't in the layout", () => {
    const result = resolveProposeWidgetAddition({
      currentShell: dailyOperator(),
      type: "markdown-notes",
      placement: { mode: "split-after", anchorInstanceId: "ghost-1" },
      reasoning: "Bad placement",
    });
    expect(result.ok).toBe(false);
  });
});

describe("resolveProposeShell", () => {
  it("validates a complete candidate against widget propsSchemas", () => {
    const result = resolveProposeShell({
      frameId: "frame-1",
      candidate: {
        name: "New Look",
        template: "custom",
        layout: { kind: "widget", instanceId: "notes-a" },
        widgets: {
          "notes-a": {
            type: "markdown-notes",
            props: { content: "" },
          },
        },
      },
      reasoning: "Trim to a single note panel",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.proposal.kind).toBe("fullShell");
      expect(result.proposal.shell.id).toBe("frame-1");
    }
  });

  it("rejects candidates referencing unknown widgets", () => {
    const result = resolveProposeShell({
      frameId: "frame-1",
      candidate: {
        name: "Bogus",
        template: "custom",
        layout: { kind: "widget", instanceId: "x" },
        widgets: {
          x: { type: "no-such-widget", props: {} },
        },
      },
      reasoning: "Should fail",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("unknown_widget");
    }
  });

  it("rejects candidates whose layout references an undeclared widget", () => {
    const result = resolveProposeShell({
      frameId: "frame-1",
      candidate: {
        name: "Bogus",
        template: "custom",
        layout: { kind: "widget", instanceId: "ghost" },
        widgets: {
          "real-1": { type: "markdown-notes", props: {} },
        },
      },
      reasoning: "Should fail",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("invalid_shell");
    }
  });
});
