import { jsonOk, serverError } from "@/lib/api-error";
import {
  MOCK_INTEGRATION_CAPABILITIES,
  domainsFromCapabilities,
  summarizeCapabilityCounts,
} from "@/lib/integrations/mock-catalog";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  try {
    const caps = MOCK_INTEGRATION_CAPABILITIES;
    return jsonOk(req, {
      version: "agent-x/integrations-catalog/v1",
      capabilities: caps,
      domains: domainsFromCapabilities(caps),
      counts: summarizeCapabilityCounts(caps),
    });
  } catch (err) {
    return serverError(req, err);
  }
}
