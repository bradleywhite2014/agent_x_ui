import "server-only";

import { randomUUID } from "node:crypto";
import { eq, desc, isNull, and } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { revisions, shells } from "@/lib/db/schema";

import { findTemplate } from "./templates";
import {
  type Shell,
  validateShell,
  safeValidateShell,
} from "./schema";

/**
 * Frame summary for the picker / sidebar list. Cheap to fetch — does NOT
 * include the full active config payload.
 */
export interface FrameSummary {
  id: string;
  name: string;
  template: string;
  createdAt: number;
  updatedAt: number;
  archivedAt: number | null;
}

export interface RevisionSummary {
  id: string;
  shellId: string;
  parentRevisionId: string | null;
  authoredBy: "user" | "agent" | "revert";
  reasoning: string | null;
  revertOf: string | null;
  createdAt: number;
}

export interface FrameWithConfig {
  frame: FrameSummary;
  revisionId: string;
  shell: Shell;
}

export class FrameRepoError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "not_found"
      | "no_revision"
      | "invalid_config"
      | "duplicate_name",
  ) {
    super(message);
    this.name = "FrameRepoError";
  }
}

function toFrameSummary(row: typeof shells.$inferSelect): FrameSummary {
  return {
    id: row.id,
    name: row.name,
    template: row.template,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
    archivedAt: row.archivedAt ? row.archivedAt.getTime() : null,
  };
}

function toRevisionSummary(
  row: typeof revisions.$inferSelect,
): RevisionSummary {
  return {
    id: row.id,
    shellId: row.shellId,
    parentRevisionId: row.parentRevisionId ?? null,
    authoredBy: row.authoredBy as RevisionSummary["authoredBy"],
    reasoning: row.reasoning ?? null,
    revertOf: row.revertOf ?? null,
    createdAt: row.createdAt.getTime(),
  };
}

/* --------------------------------- Reads --------------------------------- */

export function listFrames(): FrameSummary[] {
  const db = getDb();
  const rows = db
    .select()
    .from(shells)
    .where(isNull(shells.archivedAt))
    .orderBy(desc(shells.updatedAt))
    .all();
  return rows.map(toFrameSummary);
}

export function getFrameById(id: string): FrameSummary | null {
  const db = getDb();
  const row = db.select().from(shells).where(eq(shells.id, id)).get();
  return row ? toFrameSummary(row) : null;
}

export function getActiveRevision(shellId: string): RevisionSummary | null {
  const db = getDb();
  const row = db
    .select()
    .from(revisions)
    .where(eq(revisions.shellId, shellId))
    .orderBy(desc(revisions.createdAt))
    .limit(1)
    .get();
  return row ? toRevisionSummary(row) : null;
}

export function getRevisionById(revisionId: string): RevisionSummary | null {
  const db = getDb();
  const row = db
    .select()
    .from(revisions)
    .where(eq(revisions.id, revisionId))
    .get();
  return row ? toRevisionSummary(row) : null;
}

export function listRevisions(shellId: string): RevisionSummary[] {
  const db = getDb();
  const rows = db
    .select()
    .from(revisions)
    .where(eq(revisions.shellId, shellId))
    .orderBy(desc(revisions.createdAt))
    .all();
  return rows.map(toRevisionSummary);
}

export function loadActiveShell(shellId: string): FrameWithConfig {
  const frame = getFrameById(shellId);
  if (!frame) {
    throw new FrameRepoError(`No frame with id "${shellId}"`, "not_found");
  }

  const db = getDb();
  const row = db
    .select()
    .from(revisions)
    .where(eq(revisions.shellId, shellId))
    .orderBy(desc(revisions.createdAt))
    .limit(1)
    .get();
  if (!row) {
    throw new FrameRepoError(
      `Frame "${shellId}" has no revisions.`,
      "no_revision",
    );
  }

  const parsed = safeValidateShell(row.config);
  if (!parsed.ok) {
    throw new FrameRepoError(
      `Active revision config failed validation: ${parsed.error.message}`,
      "invalid_config",
    );
  }
  return { frame, revisionId: row.id, shell: parsed.shell };
}

