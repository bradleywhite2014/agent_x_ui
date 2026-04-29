/**
 * Risk classification for every action exposed to the agent.
 *
 * - `read` — observation only; safe to auto-execute.
 * - `write_local` — mutates the user's local shell or db, but is fully revertible
 *   through the revision history. Auto-execute is allowed.
 * - `write_remote` — calls into a third-party system the user is authorized for.
 *   Always confirm in the UI before execution. Logged.
 * - `irreversible` — destructive or non-undoable action (e.g. sending an email).
 *   Always confirm in the UI before execution. Logged.
 *
 * Proposers (`proposeShell`, `proposeWidgetAddition`) intentionally use `read`
 * because they do not write themselves — they queue a candidate for the user
 * to ratify in a separate explicit step.
 */
export type RiskClass =
  | "read"
  | "write_local"
  | "write_remote"
  | "irreversible";

export const RISK_CLASS_VALUES: ReadonlyArray<RiskClass> = [
  "read",
  "write_local",
  "write_remote",
  "irreversible",
];

export function requiresConfirm(rc: RiskClass): boolean {
  return rc === "write_remote" || rc === "irreversible";
}
