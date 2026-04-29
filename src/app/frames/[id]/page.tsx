import { notFound } from "next/navigation";

import {
  FrameRepoError,
  listRevisions,
  loadActiveShell,
} from "@/lib/shell/repo";
import { ShellView } from "@/components/shell/ShellView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface LoadResult {
  ok: true;
  data: ReturnType<typeof loadActiveShell>;
  revisions: ReturnType<typeof listRevisions>;
}

interface LoadFailure {
  ok: false;
  notFound: boolean;
  error: unknown;
}

function loadFrameSafely(id: string): LoadResult | LoadFailure {
  try {
    const data = loadActiveShell(id);
    const revisions = listRevisions(id);
    return { ok: true, data, revisions };
  } catch (err) {
    if (err instanceof FrameRepoError && err.code === "not_found") {
      return { ok: false, notFound: true, error: err };
    }
    return { ok: false, notFound: false, error: err };
  }
}

export default async function FramePage({ params }: PageProps) {
  const { id } = await params;
  const result = loadFrameSafely(id);

  if (!result.ok) {
    if (result.notFound) {
      notFound();
    }
    throw result.error;
  }

  return (
    <ShellView
      frame={result.data.frame}
      shell={result.data.shell}
      revisionId={result.data.revisionId}
      initialRevisions={result.revisions}
    />
  );
}
