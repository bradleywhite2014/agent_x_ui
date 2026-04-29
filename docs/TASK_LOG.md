# Task Log

> Append-only record of completed tasks. Each entry references a task ID from [`BUILD_PLAN.md`](BUILD_PLAN.md). Order is reverse-chronological (newest at the top).

## Template

```
## YYYY-MM-DD — TASK-NN: short title

- **Result.** One or two sentences describing what shipped.
- **Verification.** What was checked: typecheck, lint, build, agent browser-harness pass, screenshots, unit tests, etc.
- **Notes.** Any follow-ups, deferred work, or surprises worth recording.
- **Commit.** Short SHA or commit message.
```

## Entries

## 2026-04-29 — TASK-18..TASK-21: Theme Manager (P3)

- **Result.** Semantic theme tokens (`src/lib/theme/tokens.ts`) with five presets; merge resolution (`resolve.ts`) combines global state + optional `shell.theme` frame overrides for light/dark, density, and font. Global prefs persist under `theme.global` (`prefs.server.ts`) with `GET`/`PUT /api/theme/global`. `ThemeRuntime` injects global CSS for non-frame routes; `ShellView` wraps the frame in `buildThemeWrapperStyle` + `fontFamilyClass` using `useGlobalTheme` + `next-themes` resolved mode. Landing and frames list expose `GlobalThemeMenuButton`; frame chrome adds a palette control + `ThemeManagerSheet` with `scope="frame"` that commits overrides via `POST /api/frames/[id]/revisions`. `GlobalThemeProvider` remounts on server theme snapshot (`key`) after refresh instead of syncing via `useEffect`.
- **Verification.** `npm run typecheck`, `lint`, `test` (20/20), `build` — all clean.
- **Notes.** Per-frame overrides clear when the sheet saves an empty draft (payload `undefined`). Lint: avoided `setState` inside effects — draft sync runs when the sheet opens via `onOpenChange`; global theme hydration uses `key={JSON.stringify(initialGlobalTheme)}` on `GlobalThemeProvider`.

## 2026-04-28 — TASK-13..TASK-17: Agent loop (P2)

