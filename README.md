# Agent X

> A personal agentic work-surface that runs on your machine, acts inside your already-authorized browser sessions, and shapes its UI around how you actually work.

Agent X is the reference implementation of the surface layer described in [The Governed Agentic Surface](../governed-agentic-surface-thesis.html) — the per-user, agent-composed shell that orchestrates work across an enterprise tool stack.

This first version is a single-user, local-first sandbox. The agent runs in your browser, the tools run on your machine via [`browser-use/browser-harness`](https://github.com/browser-use/browser-harness), and your access to enterprise systems is exactly the access you already have today. Agent X holds no enterprise credentials.

## Why this exists

- **Generative UI is real.** A capable model paired with a curated component library can compose operator-grade interfaces that used to take a designer-engineer pair a sprint.
- **Per-user is finally affordable.** The shell can be tailored to the person, not the role. Memory + telemetry + ratified mutations make it compound over time.
- **BYO-Identity sidesteps the middleware problem for v1.** The agent acts in your browser session as you. No SSO federation, no SCIM, no DLP plane required to start. Existing systems of record continue to audit existing user activity.

## Status

Pre-alpha. Single-user, local-first, in active design. See [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) for the current roadmap and [`docs/TASK_LOG.md`](docs/TASK_LOG.md) for shipped work.

P0 (foundation) and P1 (shell-as-config runtime) are live. P2 (agent loop) is live: a chat dock in `/frames/[id]` streams from `/api/chat`, the agent reads a curated capability catalog (and a structure-only summary of the current frame — never widget contents), and the only writes the agent can produce are typed proposals that the user explicitly ratifies. Doctrine in [`AGENTS.md`](AGENTS.md).

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**, strict types, no `any`
- **Tailwind v4** + **shadcn/ui** with a first-class **Theme Manager** (presets, custom palette editor, density, font pairing)
- **Drizzle ORM** + **SQLite** for v1 (Postgres-shaped schema; trivial migration to Neon when we go multi-user)
- **Anthropic Claude Opus 4.6** as default model, **Vercel AI SDK** so the provider is swappable
- **Playwright + `browser-use/browser-harness`** for agent browser actions in BYO-Identity mode
- **Vitest** + **Playwright** for verification

## Quickstart

> Local-first. The agent's browser runs on your machine and persists sessions in a local profile. Nothing leaves the box except calls to your chosen LLM provider.

```bash
git clone git@github.com:bradleywhite2014/agent_x_ui.git
cd agent_x_ui
cp .env.example .env.local
# fill in ANTHROPIC_API_KEY and any tool keys you want available
npm install
npm run dev
# open http://localhost:3000
```

Detailed setup, including the `browser-use/browser-harness` Chromium profile and tool-key wiring, lives in [`docs/RUNBOOK.md`](docs/RUNBOOK.md).

## Project documentation

- [`AGENTS.md`](AGENTS.md) — agent execution contract, voice, file structure, rules for AI-driven development
- [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) — Now / Next / Later, design brief, requirements, numbered workplan
- [`docs/TASK_LOG.md`](docs/TASK_LOG.md) — every completed task with verification evidence
- [`docs/API_CONTRACTS.md`](docs/API_CONTRACTS.md) — every internal API route, request, response, errors
- [`docs/SECURITY.md`](docs/SECURITY.md) — BYO-Identity model, data flows, what the system does and does not store
- [`docs/RUNBOOK.md`](docs/RUNBOOK.md) — local environment, dependencies, troubleshooting

## Naming

`agent_x_ui` is the working repo name. The product codename is **Agent X**. The customer-facing brand has not been chosen and will be locked in [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) before first external demo.

## License

TBD — held until after the v1 milestone.
