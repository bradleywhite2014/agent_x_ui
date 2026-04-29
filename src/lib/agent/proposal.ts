import { randomUUID } from "node:crypto";

import { getWidgetMeta } from "@/widgets/registry.server";
import {
  collectWidgetRefs,
  safeValidateShell,
  SHELL_VERSION,
  type LayoutNode,
  type LayoutSplitNode,
  type Shell,
} from "@/lib/shell/schema";

import type { CandidateShell } from "./tools";

/**
 * Envelope returned by every proposer tool. The tool itself does NOT write —
 * it only validates the candidate and produces this envelope. The client
 * surfaces a ratify card; the user's explicit click is what writes.
 */
export interface MutationProposal {
  proposalId: string;
  /** What kind of proposal this is. The UI uses this to pick the right preview. */
  kind: "fullShell" | "widgetAddition";
  /** The fully-resolved post-proposal shell (always a complete valid Shell). */
  shell: Shell;
  /** A short, human-readable summary surfaced in the ratify card and revision row. */
  reasoning: string;
  /** Created-at, ms epoch. Used purely for display. */
  createdAt: number;
}

export interface ResolverError {
  code: "unknown_widget" | "invalid_props" | "invalid_shell" | "invalid_placement";
  message: string;
  /** Path within the candidate to point the agent at, when known. */
  path?: ReadonlyArray<string | number>;
}

export type ResolverResult =
  | { ok: true; proposal: MutationProposal }
  | { ok: false; error: ResolverError };

/* ----------------------------- proposeShell ------------------------------ */

export interface ResolveProposeShellInput {
  /** Existing frame id we're proposing FOR. The proposal will write a new revision against this frame on ratify. */
  frameId: string;
  /** Candidate shell from the agent. */
  candidate: CandidateShell;
  reasoning: string;
}

export function resolveProposeShell(
  input: ResolveProposeShellInput,
): ResolverResult {
  const propsCheck = checkAllPropsAgainstCatalog(input.candidate.widgets);
  if (!propsCheck.ok) return { ok: false, error: propsCheck.error };

  const candidate = {
    $schema: SHELL_VERSION,
    id: input.frameId,
    name: input.candidate.name,
    template: input.candidate.template,
    layout: input.candidate.layout as LayoutNode,
    widgets: input.candidate.widgets,
    metadata: input.candidate.metadata,
  };

  const parsed = safeValidateShell(candidate);
  if (!parsed.ok) {
    return {
      ok: false,
      error: {
        code: "invalid_shell",
        message: `Candidate shell failed schema validation: ${parsed.error.message}`,
      },
    };
  }

  return {
    ok: true,
    proposal: {
      proposalId: randomUUID(),
      kind: "fullShell",
      shell: parsed.shell,
      reasoning: input.reasoning,
      createdAt: Date.now(),
    },
  };
}

/* ----------------------- proposeWidgetAddition --------------------------- */

export interface ResolveProposeWidgetAdditionInput {
  currentShell: Shell;
  type: string;
  instanceId?: string;
  props?: Record<string, unknown>;
  placement: {
    mode: "append" | "split-after";
    anchorInstanceId?: string;
    direction?: "horizontal" | "vertical";
  };
  reasoning: string;
}

export function resolveProposeWidgetAddition(
  input: ResolveProposeWidgetAdditionInput,
): ResolverResult {
  const widgetModule = getWidgetMeta(input.type);
  if (!widgetModule) {
    return {
      ok: false,
      error: {
        code: "unknown_widget",
        message: `Widget slug "${input.type}" is not in the capability catalog.`,
        path: ["type"],
      },
    };
  }

  const propsCandidate = input.props ?? widgetModule.defaultProps;
  const propsParse = widgetModule.propsSchema.safeParse(propsCandidate);
  if (!propsParse.success) {
    return {
      ok: false,
      error: {
        code: "invalid_props",
        message: `Props for "${input.type}" failed validation: ${propsParse.error.message}`,
        path: ["props"],
      },
    };
  }

  const newId = uniqueInstanceId(input.currentShell, input.instanceId, input.type);

  const updatedLayoutResult = insertIntoLayout(input.currentShell.layout, newId, input.placement);
  if (!updatedLayoutResult.ok) return { ok: false, error: updatedLayoutResult.error };

  const nextShell: Shell = {
    ...input.currentShell,
    layout: updatedLayoutResult.layout,
    widgets: {
      ...input.currentShell.widgets,
      [newId]: { type: input.type, props: propsParse.data as Record<string, unknown> },
    },
  };

  const validated = safeValidateShell(nextShell);
  if (!validated.ok) {
    return {
      ok: false,
      error: {
        code: "invalid_shell",
        message: `Result of widget insertion failed schema validation: ${validated.error.message}`,
      },
    };
  }

  return {
    ok: true,
    proposal: {
      proposalId: randomUUID(),
      kind: "widgetAddition",
      shell: validated.shell,
      reasoning: input.reasoning,
      createdAt: Date.now(),
    },
  };
}

