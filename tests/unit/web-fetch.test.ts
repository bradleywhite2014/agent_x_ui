import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchWebResource } from "@/lib/agent/web";

describe("web.fetch middleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.AGENT_X_WEB_ALLOWLIST;
  });

  it("blocks private network targets", async () => {
    const result = await fetchWebResource({ url: "http://127.0.0.1:3000" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("private_network");
    }
  });

  it("honors the host allowlist", async () => {
    process.env.AGENT_X_WEB_ALLOWLIST = "example.org";
    const result = await fetchWebResource({ url: "https://example.com" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("blocked_host");
    }
  });

  it("returns normalized text for allowed public pages", async () => {
    process.env.AGENT_X_WEB_ALLOWLIST = "example.com";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          "<html><head><title>Example Domain</title></head><body><h1>Hello</h1><script>bad()</script></body></html>",
          {
            status: 200,
            headers: { "content-type": "text/html" },
          },
        );
      }),
    );

    const result = await fetchWebResource({
      url: "https://example.com",
      maxChars: 500,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.title).toBe("Example Domain");
      expect(result.text).toContain("Hello");
      expect(result.text).not.toContain("bad()");
      expect(result.policy.matched).toBe("example.com");
    }
  });
});
