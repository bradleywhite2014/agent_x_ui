import { NextResponse } from "next/server";
import {
  streamText,
  convertToModelMessages,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";

import { defaultModel } from "@/lib/ai/models";
import { resolveRequestId } from "@/lib/request-id";
import { buildSystemPrompt } from "@/lib/agent/prompt";
import { summarizeFrameStructure } from "@/lib/agent/summarize";
import {
  proposeShellInputSchema,
  proposeWidgetAdditionInputSchema,
  PROPOSE_SHELL_TOOL,
  PROPOSE_WIDGET_ADDITION_TOOL,
  WEB_FETCH_TOOL,
} from "@/lib/agent/tools";
import { fetchWebResource, webFetchInputSchema } from "@/lib/agent/web";
import {
  resolveProposeShell,
  resolveProposeWidgetAddition,
  type ResolverResult,
} from "@/lib/agent/proposal";
import { loadActiveShell, FrameRepoError } from "@/lib/shell/repo";
import type { Shell } from "@/lib/shell/schema";
import type { FrameStructureSummary } from "@/lib/agent/summarize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  /**
   * Optional. When the user is on /frames/[id], the client passes the frame id.
   * Server loads the active shell ONLY for the structure-only summary that goes
   * into the system prompt. Widget contents never cross the model boundary.
   */
  frameId: z.string().min(1).optional(),
});

type ProposalToolPayload =
  | { ok: true; proposal: Extract<ResolverResult, { ok: true }>["proposal"] }
  | { ok: false; error: Extract<ResolverResult, { ok: false }>["error"] };

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

  let frameSummary: FrameStructureSummary | undefined;
  let currentShell: Shell | undefined;
  if (parsed.frameId) {
    try {
      const loaded = loadActiveShell(parsed.frameId);
      currentShell = loaded.shell;
      frameSummary = summarizeFrameStructure(loaded.shell);
    } catch (err) {
      if (!(err instanceof FrameRepoError)) throw err;
      console.warn(
        JSON.stringify({
          route: "/api/chat",
          request_id: requestId,
          frameId: parsed.frameId,
          warning: "frame_not_found_for_summary",
          message: err.message,
        }),
      );
    }
  }

  const system = buildSystemPrompt({ frame: frameSummary });
  const modelMessages = await convertToModelMessages(
    parsed.messages as unknown as UIMessage[],
  );

  const tools = {
    [PROPOSE_SHELL_TOOL.name]: tool({
      description: PROPOSE_SHELL_TOOL.description,
      inputSchema: proposeShellInputSchema,
      execute: async (input): Promise<ProposalToolPayload> => {
        if (!parsed.frameId) {
          return {
            ok: false,
            error: {
              code: "invalid_shell",
              message:
                "proposeShell requires a current frame context. Open a frame before proposing changes, or ask the user to create one first.",
            },
          };
        }
        const result = resolveProposeShell({
          frameId: parsed.frameId,
          candidate: input.shell,
          reasoning: input.reasoning,
        });
        return result;
      },
    }),
    [PROPOSE_WIDGET_ADDITION_TOOL.name]: tool({
      description: PROPOSE_WIDGET_ADDITION_TOOL.description,
      inputSchema: proposeWidgetAdditionInputSchema,
      execute: async (input): Promise<ProposalToolPayload> => {
        if (!currentShell) {
          return {
            ok: false,
            error: {
              code: "invalid_placement",
              message:
                "proposeWidgetAddition requires a current frame. Open a frame before iterating on it.",
            },
          };
        }
        const result = resolveProposeWidgetAddition({
          currentShell,
          type: input.type,
          instanceId: input.instanceId,
          props: input.props,
          placement: input.placement,
          reasoning: input.reasoning,
        });
        return result;
      },
    }),
    [WEB_FETCH_TOOL.name]: tool({
      description: WEB_FETCH_TOOL.description,
      inputSchema: webFetchInputSchema,
      execute: async (input) => {
        return fetchWebResource(input);
      },
    }),
  };

  const result = streamText({
    model: defaultModel(),
    system,
    messages: modelMessages,
    tools,
    onFinish({ usage }) {
      console.log(
        JSON.stringify({
          route: "/api/chat",
          request_id: requestId,
          frameId: parsed.frameId ?? null,
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
