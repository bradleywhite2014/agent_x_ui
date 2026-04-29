import {
  jsonOk,
  notFound,
  serverError,
} from "@/lib/api-error";
import {
  FrameRepoError,
  loadActiveShell,
  loadShellAtRevision,
  listRevisions,
} from "@/lib/shell/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  req: Request,
  { params }: RouteParams,
): Promise<Response> {
  const { id } = await params;
  const url = new URL(req.url);
  const revisionParam = url.searchParams.get("revision");

  try {
    const loaded = revisionParam
      ? loadShellAtRevision(id, revisionParam)
      : loadActiveShell(id);

    return jsonOk(req, {
      frame: loaded.frame,
      revisionId: loaded.revisionId,
      shell: loaded.shell,
      revisions: listRevisions(id),
    });
  } catch (err) {
    if (err instanceof FrameRepoError && err.code === "not_found") {
      return notFound(req, err.message);
    }
    return serverError(req, err);
  }
}
