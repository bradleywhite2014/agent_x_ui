import { z } from "zod";

import { listWidgetMetas } from "@/widgets/registry.server";

import type { RiskClass } from "./risk";
import { AGENT_TOOL_DEFINITIONS, type AgentToolDefinition } from "./tools";

/**
 * The capability catalog the middleware publishes to the agent.
 *
 * v1's "middleware" is just our own Next.js server. Post-v1 it fans out to MCP
 * servers, portco APIs, the BrowserPane, etc. — but the contract the agent
 * reads against is identical either way.
 *
 * The agent reads this and *only* this when forming a proposal. It learns:
 *   - which widgets exist (so its proposals stay inside the registered set)
 *   - the shape of each widget's props (so its proposals validate cleanly)
 *   - which tools it may call and the risk class of each
 *
 * The agent never receives widget contents, user data, the database, or any
 * stored revisions through this endpoint.
 */
export const CAPABILITIES_VERSION = "agent-x/capabilities/v1" as const;

export interface WidgetCapability {
  slug: string;
  name: string;
  description: string;
  icon: string;
  propsSchema: unknown;
  defaultProps: unknown;
}

export interface ToolCapability {
  name: string;
  category: "proposer" | "action";
  riskClass: RiskClass;
  description: string;
  inputSchema: unknown;
}

export interface CapabilityCatalog {
  version: typeof CAPABILITIES_VERSION;
  widgets: WidgetCapability[];
  tools: ToolCapability[];
}

function safeToJsonSchema(schema: z.ZodType): unknown {
  return z.toJSONSchema(schema, {
    target: "draft-2020-12",
    cycles: "ref",
    unrepresentable: "any",
  });
}

export function buildWidgetCatalog(): WidgetCapability[] {
  return listWidgetMetas().map((entry) => ({
    slug: entry.meta.slug,
    name: entry.meta.name,
    description: entry.meta.description,
    icon: entry.meta.icon,
    propsSchema: safeToJsonSchema(entry.propsSchema as z.ZodType),
    defaultProps: entry.defaultProps,
  }));
}

export function buildToolCatalog(): ToolCapability[] {
  return AGENT_TOOL_DEFINITIONS.map((t: AgentToolDefinition) => ({
    name: t.name,
    category: t.category,
    riskClass: t.riskClass,
    description: t.description,
    inputSchema: safeToJsonSchema(t.inputSchema),
  }));
}

export function buildCapabilityCatalog(): CapabilityCatalog {
  return {
    version: CAPABILITIES_VERSION,
    widgets: buildWidgetCatalog(),
    tools: buildToolCatalog(),
  };
}