export function loadShellAtRevision(
  shellId: string,
  revisionId: string,
): FrameWithConfig {
  const frame = getFrameById(shellId);
  if (!frame) {
    throw new FrameRepoError(`No frame with id "${shellId}"`, "not_found");
  }
  const db = getDb();
  const row = db
    .select()
    .from(revisions)
    .where(and(eq(revisions.id, revisionId), eq(revisions.shellId, shellId)))
    .get();
  if (!row) {
    throw new FrameRepoError(
      `No revision "${revisionId}" on frame "${shellId}"`,
      "not_found",
    );
  }
  const parsed = safeValidateShell(row.config);
  if (!parsed.ok) {
    throw new FrameRepoError(
      `Revision config failed validation: ${parsed.error.message}`,
      "invalid_config",
    );
  }
  return { frame, revisionId: row.id, shell: parsed.shell };
}

/* --------------------------------- Writes -------------------------------- */

export interface CreateFrameOptions {
  template: string;
  name?: string;
}

export function createFrameFromTemplate(
  options: CreateFrameOptions,
): FrameWithConfig {
  const tmpl = findTemplate(options.template);
  if (!tmpl) {
    throw new FrameRepoError(
      `Unknown template "${options.template}"`,
      "not_found",
    );
  }

  const id = randomUUID();
  const shell = tmpl.build(id);
  if (options.name && options.name.trim().length > 0) {
    shell.name = options.name.trim();
  }
  // The template builder may produce a partial-but-valid object; full-validate
  // before persisting so storage is always parseable.
  const validated = validateShell(shell);

  const db = getDb();
  const now = new Date();
  const initialRevisionId = randomUUID();

  db.transaction((tx) => {
    tx.insert(shells)
      .values({
        id,
        name: validated.name,
        template: validated.template,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    tx.insert(revisions)
      .values({
        id: initialRevisionId,
        shellId: id,
        parentRevisionId: null,
        config: validated,
        patch: null,
        authoredBy: "user",
        reasoning: `Created from template "${validated.template}"`,
        revertOf: null,
        createdAt: now,
      })
      .run();
  });

  return {
    frame: {
      id,
      name: validated.name,
      template: validated.template,
      createdAt: now.getTime(),
      updatedAt: now.getTime(),
      archivedAt: null,
    },
    revisionId: initialRevisionId,
    shell: validated,
  };
}

export interface AppendRevisionOptions {
  shellId: string;
  parentRevisionId: string;
  config: Shell;
  authoredBy: RevisionSummary["authoredBy"];
  reasoning?: string;
  revertOf?: string;
}

export function appendRevision(
  options: AppendRevisionOptions,
): RevisionSummary {
  const validated = validateShell(options.config);
  const db = getDb();
  const now = new Date();
  const id = randomUUID();

  db.transaction((tx) => {
    tx.insert(revisions)
      .values({
        id,
        shellId: options.shellId,
        parentRevisionId: options.parentRevisionId,
        config: validated,
        patch: null,
        authoredBy: options.authoredBy,
        reasoning: options.reasoning ?? null,
        revertOf: options.revertOf ?? null,
        createdAt: now,
      })
      .run();

    tx.update(shells)
      .set({ updatedAt: now })
      .where(eq(shells.id, options.shellId))
      .run();
  });

  return {
    id,
    shellId: options.shellId,
    parentRevisionId: options.parentRevisionId,
    authoredBy: options.authoredBy,
    reasoning: options.reasoning ?? null,
    revertOf: options.revertOf ?? null,
    createdAt: now.getTime(),
  };
}

export function revertToRevision(
  shellId: string,
  targetRevisionId: string,
  reasoning?: string,
): RevisionSummary {
  const target = loadShellAtRevision(shellId, targetRevisionId);
  const active = getActiveRevision(shellId);
  if (!active) {
    throw new FrameRepoError(
      `Frame "${shellId}" has no active revision to revert from.`,
      "no_revision",
    );
  }
  return appendRevision({
    shellId,
    parentRevisionId: active.id,
    config: target.shell,
    authoredBy: "revert",
    reasoning: reasoning ?? `Reverted to revision ${targetRevisionId.slice(0, 8)}`,
    revertOf: targetRevisionId,
  });
}
