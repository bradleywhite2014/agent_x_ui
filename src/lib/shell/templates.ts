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
  notesTitle: string;
  notesMarkdown: string;
  previewTitle: string;
  previewUrl: string;
  atlasTitle: string;
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
      sizes: [20, 80],
      children: [
        { kind: "widget", instanceId: "rail-1" },
        {
          kind: "split",
          direction: "vertical",
          sizes: [58, 42],
          children: [
            {
              kind: "split",
              direction: "horizontal",
              sizes: [50, 50],
              children: [
                { kind: "widget", instanceId: "notes-1" },
                { kind: "widget", instanceId: "preview-1" },
              ],
            },
            { kind: "widget", instanceId: "atlas-1" },
          ],
        },
      ],
    },
    widgets: {
      "rail-1": {
        type: "integration-rail",
        props: {
          productLabel: opts.railProductLabel,
        },
      },
      "notes-1": {
        type: "markdown-notes",
        props: {
          title: opts.notesTitle,
          content: opts.notesMarkdown,
        },
      },
      "preview-1": {
        type: "web-preview",
        props: {
          title: opts.previewTitle,
          url: opts.previewUrl,
        },
      },
      "atlas-1": {
        type: "integrations-atlas",
        props: {
          title: opts.atlasTitle,
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
      "Deal-style desk: rail for treasury posture, notes tuned for liquidity / covenant checkpoints, preview + middleware atlas for ERP & accounting mocks.",
    icon: "landmark",
    build: (id) =>
      buildOperatorConsoleShell({
        id,
        slug: "finance-desk",
        frameName: "Finance Desk",
        railProductLabel: "Finance",
        notesTitle: "Desk notes",
        notesMarkdown: `# Deal desk · morning

## Liquidity & exposure
- [ ] Cash vs policy limits & LOC headroom
- [ ] Open confirmations / breaks / fails

## Today
- [ ] Funding ladder & rolls to watch
- [ ] Covenant / reporting calendar

## Audit trail
_Journal decisions here. Agent X never holds core-banking credentials — ERP reads stay behind your adapters (mocked in the atlas until wired)._`,
        previewTitle: "Market / filings",
        previewUrl: "https://www.sec.gov/edgar/search/",
        atlasTitle: "Integrations · Finance",
        metadataDescription:
          "Finance persona console — ERP, ledger reads, filings.",
        metadataIcon: "landmark",
      }),
  },
  {
    slug: "support-console",
    name: "Support Console",
    persona: "support",
    description:
      "CX-focused rail + queue notes for Zendesk-style ticketing handoffs; atlas surfaces support APIs as mocks until connectors authenticate.",
    icon: "headset",
    build: (id) =>
      buildOperatorConsoleShell({
        id,
        slug: "support-console",
        frameName: "Support Console",
        railProductLabel: "Support",
        notesTitle: "Queue",
        notesMarkdown: `# Queue · shift handoff

## Hot tickets _(paste IDs / links)_
- 

## Macros / snippets


## Escalations & SMEs


_Link Zendesk / CX tooling once OAuth is wired — the integrations atlas lists mocked Zendesk APIs for composability testing._`,
        previewTitle: "Help center",
        previewUrl: "https://example.com",
        atlasTitle: "Integrations · CX",
        metadataDescription:
          "Support persona console — tickets, users, SLAs (mocked APIs).",
        metadataIcon: "headset",
      }),
  },
  {
    slug: "ops-pulse",
    name: "Ops Pulse",
    persona: "operations",
    description:
      "Incident / SLI posture with ops checklist notes; atlas highlights ERP + observability mocks for runbooks.",
    icon: "activity",
    build: (id) =>
      buildOperatorConsoleShell({
        id,
        slug: "ops-pulse",
        frameName: "Ops Pulse",
        railProductLabel: "Operations",
        notesTitle: "Pulse",
        notesMarkdown: `# Ops pulse

## Incidents & SLIs
- [ ] Active / sev review queue
- [ ] Vendor / SaaS status checks

## Ship window / change train


## Risks & dependencies


_Use the integrations atlas for ERP snapshots + tooling mocks — wire prod adapters per tenant policy._`,
        previewTitle: "Status",
        previewUrl: "https://example.com",
        atlasTitle: "Integrations · Ops",
        metadataDescription:
          "Operations persona console — incidents, ERP hints, vendors.",
        metadataIcon: "activity",
      }),
  },
  {
    slug: "daily-operator",
    name: "Daily Operator",
    persona: "general",
    description:
      "Balanced day-plan surface: rail, notes + preview stack, integrations atlas — default multi-role starter.",
    icon: "calendar-clock",
    build: (id) =>
      buildOperatorConsoleShell({
        id,
        slug: "daily-operator",
        frameName: "Daily Operator",
        railProductLabel: "Agent X",
        notesTitle: "Today",
        notesMarkdown: `# Today

- [ ] Write the morning brief
- [ ] Review yesterday's loose ends
- [ ] One thing that would make today a win`,
        previewTitle: "Workspace",
        previewUrl: "https://example.com",
        atlasTitle: "Middleware catalog",
        metadataDescription:
          "Operator console: integration rail, notes + preview stack, integrations atlas strip.",
        metadataIcon: "calendar-clock",
      }),
  },
  {
    slug: "scratch",
    name: "Scratchpad",
    persona: "utility",
    description:
      "Single notes panel — smallest shell for experiments and schema smoke tests.",
    icon: "notebook-pen",
    build: (id) => ({
      $schema: SHELL_VERSION,
      id,
      name: "Scratchpad",
      template: "scratch",
      layout: { kind: "widget", instanceId: "notes-1" },
      widgets: {
        "notes-1": {
          type: "markdown-notes",
          props: {
            title: "Scratch",
            content:
              "# Scratchpad\n\nA single notes panel. Use it to draft, paste, think.\n",
          },
        },
      },
      metadata: {
        description: "Single-panel notes surface.",
        icon: "notebook-pen",
      },
    }),
  },
];

export function findTemplate(slug: string): Template | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}
