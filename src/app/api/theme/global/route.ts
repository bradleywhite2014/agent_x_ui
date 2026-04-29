import { badRequest, jsonOk, serverError, zodIssues } from "@/lib/api-error";
import {
  loadGlobalThemeState,
  saveGlobalThemeState,
} from "@/lib/theme/prefs.server";
import { globalThemeSchema } from "@/lib/theme/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  try {
    const theme = loadGlobalThemeState();
    return jsonOk(req, { theme });
  } catch (err) {
    return serverError(req, err);
  }
}

export async function PUT(req: Request): Promise<Response> {
  try {
    const raw = (await req.json()) as unknown;
    const parsed = globalThemeSchema.safeParse(raw);
    if (!parsed.success) {
      return badRequest(
        req,
        "Invalid global theme payload",
        zodIssues(parsed.error),
      );
    }
    saveGlobalThemeState(parsed.data);
    return jsonOk(req, { theme: loadGlobalThemeState() });
  } catch (err) {
    return serverError(req, err);
  }
}
