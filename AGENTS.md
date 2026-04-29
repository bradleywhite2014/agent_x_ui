# AGENTS

This file is the binding contract for any AI agent (or human) working on Agent X. Read it before making changes. Update it in the same change set when a stable contract here changes.

The source of truth for the broader engineering policy is the user's standards. This file inherits from those standards and adds project-local rules.

## What this project is

Agent X is a **single-user, local-first agentic work surface**. A persistent agent observes the user, accepts instructions, and proposes mutations to a config-driven shell composed of typed widgets. Every mutation is ratified, versioned, and revertible.

For the broader thesis, see [`/Users/bradleywhite/agentic_surface/governed-agentic-surface-thesis.html`](../governed-agentic-surface-thesis.html).

For the current scope, see [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md). When in doubt, the Build Plan wins.

## Execution policy

Work in phases. Do not skip.

1. **Design brief** — 5–10 bullets on approach, key tradeoffs, interfaces.
2. **Requirements** — I/O contracts, edge cases, performance targets, telemetry, verification strategy.
3. **Workplan** — numbered tasks, each ≤90 minutes, each a PR-sized increment.
4. **Implementation** — reference task ID in commit messages.
5. **Verification** — see [Verification](#verification).

Hard rules:

- Refuse to proceed if the design or requirements are underspecified. Block with a bulleted checklist of what is needed.
- Always propose a higher-leverage alternative if one exists; justify with tradeoffs.
- Summarize relevant docs before coding. Cite paths.
- Be direct and high-agency. Push back on weak logic.
- Small PRs. If a task exceeds scope, split and stop.
- If verification fails, do not push. Report and propose fixes.

## Stack and architecture

| Concern | Choice |
|---|---|
| Framework | Next.js 15 App Router + React 19 + TypeScript (strict) |
| Styling | Tailwind v4 + shadcn/ui with CSS-variable theme tokens |
| Data | Drizzle ORM + SQLite for v1; Postgres-shaped schema for trivial migration |
| LLM | Claude Opus 4.6 via Anthropic, behind Vercel AI SDK |
| Browser tools | Playwright with persistent Chromium profile, fronted by `browser-use/browser-harness` |
| Tests | Vitest (unit), Playwright (E2E smokes) |
| Lint | ESLint + Prettier; `noImplicitAny`; no new `any` |

The default architectural rule:

- The Next.js app is the runtime. The agent edits **JSON shell config**, never arbitrary code in v1. New widgets are an explicit code change reviewed by the human.
- Backend logic lives in `src/app/api/<route>/route.ts`. There is no separate API server.
- **Local-first:** the user runs `npm run dev` on their own machine. The agent's Chromium profile, the SQLite database, and any cached responses live on that machine. Nothing leaves except calls to the configured LLM provider and explicit tool calls the user authorized.

## Source layout

```
agent_x_ui/
├── README.md
├── AGENTS.md
├── docs/                       # binding documentation spine
│   ├── BUILD_PLAN.md           # Now / Next / Later + numbered workplan
│   ├── TASK_LOG.md             # every shipped task with verification evidence
│   ├── API_CONTRACTS.md        # internal API routes, request/response/errors
│   ├── SECURITY.md             # BYO-Identity, data flows, what is and isn't stored
│   └── RUNBOOK.md              # local setup, troubleshooting
├── src/
│   ├── app/                    # Next.js routes; route entries only, no business logic
│   │   ├── api/                # route handlers (server-owned APIs)
│   │   └── (frames)/           # frame routes (/[frame], /[frame]/[revision])
│   ├── lib/                    # pure types, schemas, derivations, shared client wrappers
│   │   ├── shell/              # shell config schema + JSON Patch helpers + revision diffs
│   │   ├── ai/                 # AI SDK wiring, prompt scaffolds, tool registry
│   │   ├── tools/              # browse, fetch, search — typed tool implementations
│   │   ├── theme/              # theme tokens, presets, theme manager
│   │   └── db/                 # Drizzle schema + migrations + queries
│   ├── components/
│   │   ├── ui/                 # shadcn primitives only — do not edit by hand outside the shadcn flow
│   │   ├── shell/              # shell host: layout grid, widget host, edit mode, history sidebar
│   │   ├── chat/               # persistent chat dock + mutation proposal UI
│   │   ├── theme/              # theme manager UI
│   │   └── widgets/            # one folder per widget: <name>/index.tsx + schema.ts + meta.ts
│   └── widgets/                # widget registry index that auto-discovers components/widgets/*
├── public/
└── tests/
    ├── unit/                   # Vitest
    └── e2e/                    # Playwright smokes
```

Architectural rules for code:

- **Feature hooks own state.** Screen components receive narrow contracts and do not fetch unrelated data.
- **The shell is config.** A `Shell` is a typed JSON document validated by Zod. Anything the agent changes must be expressible as a JSON Patch against that document.
- **Widgets are self-describing.** Every widget exports `Component`, `propsSchema` (Zod), and `meta` (display name, description, capabilities the agent should know about).
- **Tools are typed.** Every tool exported to the agent has a Zod input schema, an output type, a `riskClass` (`read` | `write_local` | `write_remote` | `irreversible`), and a `confirm` policy.
- **Browser is a widget, not a hidden process.** The `BrowserPane` widget is a first-class shell element — draggable, resizable, addressable — copying Space Agent's `<x-browser>` pattern. The user and the agent are co-present on the same browser. v1 backs this with an iframe (limited by `X-Frame-Options`/CSP); v1.5 swaps in an Electron `<webview>` for full enterprise reach. The agent contract (`browser.open` / `navigate` / `click(id, ref)` / `type` / `content` / `detail`) is identical across both backends.
- **No new runtime dependencies without justification.** Add a one-line rationale to the relevant doc.
- Composition over inheritance. Registries over hardcoded imports. Adapters over vendor SDK leaks into the rest of the codebase.

## Voice and tone

Agent X talks like a credible operator, not a mascot.

- **Direct, dense, and concrete.** Status sentences in the chat dock are one line. Errors include the failing call and the next thing to try.
- **No quirky framing.** No helmets, astronauts, or "your friendly assistant" copy. The agent is a tool, not a personality.
- **No marketing voice in product surfaces.** Save brand language for the README and external materials.
- **Cite what it touched.** Every mutation proposal references the part of the shell config it would change and the reasoning in one sentence.

## Verification

Per the user's standards, verification is for **agent velocity**, not for ceremony.

In order:

1. **Agentic browser verification (primary).** Before claiming a UI task is done, the agent opens the dev server in `browser-use/browser-harness`, navigates the affected flow, screenshots it, reads the DOM and console, and iterates until it works. Screenshots go in the task log entry.
2. **`npm run typecheck && npm run lint && npm run build`** before any commit.
3. **Unit tests** for logic the agent cannot validate by eyeballing: shell-config validators, JSON-Patch math, tool-input parsers, redaction helpers, revision-diff logic.
4. **Playwright smokes** — one happy path per critical journey: open frame → ratify a proposed mutation → revert → switch theme. Do not expand without a regression motivating it.

Explicitly allowed early:

- Landing new UI components without unit tests.
- Deleting stale tests rather than fixing them when a feature pivots.

Explicitly forbidden:

- Claiming "done" without the agent having opened the page and verified it renders.
- Commits that break typecheck, lint, or build.

## Documentation discipline

- Update [`docs/BUILD_PLAN.md`](docs/BUILD_PLAN.md) and [`docs/TASK_LOG.md`](docs/TASK_LOG.md) on every task.
- Keep `Now / Next / Later` at the top of the Build Plan.
- When code reveals undocumented architecture, document it in the same change set.
- When a stable contract here changes, update this file in the same change set.

## Git protocol

- Conventional commits: `feat(scope): …`, `fix(scope): …`, `chore(scope): …`, `docs(scope): …`.
- Reference the task id from `docs/BUILD_PLAN.md` in the commit footer when applicable.
- After each task, run `bin/task_done <task-id> "<concise result>"` once that helper exists. Until it does, use `git add -A && git commit && git push` only when the user explicitly asks.
- Never update git config.
- Never force-push to `main`.
- Never commit `.env*`, credentials, or browser-profile directories.

## Security posture (v1)

Agent X is local-first and BYO-Identity. The architectural model is documented in [`docs/SECURITY.md`](docs/SECURITY.md). Keep that doc honest. Do not claim isolation or compliance properties that the architecture does not provide.

In v1 specifically:

- The agent never holds enterprise credentials. The user's existing browser sessions are the credential. The Chromium profile lives in `~/.agent-x/` (configurable) and is gitignored.
- The only outbound traffic from the Next.js process is to the LLM provider and to explicitly authorized tools.
- Tool calls with `riskClass` of `write_remote` or `irreversible` always require user confirmation in the UI before execution. The agent does not auto-approve writes.
- Logs do not contain raw tool credentials, raw cookies, or raw OAuth tokens. Truncated/hashed identifiers only.

## When in doubt

Ask. The user prefers a blocking question with a checklist over silent assumptions or scope drift.
