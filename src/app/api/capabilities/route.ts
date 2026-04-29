import { NextResponse } from "next/server";

import { buildCapabilityCatalog } from "@/lib/agent/catalog";
import { resolveRequestId } from "@/lib/request-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/capabilities
 *
 * The single source of truth the agent reads to learn what it may propose
 * and which tools it may call. The browser-side LLM agent has no other
 * ambient access to the surface.
 */
export async function GET(req: Request): Promise<Response> {
  const requestId = resolveRequestId(req.headers);
  const catalog = buildCapabilityCatalog();
  return NextResponse.json(catalog, {
    headers: {
      "x-request-id": requestId,
      "cache-control": "no-store",
    },
  });
}
