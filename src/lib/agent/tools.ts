import { z } from "zod";

import type { RiskClass } from "./risk";

/**
 * Minimal candidate-shell shape exposed to the agent.
 *
 * The agent does NOT see the full `Shell` Zod schema verbatim — that schema has
 * recursive layout types and superRefine guards that don't help an LLM. Instead
 * the agent sees this looser structural hint, and the server-side resolver
 * runs the candidate through the real `shellSchema` before forming a proposal.
 *
 * Anything that fails the real schema bounces back to the agent as a typed
 * retry error.
 */
export const candidateShellInput = z.object({
  name: z.string().min(1).max(80).describe("Short human-readable name for the frame."),
  template: z
    .string()
    .min(1)
    .describe(
      "Logical template id this candidate derives from. Use the existing template if this is an iteration on the current frame, or a fresh slug like 'analytics' / 'inbox' for a new frame.",
    ),
  layout: z
    .unknown()
    .describe(
      "Recursive layout tree. A node is either { kind: 'widget', instanceId } or { kind: 'split', direction: 'horizontal'|'vertical', children: Node[], sizes?: number[] }. Sizes are percents and must sum to 100. Every instanceId in the tree must exist in `widgets`.",
    ),
  widgets: z
    .record(
      z.string().min(1),
      z.object({
        type: z
          .string()
          .min(1)
          .describe("Widget slug from the capability catalog."),
        props: z
          .record(z.string(), z.unknown())
          .default({})
          .describe(
            "Props for this widget instance. Must satisfy the widget's propsSchema from the catalog.",
          ),
      }),
    )
    .describe("Widget instances by stable id, e.g. { 'notes-1': { type: 'markdown-notes', props: { ... } } }."),
  metadata: z
    .object({
      description: z.string().max(280).optional(),
      icon: z.string().max(32).optional(),
      pinned: z.boolean().optional(),
    })
    .partial()
    .optional(),
});

export type CandidateShell = z.infer<typeof candidateShellInput>;

const reasoningSchema = z
  .string()
  .min(1)
  .max(500)
  .describe("One-sentence justification surfaced to the user in the ratify card and the revision row.");

export const proposeShellInputSchema = z.object({
  shell: candidateShellInput.describe(
    "The full candidate shell to ratify. Must use only widgets that exist in the capability catalog and props that satisfy each widget's propsSchema.",
  ),
  reasoning: reasoningSchema,
});

export const proposeWidgetAdditionInputSchema = z.object({
  type: z
    .string()
    .min(1)
    .describe("Widget slug from the capability catalog."),
  instanceId: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Optional stable id for the new widget. If omitted the server assigns one. Must be unique within the frame.",
    ),
  props: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      "Props for the new widget. Falls back to the widget's defaultProps. Must satisfy the widget's propsSchema.",
    ),
  placement: z
    .object({
      mode: z
        .enum(["append", "split-after"])
        .describe(
          "'append' adds a new pane to the root layout. 'split-after' splits the named instance to make room for the new widget.",
        ),
      anchorInstanceId: z
        .string()
        .optional()
        .describe("Required when mode = 'split-after'. The instance to split next to."),
      direction: z
        .enum(["horizontal", "vertical"])
        .optional()
        .describe(
          "Direction of the new split. Defaults to 'horizontal' (side-by-side).",
        ),
    })
    .describe("Where the new widget should appear in the existing layout."),
  reasoning: reasoningSchema,
});

/**
 * Catalog-side description of a tool the agent can call. The actual `execute`
 * function is wired up in `/api/chat/route.ts` so it has access to the request
 * context (current frame summary, request id, etc.).
 *
 * `category = "proposer"` means the tool queues a candidate for user ratification
 * and never writes directly. Those tools are always `riskClass = "read"` because
 * the act of proposing is observation-grade — the user explicitly ratifies in a
 * separate step.
 */
export interface AgentToolDefinition<TInput extends z.ZodType = z.ZodType> {
  name: string;
  category: "proposer" | "action";
  riskClass: RiskClass;
  description: string;
  inputSchema: TInput;
}

export const PROPOSE_SHELL_TOOL: AgentToolDefinition<typeof proposeShellInputSchema> = {
  name: "proposeShell",
  category: "proposer",
  riskClass: "read",
  description:
    "Propose a complete new shell (frame layout + widget instances) for the user to ratify. The user reviews a side-by-side preview and explicitly ratifies, edits, or discards. You cannot write to a frame directly. Use this for brand-new frames or whole-frame restructures.",
  inputSchema: proposeShellInputSchema,
};

export const PROPOSE_WIDGET_ADDITION_TOOL: AgentToolDefinition<typeof proposeWidgetAdditionInputSchema> = {
  name: "proposeWidgetAddition",
  category: "proposer",
  riskClass: "read",
  description:
    "Propose adding a single widget to the current frame. The user reviews and ratifies. Prefer this over proposeShell when the user is iterating on the current frame.",
  inputSchema: proposeWidgetAdditionInputSchema,
};

/**
 * Every proposer tool the catalog advertises. Action tools (web.fetch, browser.*,
 * future portco APIs) are added here in P4/P5 and served through the same
 * catalog endpoint.
 */
export const AGENT_TOOL_DEFINITIONS: ReadonlyArray<AgentToolDefinition> = [
  PROPOSE_SHELL_TOOL,
  PROPOSE_WIDGET_ADDITION_TOOL,
];
