import { z } from "zod";

import {
  badRequest,
  jsonOk,
  notFound,
  serverError,
  zodIssues,
} from "@/lib/api-error";
import { FrameRepoError, revertToRevision } from "@/lib/shell/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  targetRevisionId: z.string().min(1),
  reasoning: z.string().min(1).max(500).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
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
      return badRequest(req, "Invalid revert payload", zodIssues(err));
    }
    return badRequest(req, "Invalid JSON body");
  }

  try {
    const rev = revertToRevision(
      id,
      parsed.targetRevisionId,
      parsed.reasoning,
    );
    return jsonOk(req, { revision: rev }, { status: 201 });
  } catch (err) {
    if (err instanceof FrameRepoError && err.code === "not_found") {
      return notFound(req, err.message);
    }
    return serverError(req, err);
  }
}
