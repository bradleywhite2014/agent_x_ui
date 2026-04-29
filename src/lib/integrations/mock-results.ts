export type DashboardPersona =
  | "finance"
  | "support"
  | "operations"
  | "general";

export interface KpiResult {
  label: string;
  value: string;
  delta: string;
  tone: "good" | "watch" | "neutral";
  source: string;
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface WorkItemResult {
  id: string;
  label: string;
  owner: string;
  status: string;
  signal: string;
}

export interface IntegrationFeedItem {
  system: string;
  object: string;
  detail: string;
  freshness: string;
}

export interface RoleDashboardData {
  persona: DashboardPersona;
  eyebrow: string;
  title: string;
  subtitle: string;
  delight: string;
  kpis: KpiResult[];
  seriesLabel: string;
  series: SeriesPoint[];
  workItems: WorkItemResult[];
  feed: IntegrationFeedItem[];
}

const dashboards: Record<DashboardPersona, RoleDashboardData> = {
  finance: {
    persona: "finance",
    eyebrow: "Finance command surface",
    title: "Liquidity, exposure, and close signals",
    subtitle:
      "Mocked from Databricks financial marts, NetSuite ERP, Stripe Billing, and bank-feed adapters.",
    delight: "Treasury radar is calm: no covenant drift in the mock book.",
    kpis: [
      {
        label: "Cash runway",
        value: "14.2 mo",
        delta: "+0.8 mo",
        tone: "good",
        source: "databricks.finance.daily_cash",
      },
      {
        label: "AR at risk",
        value: "$842k",
        delta: "-6.1%",
        tone: "watch",
        source: "netsuite.ar_aging",
      },
      {
        label: "Close blockers",
        value: "7",
        delta: "3 high",
        tone: "watch",
        source: "erp.close_tasks",
      },
      {
        label: "Forecast variance",
        value: "2.4%",
        delta: "inside band",
        tone: "good",
        source: "databricks.fpna.forecast",
      },
    ],
    seriesLabel: "Cash balance trend (mock)",
    series: [
      { label: "Mon", value: 72 },
      { label: "Tue", value: 76 },
      { label: "Wed", value: 70 },
      { label: "Thu", value: 82 },
      { label: "Fri", value: 88 },
      { label: "Today", value: 91 },
    ],
    workItems: [
      {
        id: "FIN-1082",
        label: "Resolve EU bank-feed break",
        owner: "Treasury",
        status: "watch",
        signal: "2 unreconciled txns",
      },
      {
        id: "FIN-1104",
        label: "Approve QBR revenue bridge",
        owner: "FP&A",
        status: "ready",
        signal: "variance annotated",
      },
      {
        id: "FIN-1117",
        label: "Covenant packet draft",
        owner: "Controller",
        status: "draft",
        signal: "NetSuite + Databricks synced",
      },
    ],
    feed: [
      {
        system: "Databricks",
        object: "gold.finance.daily_cash",
        detail: "6 partitions fresh; P95 query 420ms",
        freshness: "4m ago",
      },
      {
        system: "NetSuite ERP",
        object: "AR aging",
        detail: "$842k > 60 days; 11 accounts flagged",
        freshness: "12m ago",
      },
      {
        system: "Stripe Billing",
        object: "MRR events",
        detail: "27 renewals, 2 downgrades, 0 failed webhooks",
        freshness: "live mock",
      },
    ],
  },
  support: {
    persona: "support",
    eyebrow: "Support command surface",
    title: "Queue health and customer risk",
    subtitle:
      "Mocked from Zendesk, Salesforce CRM, product telemetry, and docs-search adapters.",
    delight: "SLA radar found a quiet lane: two escalations can be closed with macros.",
    kpis: [
      {
        label: "Open priority",
        value: "38",
        delta: "-12 today",
        tone: "good",
        source: "zendesk.ticket.search",
      },
      {
        label: "SLA risk",
        value: "4",
        delta: "2 in 30m",
        tone: "watch",
        source: "zendesk.sla_policies",
      },
      {
        label: "Sentiment",
        value: "81%",
        delta: "+5 pts",
        tone: "good",
        source: "product.feedback_stream",
      },
      {
        label: "CRM value at risk",
        value: "$1.3M",
        delta: "5 accounts",
        tone: "watch",
        source: "salesforce.account_health",
      },
    ],
    seriesLabel: "SLA risk curve (mock)",
    series: [
      { label: "8a", value: 42 },
      { label: "10a", value: 55 },
      { label: "12p", value: 47 },
      { label: "2p", value: 35 },
      { label: "4p", value: 29 },
      { label: "Now", value: 21 },
    ],
    workItems: [
      {
        id: "ZD-4821",
        label: "Enterprise SSO regression",
        owner: "Tier 2",
        status: "escalated",
        signal: "CRM ARR > $500k",
      },
      {
        id: "ZD-4829",
        label: "Webhook replay guidance",
        owner: "Macro ready",
        status: "ready",
        signal: "docs match found",
      },
      {
        id: "ZD-4833",
        label: "Invoice email missing",
        owner: "Billing",
        status: "handoff",
        signal: "Stripe event located",
      },
    ],
    feed: [
      {
        system: "Zendesk",
        object: "priority tickets",
        detail: "38 open; 4 SLA risk; 2 macro candidates",
        freshness: "live mock",
      },
      {
        system: "Salesforce",
        object: "account health",
        detail: "5 enterprise accounts tied to risky tickets",
        freshness: "9m ago",
      },
      {
        system: "Docs Search",
        object: "resolution snippets",
        detail: "12 cited answers prepared for agent drafting",
        freshness: "2m ago",
      },
    ],
  },
  operations: {
    persona: "operations",
    eyebrow: "Operations command surface",
    title: "Incidents, inventory, and vendor posture",
    subtitle:
      "Mocked from ServiceNow, Datadog, SAP / NetSuite inventory, and vendor-status feeds.",
    delight: "The change train is clear: freeze window starts after the current deploy.",
    kpis: [
      {
        label: "Active incidents",
        value: "2",
        delta: "0 sev-1",
        tone: "good",
        source: "servicenow.incidents",
      },
      {
        label: "Deploy risk",
        value: "Medium",
        delta: "1 dependency",
        tone: "watch",
        source: "datadog.change_events",
      },
      {
        label: "Inventory alerts",
        value: "11",
        delta: "-4 today",
        tone: "watch",
        source: "sap.inventory.atp",
      },
      {
        label: "Vendor health",
        value: "97%",
        delta: "green",
        tone: "good",
        source: "statuspage.vendor_rollup",
      },
    ],
    seriesLabel: "Incident pressure (mock)",
    series: [
      { label: "Mon", value: 63 },
      { label: "Tue", value: 48 },
      { label: "Wed", value: 70 },
      { label: "Thu", value: 44 },
      { label: "Fri", value: 36 },
      { label: "Now", value: 24 },
    ],
    workItems: [
      {
        id: "OPS-771",
        label: "Warehouse ASN delay",
        owner: "Supply ops",
        status: "watch",
        signal: "SAP ATP below buffer",
      },
      {
        id: "OPS-779",
        label: "Datadog deploy anomaly",
        owner: "Platform",
        status: "triage",
        signal: "latency +18%",
      },
      {
        id: "OPS-786",
        label: "Vendor SLA exception",
        owner: "Procurement",
        status: "ready",
        signal: "credits calculable",
      },
    ],
    feed: [
      {
        system: "ServiceNow",
        object: "incident queue",
        detail: "2 active incidents; none sev-1",
        freshness: "live mock",
      },
      {
        system: "SAP S/4HANA",
        object: "available-to-promise",
        detail: "11 inventory alerts across 4 SKUs",
        freshness: "7m ago",
      },
      {
        system: "Datadog",
        object: "change events",
        detail: "1 deploy correlated with latency movement",
        freshness: "3m ago",
      },
    ],
  },
  general: {
    persona: "general",
    eyebrow: "Executive operating surface",
    title: "Today’s cross-functional signal",
    subtitle:
      "Mocked from CRM, ERP, Zendesk, Databricks, and email/calendar adapters.",
    delight: "No hidden fires in the mock graph — three useful next moves surfaced.",
    kpis: [
      {
        label: "Revenue signal",
        value: "+3.8%",
        delta: "pipeline lift",
        tone: "good",
        source: "salesforce.pipeline",
      },
      {
        label: "Customer risk",
        value: "5 accts",
        delta: "2 urgent",
        tone: "watch",
        source: "zendesk + crm join",
      },
      {
        label: "Ops pressure",
        value: "Low",
        delta: "green",
        tone: "good",
        source: "service rollup",
      },
      {
        label: "Unread priority",
        value: "14",
        delta: "mock inbox",
        tone: "neutral",
        source: "email.priority",
      },
    ],
    seriesLabel: "Org pressure index (mock)",
    series: [
      { label: "Mon", value: 45 },
      { label: "Tue", value: 52 },
      { label: "Wed", value: 40 },
      { label: "Thu", value: 36 },
      { label: "Fri", value: 34 },
      { label: "Now", value: 31 },
    ],
    workItems: [
      {
        id: "NOW",
        label: "Review two support-at-risk accounts",
        owner: "CX + Sales",
        status: "next",
        signal: "ARR concentration",
      },
      {
        id: "TODAY",
        label: "Approve finance close narrative",
        owner: "Finance",
        status: "ready",
        signal: "variance annotated",
      },
      {
        id: "LATER",
        label: "Check ops deploy window",
        owner: "Platform",
        status: "watch",
        signal: "dependency queued",
      },
    ],
    feed: [
      {
        system: "Salesforce",
        object: "pipeline rollup",
        detail: "3 opps moved; 1 exec touch suggested",
        freshness: "live mock",
      },
      {
        system: "Zendesk",
        object: "customer risk join",
        detail: "2 tickets overlap expansion accounts",
        freshness: "6m ago",
      },
      {
        system: "Email",
        object: "priority inbox",
        detail: "14 priority items; 4 can be summarized",
        freshness: "2m ago",
      },
    ],
  },
};

export function getRoleDashboardData(
  persona: DashboardPersona | undefined,
): RoleDashboardData {
  return dashboards[persona ?? "general"] ?? dashboards.general;
}
