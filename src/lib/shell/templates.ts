import type { Shell } from "./schema";
import { SHELL_VERSION } from "./schema";

/**
 * Built-in template seeds. Each template is a function so the caller can
 * stamp a fresh `id` per shell while keeping the rest of the document
 * deterministic.
 */

export type TemplatePersona =
  | "finance"
  | "support"
  | "operations"
  | "general"
  | "utility";

export interface TemplateMeta {
  slug: string;
  name: string;
  description: string;
  icon: string;
  /** Frames-picker grouping + badge copy (not stored on Shell JSON). */
  persona?: TemplatePersona;
}

export interface Template extends TemplateMeta {
  build: (id: string) => Shell;
}

/** Stable sort: persona surfaces before general utility templates. */
const PERSONA_ORDER: TemplatePersona[] = [
  "finance",
  "support",
  "operations",
  "general",
  "utility",
];

export function personaRank(p: TemplatePersona | undefined): number {
  const idx = PERSONA_ORDER.indexOf(p ?? "general");
  return idx === -1 ? PERSONA_ORDER.length : idx;
}

/** Short labels for template picker badges. */
export const PERSONA_LABEL: Record<TemplatePersona, string> = {
  finance: "Finance & treasury",
  support: "Customer experience",
  operations: "Operations",
  general: "General",
  utility: "Minimal",
};

function buildOperatorConsoleShell(opts: {
  id: string;
  slug: string;
  frameName: string;
  railProductLabel: string;
  dashboardPersona: "finance" | "support" | "operations" | "general";
  dashboardTitle: string;
  metadataDescription: string;
  metadataIcon: string;
}): Shell {
  return {
    $schema: SHELL_VERSION,
    id: opts.id,
    name: opts.frameName,
    template: opts.slug,
    layout: {
      kind: "split",
      direction: "horizontal",
      sizes: [18, 82],
      children: [
        { kind: "widget", instanceId: "rail-1" },
        { kind: "widget", instanceId: "dashboard-1" },
      ],
    },
    widgets: {
      "rail-1": {
        type: "integration-rail",
        props: {
          productLabel: opts.railProductLabel,
        },
      },
      "dashboard-1": {
        type: "role-command-center",
        props: {
          persona: opts.dashboardPersona,
          title: opts.dashboardTitle,
        },
      },
    },
    metadata: {
      description: opts.metadataDescription,
      icon: opts.metadataIcon,
    },
  };
}

export const TEMPLATES: Template[] = [
  {
    slug: "finance-desk",
    name: "Finance Desk",
    persona: "finance",
    description:
      "Treasury-grade console with mocked Databricks finance marts, ERP reads, AR risk, and close-work signals.",
    icon: "landmark",
    build: (id) =>
      buildOperatorConsoleShell({
        id,
        slug: "finance-desk",
        frameName: "Finance Desk",
        railProductLabel: "Finance",
        dashboardPersona: "finance",
        dashboardTitle: "Finance Desk",
        metadataDescription:
          "Finance persona console — Databricks financial marts, ERP, billing, and close signals.",
        metadataIcon: "landmark",
      }),
  },
  {
    slug: "support-console",
    name: "Support Console",
    persona: "support",
    description:
      "Customer-experience console with mocked Zendesk, CRM, product telemetry, SLA risk, and suggested handoffs.",
    icon: "headset",
    build: (id) =>
      buildOperatorConsoleShell({
        id,
        slug: "support-console",
        frameName: "Support Console",
        railProductLabel: "Support",
        dashboardPersona: "support",
        dashboardTitle: "Support Console",
        metadataDescription:
          "Support persona console — tickets, SLA risk, CRM health, and docs-search mocks.",
        metadataIcon: "headset",
      }),
  },
  {
    slug: "ops-pulse",
    name: "Ops Pulse",
    persona: "operations",
    description:
      "Operations pulse with mocked ServiceNow, Datadog, SAP / ERP inventory, and vendor status signals.",
    icon: "activity",
    build: (id) =>
      buildOperatorConsoleShell({
        id,
        slug: "ops-pulse",
        frameName: "Ops Pulse",
        railProductLabel: "Operations",
        dashboardPersona: "operations",
        dashboardTitle: "Ops Pulse",
        metadataDescription:
          "Operations persona console — incidents, inventory, deploy risk, and vendor health.",
        metadataIcon: "activity",
      }),
  },
  {
    slug: "daily-operator",
    name: "Daily Operator",
    persona: "general",
    description:
      "Cross-functional operating surface with mocked CRM, ERP, support, email, and Databricks-style signals.",
    icon: "calendar-clock",
    build: (id) =>
      buildOperatorConsoleShell({
        id,
        slug: "daily-operator",
        frameName: "Daily Operator",
        railProductLabel: "Agent X",
        dashboardPersona: "general",
        dashboardTitle: "Daily Operator",
        metadataDescription:
          "General operator console — cross-functional mock integration signals.",
        metadataIcon: "calendar-clock",
      }),
  },
  {
    slug: "blank-canvas",
    name: "Blank Canvas",
    persona: "utility",
    description:
      "Empty composable frame — start from nothing and let the agent or Edit mode add the right surface.",
    icon: "panel-top-open",
    build: (id) => ({
      $schema: SHELL_VERSION,
      id,
      name: "Blank Canvas",
      template: "blank-canvas",
      layout: { kind: "widget", instanceId: "blank-1" },
      widgets: {
        "blank-1": {
          type: "blank-canvas",
          props: {
            title: "Blank canvas",
          },
        },
      },
      metadata: {
        description: "Empty shell for composing from scratch.",
        icon: "panel-top-open",
      },
    }),
  },
];

export function findTemplate(slug: string): Template | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}
