import { isIP } from "node:net";

import { z } from "zod";

export const webFetchInputSchema = z.object({
  url: z
    .string()
    .url()
    .describe("Absolute http(s) URL to fetch through the governed middleware."),
  maxChars: z
    .number()
    .int()
    .min(500)
    .max(20_000)
    .optional()
    .describe("Maximum text characters returned to the model. Defaults to 8000."),
});

export type WebFetchInput = z.infer<typeof webFetchInputSchema>;

export interface WebFetchResult {
  ok: true;
  url: string;
  finalUrl: string;
  status: number;
  contentType: string | null;
  title: string | null;
  text: string;
  truncated: boolean;
  policy: {
    allowlist: string[];
    matched: string;
  };
}

export interface WebFetchError {
  ok: false;
  code:
    | "invalid_url"
    | "blocked_host"
    | "private_network"
    | "fetch_failed"
    | "unsupported_protocol";
  message: string;
  url?: string;
}

const DEFAULT_MAX_CHARS = 8_000;
const USER_AGENT =
  "AgentX/0.1 (+local-governed-agentic-surface; contact=operator)";

export async function fetchWebResource(
  input: WebFetchInput,
): Promise<WebFetchResult | WebFetchError> {
  let url: URL;
  try {
    url = new URL(input.url);
  } catch {
    return {
      ok: false,
      code: "invalid_url",
      message: "URL must be absolute and parseable.",
      url: input.url,
    };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return {
      ok: false,
      code: "unsupported_protocol",
      message: "Only http(s) URLs are supported.",
      url: input.url,
    };
  }

  const privateCheck = isPrivateOrLocalHost(url.hostname);
  if (privateCheck.blocked) {
    return {
      ok: false,
      code: "private_network",
      message: privateCheck.reason,
      url: input.url,
    };
  }

  const allow = resolveWebAllowlist();
  const matched = matchAllowlist(url.hostname, allow);
  if (!matched) {
    return {
      ok: false,
      code: "blocked_host",
      message: `Host "${url.hostname}" is not in AGENT_X_WEB_ALLOWLIST.`,
      url: input.url,
    };
  }

  const startedAt = Date.now();
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        accept:
          "text/html,application/xhtml+xml,text/plain,application/json;q=0.9,*/*;q=0.8",
        "user-agent": USER_AGENT,
      },
      signal: AbortSignal.timeout(12_000),
    });
    const contentType = res.headers.get("content-type");
    const raw = await res.text();
    const normalized = normalizeText(raw, contentType);
    const maxChars = input.maxChars ?? DEFAULT_MAX_CHARS;
    const truncated = normalized.length > maxChars;
    const text = truncated ? normalized.slice(0, maxChars) : normalized;
    const finalUrl = res.url || url.toString();

    console.log(
      JSON.stringify({
        tool_name: "web.fetch",
        route: "middleware",
        status: res.status,
        latency_ms: Date.now() - startedAt,
        host: url.hostname,
        final_host: safeHost(finalUrl),
        truncated,
      }),
    );

    return {
      ok: true,
      url: url.toString(),
      finalUrl,
      status: res.status,
      contentType,
      title: extractTitle(raw, contentType),
      text,
      truncated,
      policy: { allowlist: allow, matched },
    };
  } catch (err) {
    return {
      ok: false,
      code: "fetch_failed",
      message: err instanceof Error ? err.message : "Fetch failed.",
      url: input.url,
    };
  }
}

export function resolveWebAllowlist(): string[] {
  const raw = process.env.AGENT_X_WEB_ALLOWLIST?.trim();
  if (!raw) return ["*"];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function matchAllowlist(hostname: string, allowlist: string[]): string | null {
  const host = hostname.toLowerCase();
  for (const pattern of allowlist) {
    if (pattern === "*") return pattern;
    if (pattern.startsWith("*.")) {
      const suffix = pattern.slice(1);
      if (host.endsWith(suffix)) return pattern;
    }
    if (host === pattern) return pattern;
  }
  return null;
}

function isPrivateOrLocalHost(hostname: string): {
  blocked: boolean;
  reason: string;
} {
  const host = hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local")
  ) {
    return {
      blocked: true,
      reason: "Local/private hosts are blocked for web.fetch.",
    };
  }

  const ipKind = isIP(host);
  if (ipKind === 0) return { blocked: false, reason: "" };

  if (host === "127.0.0.1" || host === "::1") {
    return { blocked: true, reason: "Loopback addresses are blocked." };
  }
  if (ipKind === 4) {
    const [a = 0, b = 0] = host.split(".").map(Number);
    if (
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254)
    ) {
      return {
        blocked: true,
        reason: "Private IPv4 ranges are blocked.",
      };
    }
  }
  if (ipKind === 6 && (host.startsWith("fc") || host.startsWith("fd"))) {
    return { blocked: true, reason: "Private IPv6 ranges are blocked." };
  }

  return { blocked: false, reason: "" };
}

function normalizeText(raw: string, contentType: string | null): string {
  if (contentType?.includes("application/json")) {
    return raw.replace(/\s+/g, " ").trim();
  }

  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(raw: string, contentType: string | null): string | null {
  if (!contentType?.includes("html")) return null;
  const match = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1]?.replace(/\s+/g, " ").trim() || null;
}

function safeHost(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return null;
  }
}
