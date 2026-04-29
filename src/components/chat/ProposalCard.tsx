"use client";

import { useState } from "react";
import { Check, X, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShellOutline, diffWidgets } from "./ShellOutline";
import type { Shell } from "@/lib/shell/schema";
import { cn } from "@/lib/utils";

export interface ProposalEnvelope {
  proposalId: string;
  kind: "fullShell" | "widgetAddition";
  shell: Shell;
  reasoning: string;
  createdAt: number;
}

export interface ProposalErrorEnvelope {
  code: string;
  message: string;
  path?: ReadonlyArray<string | number>;
}

export interface ProposalCardProps {
  /** The proposal returned by the agent's proposer tool. */
  proposal: ProposalEnvelope;
  /** The shell the user currently sees. Used for the side-by-side preview. */
  currentShell: Shell;
  /** id of the parent revision the proposal would be applied on top of. */
  parentRevisionId: string;
  frameId: string;
  /** Called after a successful ratify so the surrounding shell view can resync. */
  onRatified?: (newShell: Shell) => void;
}

export function ProposalCard({
  proposal,
  currentShell,
  parentRevisionId,
  frameId,
  onRatified,
}: ProposalCardProps) {
  const [status, setStatus] = useState<
    "pending" | "ratifying" | "ratified" | "discarded" | "error"
  >("pending");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const diff = diffWidgets(currentShell, proposal.shell);

  async function ratify() {
    setStatus("ratifying");
    try {
      const res = await fetch(`/api/frames/${frameId}/revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: proposal.shell,
          parentRevisionId,
          reasoning: proposal.reasoning,
          authoredBy: "agent",
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      setStatus("ratified");
      toast.success("Ratified — frame updated");
      onRatified?.(proposal.shell);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to ratify";
      setErrorMsg(msg);
      setStatus("error");
      toast.error(msg);
    }
  }

  function discard() {
    setStatus("discarded");
  }

  return (
    <div
      className={cn(
        "border-border bg-card rounded-md border p-3",
        status === "ratified" && "border-primary/40",
        status === "discarded" && "opacity-60",
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <Badge variant="outline" className="font-mono text-[10px] uppercase">
          {proposal.kind === "fullShell" ? "Full frame" : "Add widget"}
        </Badge>
        <span className="text-muted-foreground text-[10px]">
          proposal · {proposal.proposalId.slice(0, 6)}
        </span>
        <StatusBadge status={status} />
      </div>

      <p className="text-foreground/90 mb-3 text-sm">{proposal.reasoning}</p>

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <div className="text-muted-foreground mb-1 font-mono text-[9px] tracking-[0.16em] uppercase">
            Current
          </div>
          <ShellOutline shell={currentShell} />
        </div>
        <div>
          <div className="text-muted-foreground mb-1 font-mono text-[9px] tracking-[0.16em] uppercase">
            Proposed
          </div>
          <ShellOutline shell={proposal.shell} highlight={diff.added} />
        </div>
      </div>

      {(diff.added.size > 0 || diff.removed.size > 0 || diff.changed.size > 0) ? (
        <div className="text-muted-foreground mt-2 flex flex-wrap gap-1.5 text-[11px]">
          {diff.added.size > 0 ? (
            <Badge variant="secondary" className="font-mono">
              +{diff.added.size} added
            </Badge>
          ) : null}
          {diff.removed.size > 0 ? (
            <Badge variant="secondary" className="font-mono">
              −{diff.removed.size} removed
            </Badge>
          ) : null}
          {diff.changed.size > 0 ? (
            <Badge variant="secondary" className="font-mono">
              ~{diff.changed.size} retyped
            </Badge>
          ) : null}
        </div>
      ) : null}

      {status === "error" && errorMsg ? (
        <div className="text-destructive mt-2 flex items-start gap-1.5 text-xs">
          <AlertTriangle className="mt-0.5 size-3.5" />
          <span>{errorMsg}</span>
        </div>
      ) : null}

      {status === "pending" || status === "error" ? (
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" onClick={ratify}>
            <Check data-icon="inline-start" />
            Ratify
          </Button>
          <Button size="sm" variant="ghost" onClick={discard}>
            <X data-icon="inline-start" />
            Discard
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function ProposalErrorCard({
  error,
}: {
  error: ProposalErrorEnvelope;
}) {
  return (
    <div className="border-destructive/40 bg-destructive/5 rounded-md border p-3 text-xs">
      <div className="text-destructive flex items-center gap-1.5 font-medium">
        <AlertTriangle className="size-3.5" />
        Proposal rejected ({error.code})
      </div>
      <p className="text-foreground/80 mt-1">{error.message}</p>
      {error.path ? (
        <code className="text-muted-foreground mt-1 block font-mono text-[10px]">
          path: {error.path.join(".")}
        </code>
      ) : null}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "pending" | "ratifying" | "ratified" | "discarded" | "error";
}) {
  if (status === "pending") {
    return (
      <Badge variant="outline" className="ml-auto font-mono text-[10px]">
        Pending review
      </Badge>
    );
  }
  if (status === "ratifying") {
    return (
      <Badge variant="outline" className="ml-auto inline-flex items-center gap-1 font-mono text-[10px]">
        <Loader2 className="size-3 animate-spin" />
        Ratifying
      </Badge>
    );
  }
  if (status === "ratified") {
    return (
      <Badge variant="default" className="ml-auto font-mono text-[10px]">
        Ratified
      </Badge>
    );
  }
  if (status === "discarded") {
    return (
      <Badge variant="secondary" className="ml-auto font-mono text-[10px]">
        Discarded
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="ml-auto font-mono text-[10px]">
      Error
    </Badge>
  );
}
