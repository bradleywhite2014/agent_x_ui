# Build Plan

> **Source of truth for current scope.** Every task in flight references a task ID from this file. When this file conflicts with anything else, this file wins until the conflict is resolved here.

## Now / Next / Later

### Now (next ~2 weeks)
- **P0** Project foundation: Next.js 15 + TS strict + Tailwind v4 + shadcn + Drizzle/SQLite + Vitest + Playwright + AI SDK
- **P1** Shell-as-config runtime: Zod-validated shell document, layout grid, widget host, two starter widgets (Markdown notes, Web Preview)
- **P2** Agent loop end-to-end on one flow: chat dock → propose JSON Patch → ratify/reject UI → revision row written → revert button works
- **P3** Theme Manager — semantic CSS tokens, five presets (`default`, `slate`, `forest`, `sunset`, `mono`), global prefs (`theme.global`) + per-frame overrides on `shell.theme`, Theme Manager sheet with live preview — **shipped** (TASK-18..TASK-21)

### Next (~weeks 3–5)
- **P4** **`BrowserPane` widget** — embedded browser with floating-window chrome (drag/resize/minimize), persisted window state, multi-browser registry, and the `agent.browser.*` API for read/click/type/navigate, copying Space Agent's `<x-browser>` pattern
- **P5** Public-web tools: web search, allowlisted HTTP GET, RSS, ICS calendar
- **P6** Frame templates: Daily Operator, Research Workspace, Project Tracker, Reading Room

