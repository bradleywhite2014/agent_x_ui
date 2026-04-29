import { randomUUID } from "node:crypto";

/**
 * Resolve a request id, honoring an upstream `x-request-id` header if present.
 * Used by every JSON and SSE response per `docs/API_CONTRACTS.md`.
 */
export function resolveRequestId(headers: Headers): string {
  const upstream = headers.get("x-request-id");
  if (upstream && upstream.trim().length > 0) {
    return upstream.trim();
  }
  return randomUUID();
}
