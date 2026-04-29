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
- **Commit.** *Pending — single P1 commit covering TASK-7 through TASK-12.*

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
