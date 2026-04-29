import { describe, expect, it } from "vitest";

import {
  defaultGlobalThemeState,
  serializeMergedDocumentStyle,
} from "@/lib/theme/resolve";

describe("serializeMergedDocumentStyle", () => {
  it("emits :root and .dark blocks with merged frame preset tokens", () => {
    const css = serializeMergedDocumentStyle(defaultGlobalThemeState(), {
      presetId: "forest",
    });
    expect(css).toContain(":root");
    expect(css).toContain(".dark");
    expect(css).toContain("--sidebar");
    expect(css).toContain("--density");
  });

  it("differs from forest-only frame merge vs bare global defaults", () => {
    const merged = serializeMergedDocumentStyle(defaultGlobalThemeState(), {
      presetId: "forest",
    });
    const plain = serializeMergedDocumentStyle(defaultGlobalThemeState(), undefined);
    expect(merged).not.toBe(plain);
  });
});
