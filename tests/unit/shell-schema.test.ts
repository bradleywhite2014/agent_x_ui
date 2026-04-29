import { describe, expect, it } from "vitest";

import { TEMPLATES } from "@/lib/shell/templates";
import {
  collectWidgetRefs,
  safeValidateShell,
  validateShell,
} from "@/lib/shell/schema";

describe("Shell schema", () => {
  it("round-trips every built-in template without loss", () => {
    for (const tmpl of TEMPLATES) {
      const shell = tmpl.build("test-id-123");
      const parsed = validateShell(shell);
      // Round-trip the JSON the way the DB stores it.
      const restored = validateShell(JSON.parse(JSON.stringify(parsed)));
      expect(restored).toStrictEqual(parsed);
    }
  });

  it("rejects a layout that references an unknown widget id", () => {
    const result = safeValidateShell({
      $schema: "agent-x/shell/v1",
      id: "x",
      name: "Bad",
      template: "scratch",
      layout: { kind: "widget", instanceId: "ghost" },
      widgets: {},
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.issues[0]?.message).toMatch(/unknown widget/i);
    }
  });

  it("rejects an orphan widget instance not placed in the layout", () => {
    const result = safeValidateShell({
      $schema: "agent-x/shell/v1",
      id: "x",
      name: "Bad",
      template: "scratch",
      layout: { kind: "widget", instanceId: "notes-1" },
      widgets: {
        "notes-1": { type: "markdown-notes", props: {} },
        "orphan-1": { type: "markdown-notes", props: {} },
      },
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a split with sizes that don't sum to 100", () => {
    const result = safeValidateShell({
      $schema: "agent-x/shell/v1",
      id: "x",
      name: "Bad",
      template: "scratch",
      layout: {
        kind: "split",
        direction: "horizontal",
        sizes: [30, 30],
        children: [
          { kind: "widget", instanceId: "a" },
          { kind: "widget", instanceId: "b" },
        ],
      },
      widgets: {
        a: { type: "markdown-notes", props: {} },
        b: { type: "markdown-notes", props: {} },
      },
    });
    expect(result.ok).toBe(false);
  });

  it("collects every widget reference in a nested layout", () => {
    const refs = collectWidgetRefs({
      kind: "split",
      direction: "vertical",
      children: [
        { kind: "widget", instanceId: "a" },
        {
          kind: "split",
          direction: "horizontal",
          children: [
            { kind: "widget", instanceId: "b" },
            { kind: "widget", instanceId: "c" },
          ],
        },
      ],
    });
    expect(refs).toEqual(new Set(["a", "b", "c"]));
  });
});