- **Result.** The agent loop is live end-to-end: a chat dock in `/frames/[id]` streams from `/api/chat`, the model receives the capability catalog + a structure-only summary of the current frame, and only ever writes to the surface by calling one of two typed proposers (`proposeShell`, `proposeWidgetAddition`). Every proposal is server-validated against the catalog and the Shell schema, returned as a `MutationProposal` envelope, rendered as a side-by-side ratify card in the dock, and only persisted as a new revision (`authoredBy = "agent"`, with the agent's reasoning) when the user clicks Ratify.
- **Architecture (clarified during this phase).** The agent's only inputs are (a) the catalog at `GET /api/capabilities` and (b) optional structure-only frame summary (instance ids, types, placement — never widget contents). The agent has no DB access, no `/api/frames/*` read access, no view of widget props. New capabilities only become available to the agent by being added to the registries the catalog endpoint reads. AGENTS.md and BUILD_PLAN P2 updated to record the doctrine.
- **What shipped.**
  - `GET /api/capabilities` — widget catalog with Zod-derived JSON Schemas + tool catalog (`proposeShell`, `proposeWidgetAddition`, both `category=proposer / risk=read`).
  - `src/widgets/registry.server.ts` — server-importable widget metadata, split out of the client-only `widget.tsx` modules so server routes can read schemas without dragging React components into the server bundle.
  - `src/lib/agent/{risk,tools,catalog,summarize,prompt,proposal}.ts` — the agent contract surface. Tool input schemas, structure-only summarizer, prompt composer, and the resolvers that turn agent-proposed candidates into validated `MutationProposal` envelopes.
  - `/api/chat` — now accepts `frameId`, builds the system prompt (catalog + boundary + frame summary), wires up the proposer tools via Vercel AI SDK `tool({ inputSchema, execute })`. Tool `execute` returns `{ ok, proposal | error }` — never writes — so the streamed tool result is the user's ratify candidate.
  - Chat dock UI — `src/components/chat/{ChatDock,ProposalCard,ShellOutline}.tsx`. Collapsible right pane in `/frames/[id]`, streams from `useChat({ transport: new DefaultChatTransport({ api, body: () => ({ frameId }) }) })`, renders text parts, pending tool calls, error proposals, and ratify cards. The card shows current ↔ proposed structure side-by-side (no widget contents rendered — pure topology) plus a +N/−N/~N diff badge.
  - On Ratify, the card POSTs the resolved Shell to the existing `POST /api/frames/[id]/revisions` with `authoredBy: "agent"` and the agent's reasoning. The revision sidebar already shows the "agent" badge and reasoning.
  - **Bonus.** Auto-disambiguation of frame names in `createFrameFromTemplate` (`Daily Operator` → `Daily Operator (2)`) so parallel template clicks (and the parallel Playwright workers) don't collide on the unique-index on `shells.name`.
- **Verification.**
  - `npm run typecheck` — clean.
  - `npm run lint` — clean.
  - `npm run test` — 20/20 passing (5 files: smoke, shell-schema, agent-summarize, agent-proposal x9, agent-catalog x3). Notable coverage: unknown-widget rejection, invalid-props rejection, layout `split-after` placement, summary excludes widget contents (regression-tested against the daily-operator seed text and URLs).
  - `npm run build` — clean. New route: `/api/capabilities`.
  - `npm run e2e` — 5/5 passing in 5.6s. New: `chat-dock.spec.ts` verifies the catalog endpoint shape, dock empty-state copy, and the open ↔ collapse round-trip without calling the LLM.
  - **Live agent loop verified against real Anthropic Opus 4.6.** Sent `"Add a markdown notes widget next to the preview-1 widget. Use a vertical split."` against a freshly-created Daily Operator frame: agent emitted `proposeWidgetAddition({ type: "markdown-notes", placement: { mode: "split-after", anchorInstanceId: "preview-1", direction: "vertical" }, … })`; the resolver placed the new instance correctly and returned a fully-typed proposal that round-tripped through the Shell schema.
  - **Boundary regression-tested live.** Asked the agent to read widget contents (`"What does my notes-1 widget say? Quote the content verbatim."`) — agent correctly refused, citing that widget contents aren't in its prompt. Asked it to propose a non-existent `calendar` widget — agent correctly refused, citing the catalog.
- **Notes.**
  - The agent's `proposeShell` candidate uses a deliberately loose Zod schema (`layout: z.unknown()`, props as `record<string, unknown>`) at the tool boundary, then the server-side resolver runs the full `shellSchema.safeParse` plus a per-widget `propsSchema.safeParse` on every instance. Tight enough to enforce the contract, loose enough to keep the JSON Schema the agent sees small and human-shaped.
  - Tool `execute` deliberately does **not** write. Returning the proposal as the tool result keeps the AI SDK stream flowing and lets the client be the only entity that can call `POST /api/frames/[id]/revisions`. That's the load-bearing piece of the safety story.
  - Splitting widget metadata into `meta.ts` (server-importable, no `"use client"`) and `widget.tsx` (component, `"use client"`) was forced by the build: importing a client module into a server route returns a client reference, not a value, and `[m.meta.slug, m]` would crash on `meta` being undefined. Now there are two registries — `@/widgets/registry.server` (metadata only, server) and `@/widgets` (full modules, client) — that share a single source of meta.
  - Action tools (`web.fetch`, `browser.*`, future portco APIs) intentionally remain pre-P4. The contract here was designed to absorb them: just add a new entry to the tool catalog with the appropriate `riskClass` and a server-side `execute` that the API layer wraps with confirmation when `requiresConfirm(rc)` is true.
- **Commit.** `bd3c713` — `feat(p2): catalog-driven agent loop — proposers, ratify UI, structure-only prompt`. Single commit covering TASK-13 through TASK-17, pushed to `origin/main`.

## 2026-04-28 — TASK-7..TASK-12: Shell-as-config runtime (P1)

- **Result.** Config-driven shell is live end-to-end. A user can pick a frame template from `/frames`, land in `/frames/<id>`, see widgets rendered from a typed JSON document, edit them, add/remove widgets in edit mode, and revert to any prior revision — every change goes through Zod-validated config + a new immutable revision row. Two starter widgets ship: `markdown-notes` (with explicit save → new revision) and `web-preview` (iframe with refusal fallback for sites that block embedding).
- **Verification.**
  - `npm run typecheck` — clean.
  - `npm run lint` — clean.
  - `npm run test` — 6/6 passing (1 smoke + 5 shell-schema unit tests covering round-trip, layout/widget reference checks, split-size validation, recursive ref collection).
  - `npm run build` — clean. New routes registered: `/frames`, `/frames/[id]`, `/api/frames`, `/api/frames/[id]`, `/api/frames/[id]/revisions`, `/api/frames/[id]/revert`.
  - `npm run e2e` — 4/4 passing in 5.5s. New flows: frame picker lists templates, Daily Operator round-trip (create → edit notes → save → see "saved" → revert → seed text restored), edit-mode add/remove widget on Scratchpad.
- **Notes.**
  - **Library version drift surprises:** `react-resizable-panels` v4 renamed `PanelGroup` → `Group`, `PanelResizeHandle` → `Separator`, `direction` → `orientation`, dropped the `order` prop. Layout primitive rewritten to v4 idioms.
  - **Base UI nuance:** Dropdown/Sheet triggers use `render={…}` (not `asChild`) under the `nova` preset. Already noted in `AGENTS.md`; reinforced by ShellView's tooltip + sheet triggers.
  - **`react-hooks` strict-mode lint** rejected setState-in-effect for the markdown-notes "reset draft on revert" pattern. Fixed with the [derived-state pattern](https://react.dev/reference/react/useState#storing-information-from-previous-renders) — setState during render guarded by an "previously seen prop" sentinel.
  - **Revert resync** required a similar pattern in `ShellView`: track `lastSeenServerRevision`; only resync local state when the server-rendered prop genuinely advanced (i.e. after `router.refresh()` post-revert). Without this guard, locally-applied saves were undone on every parent re-render.
  - **Stable layout key**: the panel layout is keyed on `frame.id`, not `frame.id:revisionId`, so saving widget props doesn't unmount and remount panels (which previously wiped widget UI state like the "saved" badge).
  - **JSON Patch math is deferred** to TASK-15 (P2). P1 stores full snapshots per revision; the schema already has a `patch` column ready for when the agent loop lands.
  - **Add/remove widget UX**: adding wraps the current root layout in a horizontal split when there's only a single widget; removing the second-to-last widget collapses the split back to a single-widget layout. Sizes auto-rebalance evenly to satisfy `split.sizes` summing to 100.
- **Commit.** `1085d3f` — `feat(p1): shell-as-config runtime — frames, widgets, edit mode, revisions`. Single commit covering TASK-7 through TASK-12, pushed to `origin/main`.

## 2026-04-28 — TASK-1..TASK-6: Foundation phase (P0)

- **Result.** Project foundation in place. Next.js 16.2.4 (App Router, TS strict, Tailwind v4) + shadcn `base-nova` preset (12 primitives) + ESLint + Prettier + Vitest + Playwright + Drizzle ORM/SQLite + Vercel AI SDK (Anthropic Opus 4.6) + `bin/task_done` helper. Dark-mode toggle wired via `next-themes`. Operator-grade landing page rendered.
- **Verification.**
  - `npm run typecheck` — clean.
  - `npm run lint` — clean.
  - `npm run test` — 1/1 passing (smoke).
  - `npm run build` — clean. Routes: `/`, `/api/chat`, `/api/health`.
  - `curl http://localhost:3002/api/health` — returns `{"status":"ok","model":{"id":"claude-opus-4-6","provider":"anthropic"},"env":{"anthropicKeyPresent":true}}`.
  - `curl -N -X POST http://localhost:3002/api/chat` with a UI-message envelope — streamed back a real Opus 4.6 reply via SSE in 2.9s end-to-end.
  - `npm run db:migrate` — created `~/.agent-x/agent_x.db` with all 5 tables (`shells`, `revisions`, `themes`, `prefs`, `browser_windows`).
- **Notes.**
  - shadcn `base-nova` preset uses `@base-ui/react` (not Radix), so triggers use `render={...}` instead of `asChild`. Documented in `AGENTS.md` so it doesn't trip future agents.
  - Dropped `Github` icon — not present in current `lucide-react`. Used `Code2` instead.
  - Downgraded `@vitejs/plugin-react` to v4 to resolve a Vitest 3 / rolldown type clash.
  - `next.config.ts` sets `turbopack.root` so Next does not pick up the parent-directory `package-lock.json` from `~/`.
  - The dev server fell back to port 3002 because port 3000 was in use; documented in RUNBOOK.
  - Web search tooling (TASK-26 / TASK-27) is **deferred** per user instruction (2026-04-28). Phase 4 still ships the `BrowserPane` widget, which covers most of the same use cases through embedded iframe browsing.
- **Commit.** `fd2d6a9` — `feat(p0): foundation phase — Next.js + shadcn + Drizzle + AI SDK`. Single commit covering TASK-1 through TASK-6, pushed to `origin/main`.
