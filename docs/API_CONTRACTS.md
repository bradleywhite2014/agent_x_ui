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
| `/api/health` | GET | P0 | Planned (TASK-1) |
| `/api/chat` | POST | P0 | Planned (TASK-5) |
| `/api/shell/[id]` | GET, PATCH | P1 | Planned (TASK-7+) |
| `/api/shell/[id]/revisions` | GET, POST | P1 | Planned (TASK-12) |
| `/api/shell/[id]/revisions/[rev]/revert` | POST | P1 | Planned (TASK-12) |
| `/api/theme` | GET, PUT | P3 | Planned (TASK-19) |
| `/api/tools/web/search` | POST | P5 | Planned (TASK-24) |
| `/api/tools/web/fetch` | POST | P5 | Planned (TASK-25) |
| `/api/tools/browse` | POST | P4 | Planned (TASK-22) |

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
