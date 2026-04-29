import { describe, expect, it } from "vitest";

import { findTemplate } from "@/lib/shell/templates";
import {
  renderStructureForPrompt,
  summarizeFrameStructure,
} from "@/lib/agent/summarize";

const dailyOperator = () => {
  const tmpl = findTemplate("daily-operator");
  if (!tmpl) throw new Error("template not found");
  return tmpl.build("frame-1");
};

describe("frame structure summary", () => {
  it("emits one widget line per instance", () => {
    const summary = summarizeFrameStructure(dailyOperator());
    expect(summary.frameId).toBe("frame-1");
    expect(summary.widgets).toHaveLength(4);
    expect(summary.widgets.join("\n")).toMatch(/rail-1 :: integration-rail/);
    expect(summary.widgets.join("\n")).toMatch(/notes-1 :: markdown-notes/);
    expect(summary.widgets.join("\n")).toMatch(/preview-1 :: web-preview/);
    expect(summary.widgets.join("\n")).toMatch(/atlas-1 :: integrations-atlas/);
  });

  it("does NOT include widget contents", () => {
    const shell = dailyOperator();
    const summary = summarizeFrameStructure(shell);
    const rendered = renderStructureForPrompt(summary);
    // Confidential prop values from the seed templates should never appear.
    expect(rendered).not.toContain("morning brief");
    expect(rendered).not.toContain("Write something");
    expect(rendered).not.toContain("https://example.com");
  });
});