/* ---------------------------- helpers ------------------------------------ */

function checkAllPropsAgainstCatalog(
  widgets: Record<string, { type: string; props: Record<string, unknown> }>,
): { ok: true } | { ok: false; error: ResolverError } {
  for (const [id, inst] of Object.entries(widgets)) {
    const mod = getWidgetMeta(inst.type);
    if (!mod) {
      return {
        ok: false,
        error: {
          code: "unknown_widget",
          message: `Widget instance "${id}" uses unknown slug "${inst.type}".`,
          path: ["widgets", id, "type"],
        },
      };
    }
    const parsed = mod.propsSchema.safeParse(inst.props ?? mod.defaultProps);
    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: "invalid_props",
          message: `Widget "${id}" (${inst.type}) has invalid props: ${parsed.error.message}`,
          path: ["widgets", id, "props"],
        },
      };
    }
  }
  return { ok: true };
}

function uniqueInstanceId(
  shell: Shell,
  desired: string | undefined,
  type: string,
): string {
  const existing = collectWidgetRefs(shell.layout);
  if (desired && !existing.has(desired) && !shell.widgets[desired]) return desired;
  const base = (desired ?? type).replace(/[^a-zA-Z0-9_-]/g, "-");
  let i = 1;
  while (existing.has(`${base}-${i}`) || shell.widgets[`${base}-${i}`]) i += 1;
  return `${base}-${i}`;
}

interface LayoutInsertOk {
  ok: true;
  layout: LayoutNode;
}
interface LayoutInsertErr {
  ok: false;
  error: ResolverError;
}

function insertIntoLayout(
  current: LayoutNode,
  newInstanceId: string,
  placement: ResolveProposeWidgetAdditionInput["placement"],
): LayoutInsertOk | LayoutInsertErr {
  if (placement.mode === "append") {
    const direction = placement.direction ?? "horizontal";
    if (current.kind === "split" && current.direction === direction) {
      return {
        ok: true,
        layout: {
          kind: "split",
          direction,
          children: [...current.children, { kind: "widget", instanceId: newInstanceId }],
        },
      };
    }
    return {
      ok: true,
      layout: {
        kind: "split",
        direction,
        children: [current, { kind: "widget", instanceId: newInstanceId }],
      },
    };
  }

  if (placement.mode === "split-after") {
    if (!placement.anchorInstanceId) {
      return {
        ok: false,
        error: {
          code: "invalid_placement",
          message: "placement.anchorInstanceId is required when mode = 'split-after'.",
          path: ["placement", "anchorInstanceId"],
        },
      };
    }
    const direction = placement.direction ?? "horizontal";
    const replaced = replaceWidgetWithSplit(
      current,
      placement.anchorInstanceId,
      direction,
      newInstanceId,
    );
    if (!replaced) {
      return {
        ok: false,
        error: {
          code: "invalid_placement",
          message: `placement.anchorInstanceId "${placement.anchorInstanceId}" was not found in the current layout.`,
          path: ["placement", "anchorInstanceId"],
        },
      };
    }
    return { ok: true, layout: replaced };
  }

  return {
    ok: false,
    error: {
      code: "invalid_placement",
      message: `Unknown placement.mode "${(placement as { mode: string }).mode}".`,
      path: ["placement", "mode"],
    },
  };
}

function replaceWidgetWithSplit(
  node: LayoutNode,
  anchorId: string,
  direction: "horizontal" | "vertical",
  newInstanceId: string,
): LayoutNode | null {
  if (node.kind === "widget") {
    if (node.instanceId === anchorId) {
      const split: LayoutSplitNode = {
        kind: "split",
        direction,
        children: [
          { kind: "widget", instanceId: anchorId },
          { kind: "widget", instanceId: newInstanceId },
        ],
      };
      return split;
    }
    return null;
  }
  let touched = false;
  const nextChildren: LayoutNode[] = [];
  for (const child of node.children) {
    if (touched) {
      nextChildren.push(child);
      continue;
    }
    const replaced = replaceWidgetWithSplit(child, anchorId, direction, newInstanceId);
    if (replaced) {
      touched = true;
      nextChildren.push(replaced);
    } else {
      nextChildren.push(child);
    }
  }
  if (!touched) return null;
  return { ...node, children: nextChildren };
}
