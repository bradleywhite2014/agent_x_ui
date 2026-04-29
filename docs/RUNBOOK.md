# Runbook

> Local environment, dependencies, and troubleshooting. Updated in the same change set as anything that breaks setup.

## Prerequisites

- **Node.js 22+** (developer machine: 23.11.0 verified). Use `nvm` or equivalent.
- **npm 10+**.
- **Git**.
- A modern Chromium installed by Playwright (`npm run e2e:install`) for E2E and the `BrowserPane` widget — only needed once `BrowserPane` lands in Phase 4.
- macOS, Linux, or Windows. macOS is the primary development platform.

## First-time setup

```bash
git clone git@github.com:bradleywhite2014/agent_x_ui.git
cd agent_x_ui

cp .env.example .env.local
# fill in at minimum:
#   ANTHROPIC_API_KEY=...

npm install
npm run db:migrate           # creates ~/.agent-x/agent_x.db
npm run dev                  # http://localhost:3000
```

## Smoke tests for a fresh install

```bash
# server-side health
curl http://localhost:3000/api/health
# → { "status": "ok", "model": { "id": "claude-opus-4-6", "provider": "anthropic" }, ... }

# end-to-end model streaming
curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"id":"u1","role":"user","parts":[{"type":"text","text":"In one sentence, what are you?"}]}]}'
# → SSE stream of text-delta events ending in [DONE]
```

## Environment variables

See `.env.example` for the canonical list. Each variable carries a one-line comment with what it does.

- `ANTHROPIC_API_KEY` — required for the default Claude Opus 4.6 model.
- `AGENT_X_HOME` — directory for SQLite DB, Chromium profile, logs. Defaults to `~/.agent-x`.
- `AGENT_X_PORT` — defaults to `3000`. The dev server falls back to the next available port if 3000 is in use.
- `DEFAULT_MODEL` — override the default model id. Must be supported by the configured provider.

## Day-to-day commands

```bash
npm run dev               # Next.js dev server (Turbopack)
npm run typecheck         # tsc --noEmit
npm run lint              # ESLint (next + ts presets)
npm run format            # Prettier write
npm run format:check      # Prettier check (CI)
npm run test              # Vitest unit tests
npm run test:watch        # Vitest in watch mode
npm run e2e               # Playwright smokes (auto-starts dev server)
npm run e2e:install       # Install Chromium + system deps for Playwright
npm run build             # Production build
npm run db:generate       # Generate Drizzle migration from schema changes
npm run db:migrate        # Apply Drizzle migrations to ~/.agent-x/agent_x.db
npm run db:reset          # Drop the local DB (destructive)
npm run db:studio         # Open drizzle-kit studio
```

## Where things live on disk

```
~/.agent-x/
├── agent_x.db              # SQLite — shells, revisions, themes, prefs, browser_windows
├── profile/                # persistent Chromium profile (treat like a real browser profile) — populated when Phase 4 lands
├── logs/
│   ├── agent.jsonl
│   └── tools.jsonl
└── config.yaml             # web.fetch allowlist, tool configuration, model overrides — populated when Phase 4 lands
```

Both `~/.agent-x/profile/` and any local `.env*` are gitignored. They contain operator credentials and must never be committed.

## Closing out a task

```bash
bin/task_done TASK-12 "concise result"
# runs typecheck + lint + tests, commits with a conventional message
# referencing the task id, and pushes to origin/main.
```

The script refuses to commit if verification fails. Add a TASK_LOG entry before running it.

## Troubleshooting

- **Dev server picked port 3002 instead of 3000.** Another process is on 3000 (often Cursor or a leftover Next process). Free it (`lsof -ti:3000 | xargs kill`) or set `AGENT_X_PORT=3001`.
- **`/api/chat` returns 500 with "ANTHROPIC_API_KEY is not set".** Add the key to `.env.local` (not `.env`). Restart `npm run dev` — Next's dotenv only reads on boot.
- **Browser-harness fails to start.** Run `npm run e2e:install`. On macOS Gatekeeper may need to allow the binary in System Settings.
- **SQLite errors after pulling new schema.** Run `npm run db:migrate`. If the migration fails, `npm run db:reset` will drop the local DB; you will lose local shells and revisions.
- **Tailwind classes don't apply to a new shadcn primitive.** Confirm `tailwindcss` and `@tailwindcss/postcss` versions match in `package.json`, and that `src/components/ui/<x>.tsx` is included by the Tailwind v4 content discovery (it is by default for files under `src/`).
