import { describe, expect, it } from "vitest";

import {
  MOCK_INTEGRATION_CAPABILITIES,
  domainsFromCapabilities,
  summarizeCapabilityCounts,
} from "@/lib/integrations/mock-catalog";

describe("mock integration catalog", () => {
  it("lists capabilities across enterprise domains", () => {
    expect(MOCK_INTEGRATION_CAPABILITIES.length).toBeGreaterThanOrEqual(10);
    const domains = domainsFromCapabilities(MOCK_INTEGRATION_CAPABILITIES);
    expect(domains.some((d) => /zendesk/i.test(d))).toBe(true);
    expect(domains.some((d) => /crm/i.test(d))).toBe(true);
  });

  it("summarizes counts by status", () => {
    const c = summarizeCapabilityCounts(MOCK_INTEGRATION_CAPABILITIES);
    expect(c.total).toBe(MOCK_INTEGRATION_CAPABILITIES.length);
    expect(c.mock + c.live + c.planned).toBe(c.total);
  });
});
