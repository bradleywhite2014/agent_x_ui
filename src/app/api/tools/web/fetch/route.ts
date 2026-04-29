import {
  badRequest,
  jsonError,
  jsonOk,
  serverError,
  zodIssues,
} from "@/lib/api-error";
import { resolveRequestId } from "@/lib/request-id";
import { fetchWebResource, webFetchInputSchema } from "@/lib/agent/web";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  try {
    const raw = (await req.json()) as unknown;
    const parsed = webFetchInputSchema.safeParse(raw);
    if (!parsed.success) {
      return badRequest(req, "Invalid web.fetch payload", zodIssues(parsed.error));
    }

    const result = await fetchWebResource(parsed.data);
    if (!result.ok) {
      const status = result.code === "blocked_host" ? 403 : 400;
      return jsonError(result.message, {
        status,
        issues: [{ code: result.code, url: result.url }],
        requestId: resolveRequestId(req.headers),
      });
    }
    return jsonOk(req, result);
  } catch (err) {
    return serverError(req, err);
  }
}
