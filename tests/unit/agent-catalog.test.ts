import { describe, expect, it } from "vitest";

import { buildCapabilityCatalog } from "@/lib/agent/catalog";
import { widgetMetaSlugs } from "@/widgets/registry.server";

describe("capability catalog", () => {
  it("includes every registered widget", () => {
    const catalog = buildCapabilityCatalog();
    const slugs = catalog.widgets.map((w) => w.slug).sort();
    expect(slugs).toEqual([...widgetMetaSlugs()].sort());
  });

  it("emits a JSON Schema for each widget's props", () => {
    const catalog = buildCapabilityCatalog();
    for (const w of catalog.widgets) {
      const schema = w.propsSchema as { type?: string; properties?: Record<string, unknown> };
      expect(schema.type).toBe("object");
      expect(schema.properties).toBeTruthy();
    }
  });

  it("advertises proposer tools and governed web fetch", () => {
    const catalog = buildCapabilityCatalog();
    const names = catalog.tools.map((t) => t.name).sort();
    expect(names).toEqual(["proposeShell", "proposeWidgetAddition", "web.fetch"]);
    expect(catalog.tools.find((t) => t.name === "web.fetch")).toMatchObject({
      category: "action",
      riskClass: "read",
    });
    expect(catalog.tools.find((t) => t.name === "proposeShell")).toMatchObject({
      category: "proposer",
      riskClass: "read",
    });
  });
});