### Later (post-v1)
- **v1.5 Electron host** — wrap the same Next.js app, swap `BrowserPane`'s iframe for `<webview>` so enterprise SaaS works under the same widget contract. Persistent Chromium profile inherits user sessions.
- Multi-user, Clerk auth, per-portco tenancy
- DLP / runtime classification plane (Section 4 of the thesis)
- Org Policy + Role Defaults layer (the L1 of the thesis's four-layer plane)
- MCP client support, Integration-as-a-Service connector pack (`unified.to`)
- Enterprise audit log (`audit_log` Postgres table) and Axiom mirror
- Hosted deploy on Railway (zero-downtime, Cloudflare in front)
- "Take it with you" portability — exporting a user's shell + memory to another instance

---

## 1. Design Brief

**Problem.** Knowledge workers context-switch across a dozen SaaS tools. The thesis argues the durable position is a per-user, agent-composed work surface that orchestrates that stack. The hard part of that thesis (governance, IAM federation, DLP) is not the right v1 — the hard part to *prove* is whether the personalization loop compounds at all.

**Approach.** Build the cheapest possible working surface that lets one user (the developer) explore what an agent-composed shell actually feels like, and whether the ratify/mutate/revert loop produces a divergent, better surface over weeks. Strip out everything that does not contribute to that question.

**Five tradeoffs that define this build.**

1. **Local-first over hosted.** The user runs `npm run dev`. The agent's tools run on their machine. Trades multi-user out, trades the entire IAM/middleware problem out for v1, gains the BYO-Identity compliance story.
2. **Config-driven shell over runtime code-gen.** The agent edits a typed JSON document, not arbitrary TypeScript. Trades expressivity (the agent can't invent a brand-new widget on the fly) for type safety, predictability, and the ability to ship in weeks. New widgets are a code change.
3. **Embedded browser as a first-class widget over a hidden automation process.** A `BrowserPane` widget is a draggable, resizable, addressable window inside the shell — like Space Agent's `<x-browser>`. The user and agent are **co-present**: they see and act on the same browser. v1 uses iframe (limited by `X-Frame-Options`/CSP — fine for embedding-friendly sites); v1.5 adds a thin Electron host that swaps the iframe for a `<webview>` so enterprise SaaS works. Same widget contract, two implementations.
4. **shadcn + a real Theme Manager over a fixed visual identity.** Theming is a first-class user setting, not a buried preference. Spices up the default shadcn look and seeds the v2 "your shell follows you" portability story.
5. **One LLM, agnostic underneath.** Default to Claude Opus 4.6. Vercel AI SDK so swapping providers (or running a local model in Sovereign tier later) is a config change, not a refactor.

**Interfaces (the load-bearing contracts).**

- `Shell` — a Zod-validated JSON document describing one frame: layout grid, widget instances with props, theme overrides, metadata.
- `Widget` — a typed component module exporting `{ Component, propsSchema, meta }`. The registry auto-discovers them.
- `Tool` — a typed function exported to the agent: `{ name, inputSchema, output, riskClass, confirm }`. Risk class controls whether confirmation is required.
- `MutationProposal` — `{ patch: JsonPatch, reasoning: string, affects: string[] }` produced by the agent and presented to the user as a diff.
- `Revision` — a snapshot of the shell after a ratified mutation, immutable, time-travelable.

---

## 2. Requirements

### Functional

- **R1** A user can pick a starting frame template, name their shell, and land in an editable view.
- **R2** A user can drag, resize, add, remove, and reconfigure widgets manually. Every change creates a revision.
- **R3** A user can chat with the agent in a persistent dock. The agent can propose mutations to the shell that the user ratifies, rejects, or modifies.
- **R4** Every revision is listed in a sidebar with a one-line description, timestamp, and one-click revert. Reverts also create a new revision (no destructive history).
- **R5** A user can open the Theme Manager, pick a preset theme, edit colors / radius / density / font, and apply. Theme changes can be global or per-frame.
- **R6** The agent can call the following tools, each typed: `web.search`, `web.fetch`, `web.rss`, `calendar.ics`, `browser.*` (open/navigate/click/type/content/detail against an embedded `BrowserPane`), and `shell.proposeMutation`. Tool calls with `riskClass = write_remote | irreversible` always prompt the user for confirmation.
- **R7** The user can open one or more `BrowserPane` widgets — each is a draggable, resizable, addressable browser window inside the shell. The agent and the user see and act on the same browser. Window state (URL, position, size, minimized state, internal id) is persisted and restored on reload.

### Non-functional

- **N1** Strict TypeScript. No `any` introduced by this codebase. Existing transitive `any` from shadcn templates is acceptable but tracked.
- **N2** First paint of the shell on a warm dev server in <500ms; agent first token in <1.5s for short prompts on Opus 4.6.
- **N3** Accessibility: keyboard parity with mouse, focus traps in modals, `role="status" aria-live="polite"` for streaming agent output, labelled regions for the shell grid.
- **N4** All async surfaces have a visible loading affordance within 250ms.
- **N5** Logs (console + `~/.agent-x/logs/*.jsonl`) include `request_id`, `latency_ms`, `tool_name`, `error_class`. No raw tokens, cookies, or secrets in logs.
- **N6** All deep-linkable state (frame, revision, drawer, selected entity) lives in the URL. Browser back/forward behaves like a real product.

### Edge cases

- **E1** Agent proposes invalid JSON Patch → reject with a structured error and ask the agent to retry once with the validation message; surface failure to the user after the second invalid proposal.
- **E2** Tool call fails (timeout, 4xx, 5xx) → agent receives a typed error envelope; the failure surfaces in the chat dock with the failing call quoted.
- **E3** Target site refuses iframe (`X-Frame-Options: DENY` or `frame-ancestors` CSP) → `BrowserPane` shows a clear "this site doesn't allow embedding — open in a new tab" affordance with a one-click handoff. The agent surfaces the limitation and pauses the workflow.
- **E4** Two mutations proposed back-to-back → second proposal rebases on first; conflicts shown in the diff view.
- **E5** SQLite write fails or schema is out of date → app loads in read-only mode and surfaces a clear migration prompt; no silent data loss.

### SLOs (v1, single user, dev-mode)

- Cold start of `npm run dev` to first interactive paint: <8s
- Mutation proposal end-to-end (chat send → diff visible): <3s for short prompts
- Revert: <250ms perceptible
- `browser.click` round-trip (action + simplified DOM read): <500ms in iframe mode; <1s through webview when v1.5 lands

### Telemetry

- Console + `~/.agent-x/logs/agent.jsonl` and `~/.agent-x/logs/tools.jsonl`.
- Per request: `route`, `method`, `status`, `latency_ms`, `request_id`.
- Per AI call: `provider`, `model`, `prompt_tokens`, `completion_tokens`, `latency_ms`, `retries`.
- Per tool call: `tool_name`, `risk_class`, `confirmed`, `latency_ms`, `error_class`.
- No raw secrets or full PII blobs.

### Verification strategy

Per `AGENTS.md`:

1. The agent runs `browser-use/browser-harness` against `http://localhost:3000` after each UI task and captures screenshots.
2. `npm run typecheck && npm run lint && npm run build` blocks any commit that fails them.
3. Unit tests cover: shell-config Zod validation, JSON Patch apply/diff, tool input parsers, theme token computation, revision-diff summarization.
4. One Playwright smoke per template covering: load → manual mutation → ratified agent mutation → revert → theme switch.

---

## 3. Workplan

Tasks are PR-sized (~≤90 min). IDs are stable: reference them in commit footers (e.g., `feat(shell): typed shell config schema [TASK-7]`). Update [`docs/TASK_LOG.md`](TASK_LOG.md) when each task ships with a one-line result and a link to the verification screenshot or test output.

### Phase 0 — Foundation (P0)

| ID | Task | Acceptance |
|---|---|---|
| TASK-1 | Init Next.js 15 (App Router, TS strict, Tailwind v4) via `create-next-app` and prune defaults | `npm run dev` serves an empty operator-grade landing |
| TASK-2 | Add shadcn + initial primitives: `button`, `card`, `dialog`, `dropdown-menu`, `input`, `scroll-area`, `separator`, `sheet`, `sonner`, `tabs`, `tooltip` via the shadcn MCP | Components render, dark mode toggle works |
| TASK-3 | ESLint + Prettier + tsconfig strict + Vitest + Playwright config; add `npm run typecheck`, `lint`, `test`, `e2e`, `build` scripts | All pass on empty repo |
| TASK-4 | Drizzle ORM + better-sqlite3 + initial schema (`shells`, `revisions`, `widgets_index`, `tools_log`, `themes`) + first migration runner | `npm run db:migrate` creates `~/.agent-x/agent_x.db` |
| TASK-5 | Vercel AI SDK + Anthropic provider + Opus 4.6 default + `/api/chat` route streaming text back | A test prompt in dev returns a streamed reply |
| TASK-6 | `.env.example`, `.gitignore` (covering `.env*`, `~/.agent-x/`, `playwright-profile/`), and `docs/RUNBOOK.md` quickstart | Fresh clone runs end to end |

### Phase 1 — Shell-as-config runtime (P1)

| ID | Task | Acceptance |
|---|---|---|
| TASK-7 | `Shell` Zod schema in `src/lib/shell/schema.ts` (frame, layout grid, widgets[], theme override, metadata) + sample `daily-operator.json` seed | `validateShell(json)` round-trips a sample without loss |
| TASK-8 | Layout primitives: CSS grid wrapper + `react-resizable-panels` integration in `src/components/shell/Layout.tsx` | Panels resize with mouse + keyboard |
| TASK-9 | Widget registry: convention-based discovery in `src/widgets/index.ts`, plus 2 widgets — `markdown-notes` and `web-preview` | Adding a widget folder makes it available without manual registration |
| TASK-10 | `/[frame]/[[...revision]]` route + frame selector landing page | URL drives state; back/forward work |
| TASK-11 | Edit mode toggle in the top bar + add/remove widgets from a palette | Edits create revisions |
| TASK-12 | Revision sidebar (history list with one-line summary + timestamp) + one-click revert (creates a new revision) | Revert works; history is append-only |

### Phase 2 — Agent loop (P2)

**Doctrine (clarified 2026-04-28).** The agent has no ambient access to the user's state. It is given the **capability catalog** the middleware publishes (today: our Next.js app's widget + tool registries; later: real middleware fanning out to portco systems) and, when the user is asking to modify the *current* frame, a structure-only summary of that frame. Its only outputs are typed *proposers* (queue a candidate UI for ratification) and typed *action tools* (each with a `riskClass` that gates auto-execute vs confirm). The agent never reads the database, never POSTs revisions, never invents capabilities the catalog didn't advertise.

When the user asks for a brand-new frame the agent operates on (catalog + user message) only. When they're iterating on the current frame the prompt also includes the structure-only summary. The agent must never see widget *contents*, only structure.

| ID | Task | Acceptance |
|---|---|---|
| TASK-13 | `GET /api/capabilities` — widget catalog (slug, name, description, JSON-Schema-shaped propsSchema, defaultProps) + tool catalog (name, description, inputSchema, riskClass). Sourced from the registries. | Endpoint returns the two registered widgets and the seed proposer tools; widget propsSchema round-trips through Zod → JSON Schema cleanly |
| TASK-14 | Chat dock UI — collapsible right-pane in `/frames/[id]`, streams from `/api/chat` via `useChat`, `aria-live` for accessibility, no layout shift, persists open/closed state in URL or local pref | Streamed tokens render while the shell stays interactive; collapsing/reopening preserves the conversation in-memory |
| TASK-15 | System-prompt builder + `/api/chat` plumbing — composes catalog + frame-structure summary (instance ids, types, placement; **no widget contents**) + user message. Server-side helper `summarizeFrameStructure(shell)` enforces no contents leak. | Agent can answer "what widgets can I propose?" correctly using catalog only; "what widgets are in this frame?" using the structure summary; "what's in my notes?" returns a refusal because contents aren't in the prompt |
| TASK-16 | Agent proposer tools (Vercel AI SDK `tool()`): `proposeShell({ shell, reasoning })` and `proposeWidgetAddition({ instanceId, type, props, placement, reasoning })`. Both validated server-side against the capability catalog + Shell Zod schema before being surfaced to the user. Invalid candidates return a typed retry error to the agent (one retry, then surface failure). | A proposal that uses an unknown widget slug or invalid props returns a structured error; a valid proposal yields a `MutationProposal` envelope passed to the client |
| TASK-17 | Ratify UI — proposal renders inline in the chat dock as a card with side-by-side preview (current frame ↔ proposed frame, both rendered through `ShellLayout` in read-only mode) + "Ratify" / "Discard" / "Edit". Ratify → client POSTs the new shell to existing `/api/frames/[id]/revisions` with `authoredBy = "agent"` and `reasoning`. Revision sidebar surfaces an "agent" badge + the reasoning. | Ratified proposal writes a revision and updates the shell; discarded proposal is dropped; sidebar clearly distinguishes user vs agent revisions |

### Phase 3 — Theme system (P3)

| ID | Task | Acceptance |
|---|---|---|
| TASK-18 | CSS variable theme tokens in `src/lib/theme/tokens.ts` (color scales, radius, spacing, fontFamily, density) | Theme tokens drive shadcn primitives |
| TASK-19 | Theme Manager UI (sheet): preset list, color picker per token, radius/density/font controls, live preview | Changes apply live; a "Reset" button restores defaults |
| TASK-20 | 5 preset themes: `Default`, `Slate`, `Forest`, `Sunset`, `Mono` | All render cleanly in light + dark mode |
| TASK-21 | Per-frame theme overrides stored on the `Shell` doc; global theme stored in user prefs | Switching frames applies their override; clearing the override falls back to global |

### Phase 4 — `BrowserPane` widget + agent browser API + public-web tools (P4, P5)

| ID | Task | Acceptance |
|---|---|---|
| TASK-22 | `BrowserPane` widget skeleton: iframe-backed, accepts `src` and `controls` props, fills its grid cell, treats bare hosts (`example.com`, `localhost:3000`) as address-bar input | Drop a `BrowserPane` into a frame with a URL and it loads |
| TASK-23 | Floating-window chrome variant: drag from title bar, resize from corner, minimize/restore, close. Uses `react-resizable-panels` primitives plus a thin floating-window component | Drag/resize/minimize/restore work with mouse + keyboard |
| TASK-24 | Browser registry + persisted window state (DB-backed, restored on reload). Multi-browser by id (numeric `1`, `2`, …). Refusal handler for sites that block iframe embedding (`X-Frame-Options`/CSP) with a "Open in new tab" affordance | Windows survive a `Cmd-R`; refusal shows a clear message and a working external-open button |
| TASK-25 | Agent browser API: typed `browser.open`, `browser.close`, `browser.navigate`, `browser.click(id, ref)`, `browser.type(id, ref, value)`, `browser.scroll(id, ref?)`, `browser.content(id)` (returns simplified markdown with typed refs `[link N]` / `[button N]` / `[input N]`), `browser.detail(id, ref)` (resolved DOM target + state), `browser.list()`, `browser.state(id)` | Agent can drive a same-origin embedded page round-trip, refs resolve correctly |
| TASK-26 | `web.search` tool (provider locked in `BUILD_PLAN.md` §4 before this task starts) | Returns typed results, logged with latency |
| TASK-27 | `web.fetch` tool with allowlist (configurable in `~/.agent-x/config.yaml`); `web.rss` and `calendar.ics` tools | Off-allowlist hosts return a structured 403 to the agent; RSS/ICS return parsed typed objects |
| TASK-28 | Risk-class confirmation flow: `write_remote` and `irreversible` tools open a modal showing the exact call before executing | No write fires without an explicit click |

### Phase 5 — Frame templates (P6)

| ID | Task | Acceptance |
|---|---|---|
| TASK-29 | Template seed loader in `src/lib/shell/templates.ts` + frame picker UI | Picking a template clones it into a new shell with a fresh revision history |
| TASK-30 | `Daily Operator` template (todo list, calendar, RSS, agent dock) | Renders cleanly; agent can mutate it |
| TASK-31 | `Research Workspace` template (web search, markdown notes, `BrowserPane`) | Same |
| TASK-32 | `Project Tracker` template (kanban, markdown notes, GitHub repo card, `BrowserPane`) | Same |
| TASK-33 | `Reading Room` template (RSS feeds, markdown notes, calendar) | Same |

### Phase 6 — Verification and polish

| ID | Task | Acceptance |
|---|---|---|
| TASK-34 | Playwright smokes: per-template happy path | All four pass in CI-equivalent local run |
| TASK-35 | Agent self-verification harness — the agent opens Agent X's own UI in a Playwright-driven browser and screenshots key flows | Screenshot suite checked into `tests/e2e/__screenshots__/` |
| TASK-36 | Performance pass: dynamic imports for heavier widgets, route segment caching, server-render hot paths | First paint <500ms warm; widget swap <100ms |
| TASK-37 | Accessibility pass: keyboard nav, focus traps, aria-live verification, contrast audit | Lighthouse a11y ≥95 on each template |

---

## 4. Open decisions tracked here

These are unresolved at draft time; promoting one to a task requires resolving its decision first.

- **Web search provider** — *Deferred (2026-04-28).* User chose to skip web tooling entirely for now. `TASK-26`/`TASK-27` are deprioritized; revisit when the agent needs a tool the embedded `BrowserPane` can't satisfy.
- **Customer-facing brand** — `Agent X` is the codename. The marketing brand for Shore-wide / portco usage is open. Proposal: defer to v1.5 when first external demo is scheduled.
- **Theme Manager: how far do we go?** Defaults to color tokens + radius + density + font. "Animation density" and "icon set choice" are explicit non-goals for v1 unless they block a user task.
- **Persistent agent memory** — minimal in v1 (the shell *is* the memory). A separate "long-term memory" store is a v1.5 task.
- **Risk-class confirm policy** — current proposal is "always confirm `write_remote` and `irreversible`." Consider an opt-out per tool per session (sticky for the active session) once we feel the friction.

---

## 5. Out of scope for v1 (and why)

- **Multi-user, RBAC, tenant isolation** — adds Clerk + a real tenant model + an admin surface. Doesn't help test the personalization loop. Lands in the post-v1 milestone alongside hosted deploy.
- **Org Policy / Role Defaults / DLP** — these only matter when a portco's CISO is in the room. Not relevant to a single developer testing whether the loop compounds.
- **MCP client + IaaS connectors (`unified.to` etc.)** — `browse.act` covers the same surface for v1 because the user already has access through their own browser.
- **Audit log table + Axiom mirror** — overkill for single-user local. Console + JSONL files are enough until a second user joins.
- **Hosted deploy** — local-first is the *whole point* of BYO-Identity. Hosted deploy is a deliberate next milestone, not a forgotten one.

---

## 6. Glossary

- **BYO-Identity** — the v1 architectural pattern where the agent has no enterprise credentials of its own and acts inside the user's already-authorized browser sessions.
- **Shell** — the user-visible work surface, expressed as a typed JSON document.
- **Widget** — a typed React component contributing one panel of the shell, registered by convention.
- **Mutation** — a JSON Patch produced by the agent that, if ratified, updates the shell and creates a revision.
- **Revision** — an immutable snapshot of the shell after a ratified change, time-travelable.
- **Frame** — a named shell with its own URL, theme, and history. A user can have many frames.
- **Tool** — a typed function the agent can call, with a `riskClass` and confirmation policy.
