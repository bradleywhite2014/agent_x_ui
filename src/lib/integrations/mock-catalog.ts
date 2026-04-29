/**
 * Mock integration / middleware catalog for composable-shell UX testing.
 * Replace with real connector metadata + OAuth status when middleware lands.
 */

export type CapabilityStatus = "live" | "mock" | "planned";

export interface IntegrationCapability {
  id: string;
  /** UI grouping — maps to product areas (ERP, CRM, …). */
  domain: string;
  label: string;
  description: string;
  status: CapabilityStatus;
  /** Stable key for future `/api/tools/*` or adapter routes. */
  apiRef: string;
}

export const MOCK_INTEGRATION_CAPABILITIES: IntegrationCapability[] = [
  {
    id: "web-search",
    domain: "Web & HTTP",
    label: "web.search",
    description:
      "Search the public web with cited snippets. Used for research panels and agent grounding.",
    status: "mock",
    apiRef: "tools.web.search",
  },
  {
    id: "web-fetch",
    domain: "Web & HTTP",
    label: "web.fetch",
    description:
      "Allowlisted HTTP GET for HTML/JSON artifacts. Respects robots + host policy.",
    status: "mock",
    apiRef: "tools.web.fetch",
  },
  {
    id: "browser-control",
    domain: "Web & HTTP",
    label: "browser.*",
    description:
      "Drive embedded BrowserPane: navigate, click, type, snapshot DOM. Requires BYO session.",
    status: "planned",
    apiRef: "agent.browser",
  },
  {
    id: "email-send",
    domain: "Email",
    label: "email.send",
    description:
      "Transactional outbound via provider (e.g. Resend). Templates + idempotency keys.",
    status: "mock",
    apiRef: "integrations.email.send",
  },
  {
    id: "email-inbound",
    domain: "Email",
    label: "email.inbound",
    description:
      "Inbound parsing webhooks → normalized threads for agent triage (sandboxed).",
    status: "mock",
    apiRef: "integrations.email.inbound",
  },
  {
    id: "viz-chart",
    domain: "Visualization",
    label: "viz.chart",
    description:
      "Time-series + categorical charts bound to widget props or saved queries.",
    status: "mock",
    apiRef: "widgets.viz.chart",
  },
  {
    id: "viz-dashboard",
    domain: "Visualization",
    label: "viz.embed",
    description:
      "Embed signed dashboards (Looker, Metabase, …) with scoped tokens.",
    status: "planned",
    apiRef: "widgets.viz.embed",
  },
  {
    id: "erp-record",
    domain: "ERP",
    label: "erp.record.read",
    description:
      "Read canonical ERP rows (orders, shipments) via OData/SQL adapter.",
    status: "mock",
    apiRef: "integrations.erp.record",
  },
  {
    id: "erp-inventory",
    domain: "ERP",
    label: "erp.inventory.snapshot",
    description:
      "Inventory positions + ATP hints for operator consoles.",
    status: "mock",
    apiRef: "integrations.erp.inventory",
  },
  {
    id: "crm-contact",
    domain: "CRM",
    label: "crm.contact.lookup",
    description:
      "Resolve contacts/leads by email or id for side panels.",
    status: "mock",
    apiRef: "integrations.crm.contact",
  },
  {
    id: "crm-pipeline",
    domain: "CRM",
    label: "crm.opportunity.pipeline",
    description:
      "Pipeline stages + next-step hints for deal desks.",
    status: "mock",
    apiRef: "integrations.crm.pipeline",
  },
  {
    id: "zd-ticket",
    domain: "Support — Zendesk",
    label: "zendesk.ticket.read",
    description:
      "Ticket fetch + comments for agent-assisted replies.",
    status: "mock",
    apiRef: "integrations.zendesk.ticket",
  },
  {
    id: "zd-users",
    domain: "Support — Zendesk",
    label: "zendesk.users.search",
    description:
      "Lookup agents/requesters for routing widgets.",
    status: "mock",
    apiRef: "integrations.zendesk.users",
  },
  {
    id: "calendar-ics",
    domain: "Calendar",
    label: "calendar.ics",
    description:
      "Subscribe to ICS feeds; surface conflicts in shell widgets.",
    status: "planned",
    apiRef: "tools.calendar.ics",
  },
  {
    id: "files-list",
    domain: "Files",
    label: "files.attachments.list",
    description:
      "List ECM-linked attachments per entity (SharePoint/Drive behind adapter).",
    status: "mock",
    apiRef: "integrations.files.attachments",
  },
];

export function domainsFromCapabilities(
  caps: IntegrationCapability[],
): string[] {
  return [...new Set(caps.map((c) => c.domain))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function summarizeCapabilityCounts(caps: IntegrationCapability[]): {
  total: number;
  mock: number;
  live: number;
  planned: number;
} {
  let mock = 0;
  let live = 0;
  let planned = 0;
  for (const c of caps) {
    if (c.status === "mock") mock += 1;
    else if (c.status === "live") live += 1;
    else planned += 1;
  }
  return { total: caps.length, mock, live, planned };
}
