import { NextResponse } from "next/server";

import { defaultModelInfo } from "@/lib/ai/models";
import { resolveRequestId } from "@/lib/request-id";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request): Promise<NextResponse> {
  const requestId = resolveRequestId(req.headers);
  const hasAnthropicKey = Boolean(process.env.ANTHROPIC_API_KEY);

  return NextResponse.json(
    {
      status: "ok",
      version: "0.1.0",
      model: defaultModelInfo(),
      env: {
        anthropicKeyPresent: hasAnthropicKey,
      },
      timestamp: new Date().toISOString(),
    },
    { headers: { "x-request-id": requestId } },
  );
}
