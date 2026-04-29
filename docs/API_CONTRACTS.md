# API Contracts

> Every internal API route Agent X exposes lives here. Update in the same change set as the route handler. If a route's request, response, or error shape changes, update this doc. If a route does not appear here, it does not exist.

## Conventions

- **Base path:** `/api/`
- **Common error envelope:** `{ "error": "human readable", "issues": [], "request_id": "..." }`
- **Headers:** every JSON and SSE response carries `x-request-id`. Server honors an upstream `x-request-id` if present.
- **Status codes:** `400` invalid request, `401` not authenticated (post-v1), `403` not authorized / off-allowlist, `404` not found, `409` conflict (e.g., revision rebase failure), `410` gone, `429` rate-limited, `500` server error.
- **Streaming:** chat and other agent endpoints stream Server-Sent Events. Each event is an authoritative state snapshot, not a delta. Clients replace local state on each event. Polling is the fallback. Heartbeats use `event: ping`.

## Routes

> The table below is a placeholder. Routes land here as they are implemented. Each route gets a full request/response/error sub-section as part of the task that ships it.

| Path | Method | Phase | Status |
|---|---|---|---|
| `/api/health` | GET | P0 | Live (TASK-1) |
| `/api/chat` | POST | P0/P2 | Live (TASK-5, P2 added `frameId` body field, system prompt builder, and proposer tools) |
| `/api/capabilities` | GET | P2 | Live (TASK-13) |
| `/api/frames` | GET, POST | P1 | Live (TASK-10) |
| `/api/frames/[id]` | GET | P1 | Live (TASK-10) |
| `/api/frames/[id]/revisions` | GET, POST | P1 | Live (TASK-11). On agent ratify the client POSTs here with `authoredBy = "agent"`. |
| `/api/frames/[id]/revert` | POST | P1 | Live (TASK-12) |
| `/api/theme` | GET, PUT | P3 | Planned (TASK-19) |
| `/api/tools/web/search` | POST | P5 | Deferred (per user, 2026-04-28) |
| `/api/tools/web/fetch` | POST | P5 | Deferred (per user, 2026-04-28) |
| `/api/tools/browse` | POST | P4 | Planned (TASK-22) |

### `GET /api/capabilities`

**Purpose.** The single endpoint the in-browser agent reads to learn what it may propose. The agent has no other ambient access to user state.

**Response (200).**

```json
{
  "version": "agent-x/capabilities/v1",
  "widgets": [
    {
      "slug": "markdown-notes",
      "name": "Notes",
      "description": "A plain-text notes panel. Use Cmd/Ctrl+S to save.",
      "icon": "notebook-pen",
      "propsSchema": { "$schema": "...", "type": "object", "properties": { ... } },
      "defaultProps": { "title": "Notes", "content": "", "placeholder": "Write something…" }
    }
  ],
  "tools": [
    {
      "name": "proposeShell",
      "category": "proposer",
      "riskClass": "read",
      "description": "Propose a complete new shell …",
      "inputSchema": { "$schema": "...", "type": "object", "properties": { ... } }
    }
  ]
}
```

**Errors.** None expected. The endpoint is local, deterministic, and reads only in-memory registries.

**Telemetry.** `route`, `request_id`. No payload logged (the response is the registry itself, deterministic by build).

**Idempotency.** Yes. Safe to retry, no side effects.

## Template for new routes

When a route ships, add a section like:

> ### `POST /api/example`
>
> **Purpose.** One sentence describing what this route does and who calls it.
>
> **Request.** JSON body shape, required fields, optional fields, headers, etc.
>
> **Response (200).** JSON body shape with example.
>
> **Errors.**
> - `400` — invalid input, with `issues[]` from Zod.
> - `403` — off-allowlist destination.
> - `429` — rate-limited; includes `Retry-After`.
> - `500` — server error; includes `request_id`.
>
> **Idempotency.** Whether retries are safe.
>
> **Telemetry.** Logged fields (`route`, `latency_ms`, etc.).
>
> **Fallback.** Polling endpoint if this is SSE; cached read if external dependency is down.
