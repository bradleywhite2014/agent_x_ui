import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { resolveRequestId } from "./request-id";

/**
 * Common error envelope for every internal JSON API per docs/API_CONTRACTS.md.
 *
 * The shape is `{ error, issues, request_id }`. `issues` is always an array,
 * even when empty, so clients can pattern-match without a null check.
 */
export interface ErrorEnvelope {
  error: string;
  issues: unknown[];
  request_id: string;
}

export function jsonError(
  message: string,
  options: {
    status?: number;
    issues?: unknown[];
    requestId?: string;
    headers?: HeadersInit;
  } = {},
): NextResponse {
  const requestId = options.requestId ?? "unknown";
  const body: ErrorEnvelope = {
    error: message,
    issues: options.issues ?? [],
    request_id: requestId,
  };
  return NextResponse.json(body, {
    status: options.status ?? 500,
    headers: { "x-request-id": requestId, ...options.headers },
  });
}

export function zodIssues(error: ZodError): unknown[] {
  return error.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
    code: i.code,
  }));
}

export function badRequest(
  req: Request,
  message: string,
  issues: unknown[] = [],
): NextResponse {
  return jsonError(message, {
    status: 400,
    issues,
    requestId: resolveRequestId(req.headers),
  });
}

export function notFound(req: Request, message: string): NextResponse {
  return jsonError(message, {
    status: 404,
    requestId: resolveRequestId(req.headers),
  });
}

export function serverError(req: Request, err: unknown): NextResponse {
  const message =
    err instanceof Error ? err.message : "internal_server_error";
  return jsonError(message, {
    status: 500,
    requestId: resolveRequestId(req.headers),
  });
}

export function jsonOk<T>(
  req: Request,
  body: T,
  init: { status?: number; headers?: HeadersInit } = {},
): NextResponse {
  const requestId = resolveRequestId(req.headers);
  return NextResponse.json(body, {
    status: init.status ?? 200,
    headers: { "x-request-id": requestId, ...init.headers },
  });
}
