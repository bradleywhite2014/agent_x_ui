import { z } from "zod";

import {
  badRequest,
  jsonOk,
  serverError,
  zodIssues,
} from "@/lib/api-error";
import {
  createFrameFromTemplate,
  listFrames,
} from "@/lib/shell/repo";
import { TEMPLATES } from "@/lib/shell/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createBodySchema = z.object({
  template: z.string().min(1),
  name: z.string().min(1).max(80).optional(),
});

export async function GET(req: Request): Promise<Response> {
  try {
    const frames = listFrames();
    const templates = TEMPLATES.map((t) => ({
      slug: t.slug,
      name: t.name,
      description: t.description,
      icon: t.icon,
    }));
    return jsonOk(req, { frames, templates });
  } catch (err) {
    return serverError(req, err);
  }
}

export async function POST(req: Request): Promise<Response> {
  let parsed: z.infer<typeof createBodySchema>;
  try {
    const body = (await req.json()) as unknown;
    parsed = createBodySchema.parse(body);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return badRequest(req, "Invalid create-frame payload", zodIssues(err));
    }
    return badRequest(req, "Invalid JSON body");
  }

  try {
    const created = createFrameFromTemplate(parsed);
    return jsonOk(
      req,
      {
        frame: created.frame,
        revisionId: created.revisionId,
        shell: created.shell,
      },
      { status: 201 },
    );
  } catch (err) {
    return serverError(req, err);
  }
}
