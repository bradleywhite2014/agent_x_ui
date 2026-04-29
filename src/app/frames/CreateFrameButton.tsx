"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CreateFrameButton({
  template,
  label,
}: {
  template: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/frames", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ template, name: label }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(body?.error ?? `HTTP ${res.status}`);
        }
        const body = (await res.json()) as { frame: { id: string } };
        toast.success(`Created "${label}"`);
        router.push(`/frames/${body.frame.id}`);
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to create frame",
        );
      }
    });
  };

  return (
    <Button
      size="sm"
      onClick={onClick}
      disabled={pending}
      className="self-start"
    >
      {pending ? (
        <Loader2 data-icon="inline-start" className="animate-spin" />
      ) : null}
      Start a {label}
      {!pending ? <ArrowRight data-icon="inline-end" /> : null}
    </Button>
  );
}
