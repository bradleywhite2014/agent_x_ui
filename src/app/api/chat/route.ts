import { NextResponse } from "next/server";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";

import { defaultModel } from "@/lib/ai/models";
import { resolveRequestId } from "@/lib/request-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Loose UI-message envelope shape from `@ai-sdk/react`'s `useChat`. We rely on
 * `convertToModelMessages` to coerce parts into the model SDK's input.
 */
const chatRequestSchema = z.object({
  messages: z
    .array(
      z
        .object({
          id: z.string().optional(),
          role: z.enum(["system", "user", "assistant"]),
        })
        .loose(),
    )
    .min(1)
    .max(200),
});

const SYSTEM_PROMPT = [
  "You are Agent X, a personal agentic work-surface that runs on the operator's machine.",
  "Stay direct, dense, and concrete. One-line status sentences. Cite what you would touch.",
  "Never claim capabilities the surface does not yet have. Never request enterprise credentials.",
].join("\n");

export async function POST(req: Request): Promise<Response> {
  const requestId = resolveRequestId(req.headers);
  const startedAt = Date.now();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server.",
        issues: [],
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }

  let parsed: z.infer<typeof chatRequestSchema>;
  try {
    const body = (await req.json()) as unknown;
    parsed = chatRequestSchema.parse(body);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Invalid chat request payload",
        issues: err instanceof z.ZodError ? err.issues : [String(err)],
        request_id: requestId,
      },
      { status: 400, headers: { "x-request-id": requestId } },
    );
  }

  const modelMessages = await convertToModelMessages(
    parsed.messages as unknown as UIMessage[],
  );
  const result = streamText({
    model: defaultModel(),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    onFinish({ usage }) {
      console.log(
        JSON.stringify({
          route: "/api/chat",
          request_id: requestId,
          latency_ms: Date.now() - startedAt,
          usage,
        }),
      );
    },
  });

  return result.toUIMessageStreamResponse({
    headers: { "x-request-id": requestId },
  });
}
