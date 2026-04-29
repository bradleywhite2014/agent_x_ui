# Security Posture

> Truthful, current, and architecture-bound. If the architecture changes, this doc changes in the same change set. Aspirational claims are not allowed here.

## v1 model: BYO-Identity, local-first

Agent X v1 runs entirely on the operator's machine. The agent acts inside the operator's already-authorized browser sessions. The operator is the credential boundary; existing systems-of-record audit and authorize the operator exactly as they always did.

### What the architecture provides

- **No enterprise credential brokerage.** Agent X never holds, transmits, or persists credentials for downstream systems (CRM, ERP, ATS, cloud consoles, etc.). The credential is the operator's logged-in browser session, which lives only on their machine.
- **Inherited authorization.** Every action against an enterprise system is performed as the operator. Existing SSO, MFA, conditional access, role-based access control, and DLP apply unchanged.
- **Inherited audit.** Every action is logged by the underlying system as the operator's action. Agent X does not need to reproduce that audit trail; it sits underneath it.
- **Per-machine data residency.** The SQLite database, the Chromium profile, cached tool responses, and JSONL logs all live in `~/.agent-x/`. Nothing leaves the machine except calls to the configured LLM provider and explicitly authorized tool calls.

### What the architecture does **not** provide

- **No SOC 2, no HIPAA, no GDPR DPA in v1.** v1 is a personal sandbox. We do not represent regulatory compliance until the platform milestone.
- **No org-level governance.** There is no Org Policy layer, no Role Defaults, no central DLP, no central audit log. Those are deliberate post-v1 work items.
- **No cross-user isolation guarantees.** v1 is single-user. Running it as a shared service on a multi-user box is unsupported and undocumented.
- **No protection against operator misuse.** If the operator has destructive permissions in a downstream system, so does the agent acting as them. We mitigate with risk-class confirmation, not with privilege downgrade.
- **No coverage of iframe-refusing sites in v1.** Many enterprise SaaS systems (Salesforce, ServiceNow, Workday, Gmail, banking, anything CSP-locked) refuse to render in an iframe via `X-Frame-Options: DENY` or `frame-ancestors` headers. Agent X v1 surfaces the refusal honestly and offers a one-click "open in new tab" handoff; the agent halts the affected workflow. Real coverage of these systems requires the v1.5 Electron host that swaps the iframe for an Electron `<webview>`. Until that ships, do not represent that v1 can drive auth-walled enterprise SaaS.

## Data flows

Three places data flows out of the operator's machine in v1:

1. **LLM provider** (default Anthropic, Claude Opus 4.6).
   - Sent: chat messages, the current shell config, and tool call results that are part of the conversation context.
   - Not sent: enterprise credentials, raw cookies, raw OAuth tokens, raw screenshots unless a tool result deliberately includes one.
   - Operator can swap providers via `.env.local`. A future Sovereign tier will support local models with no third-party LLM calls.
2. **Authorized tool calls.** The agent invokes typed tools. Each tool's destination is fixed and visible:
   - `web.fetch` → Agent X's local middleware backend, which performs a public HTTP(S) GET, blocks local/private network targets, clips returned text, and honors `AGENT_X_WEB_ALLOWLIST` (default `*` in local sandbox; set explicit hosts for stricter operation).
   - `web.search` → the configured search provider (not yet wired).
   - `web.rss`, `calendar.ics` → planned tools; only hosts on the operator's allowlist.
   - `browser.*` → whatever URL the operator (or the agent under operator ratification) opened in a `BrowserPane` widget. v1 uses iframes, so calls cross the iframe `postMessage` bridge and inherit the embedding browser's cookie scope; v1.5 will use Electron `<webview>` partitions for full session inheritance.
3. **Operator-initiated network calls** from inside the rendered shell (e.g., a `web-preview` widget loading a URL the operator typed). These are the operator's normal browser activity, performed inside Agent X's browser tab; no Agent X server is in the path.

Kernel / Agent Browser is the intended browser-middleware provider for JS-heavy or sessioned sites. It requires `KERNEL_API_KEY` and will be wired as a `browser.*` provider, not as an ungoverned fetch bypass.

The agent **cannot** silently exfiltrate data — every outbound call from the Next.js process either is to the chosen LLM provider or is an explicit tool call that is logged with `tool_name`, status, latency, and host metadata. Logs never include raw cookies, OAuth tokens, or authorization headers.

## Risk-class model

Every tool exported to the agent declares a `riskClass`:

| Class | Meaning | Confirmation policy |
|---|---|---|
| `read` | Reads only. Cannot mutate state anywhere. | Auto-execute. Logged. |
| `write_local` | Writes only to local Agent X state (shell config, revisions, theme). | Auto-execute. Logged. Revertible via revision history. |
| `write_remote` | Writes to a system the operator has access to via their own session. | **Always confirm in UI before execution.** Confirmation modal shows the exact call. |
| `irreversible` | Cannot be undone (e.g., sending an email, executing a payment). | **Always confirm in UI before execution.** Modal includes an explicit "I understand this cannot be undone" affordance. |

The agent does not have a way to bypass these policies. The confirmation flow is implemented in the React surface and the corresponding server action gates execution on a verified user click.

## Secret handling

- `.env.local` and any other `.env*` file are gitignored; CI does not have permission to commit them.
- Logs redact: cookie values, OAuth tokens, API keys, `Authorization` headers. Hashed identifiers (e.g., `sha256(token).slice(0, 8)`) are allowed where useful.
- The Chromium profile directory is gitignored. Operators should treat it like their normal browser profile (it is).

## What we will document when scope expands

When v1.5 introduces hosted multi-user, this file gains:

- The Clerk auth model and federation surface.
- The audit_log Postgres table contract.
- Tenant isolation guarantees.
- Vendor inventory (auth, DB, observability, model providers).
- Retention and deletion paths per data class.
- Incident-response commitments.

Until then, this file stays scoped to v1 and stays honest about it.
