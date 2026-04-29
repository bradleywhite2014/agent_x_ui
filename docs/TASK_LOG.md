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
- **Commit.** Pending — single foundation commit covering all six P0 task IDs.
