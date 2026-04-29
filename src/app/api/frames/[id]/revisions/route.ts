import { z } from "zod";

import {
  badRequest,
  jsonOk,
  notFound,
  serverError,
  zodIssues,
} from "@/lib/api-error";
import {
  appendRevision,
  FrameRepoError,
  getActiveRevision,
  listRevisions,
} from "@/lib/shell/repo";
import { shellSchema } from "@/lib/shell/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  config: shellSchema,
  reasoning: z.string().min(1).max(500).optional(),
  parentRevisionId: z.string().min(1).optional(),
  authoredBy: z.enum(["user", "agent", "revert"]).default("user"),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  req: Request,
  { params }: RouteParams,
): Promise<Response> {
  const { id } = await params;
  try {
    return jsonOk(req, { revisions: listRevisions(id) });
  } catch (err) {
    return serverError(req, err);
  }
}

export async function POST(
  req: Request,
  { params }: RouteParams,
): Promise<Response> {
  const { id } = await params;
  let parsed: z.infer<typeof bodySchema>;
  try {
    const body = (await req.json()) as unknown;
    parsed = bodySchema.parse(body);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return badRequest(req, "Invalid revision payload", zodIssues(err));
    }
    return badRequest(req, "Invalid JSON body");
  }

  if (parsed.config.id !== id) {
    return badRequest(req, "config.id must match the URL frame id");
  }

  let parentRevisionId = parsed.parentRevisionId;
  if (!parentRevisionId) {
    const active = getActiveRevision(id);
    if (!active) {
      return notFound(req, `Frame "${id}" has no active revision.`);
    }
    parentRevisionId = active.id;
  }

  try {
    const rev = appendRevision({
      shellId: id,
      parentRevisionId,
      config: parsed.config,
      authoredBy: parsed.authoredBy,
      reasoning: parsed.reasoning,
    });
    return jsonOk(req, { revision: rev }, { status: 201 });
  } catch (err) {
    if (err instanceof FrameRepoError && err.code === "not_found") {
      return notFound(req, err.message);
    }
    return serverError(req, err);
  }
}
