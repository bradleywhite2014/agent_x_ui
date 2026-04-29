"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { IntegrationCapability } from "@/lib/integrations/mock-catalog";
import { MOCK_INTEGRATION_CAPABILITIES } from "@/lib/integrations/mock-catalog";
import { cn } from "@/lib/utils";

export function IntegrationCatalogSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const [domainFilter, setDomainFilter] = useState<string | null>(null);

  const domains = useMemo(
    () =>
      [...new Set(MOCK_INTEGRATION_CAPABILITIES.map((c) => c.domain))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [],
  );

  const visible = useMemo(() => {
    const filtered = domainFilter
      ? MOCK_INTEGRATION_CAPABILITIES.filter((c) => c.domain === domainFilter)
      : MOCK_INTEGRATION_CAPABILITIES;
    return [...filtered].sort((a, b) =>
      `${a.domain}:${a.label}`.localeCompare(`${b.domain}:${b.label}`),
    );
  }, [domainFilter]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Integration catalog</SheetTitle>
          <SheetDescription>
            Mocked middleware surfaces available to the shell and future agent
            tools. Flip these from mock to live when adapters are authenticated.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-wrap gap-1.5 px-4">
          <button
            type="button"
            onClick={() => setDomainFilter(null)}
            className={filterClass(domainFilter === null)}
          >
            All
          </button>
          {domains.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDomainFilter((cur) => (cur === d ? null : d))}
              className={filterClass(domainFilter === d)}
            >
              {d}
            </button>
          ))}
        </div>

        <ScrollArea className="min-h-0 flex-1 px-4 pb-4">
          <div className="grid gap-2">
            {visible.map((cap) => (
              <CatalogRow key={cap.id} cap={cap} />
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function CatalogRow({ cap }: { cap: IntegrationCapability }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-card-foreground">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm">{cap.label}</span>
            <Badge variant="outline" className="font-mono text-[0.65rem]">
              {cap.domain}
            </Badge>
          </div>
          <div className="text-muted-foreground mt-1 font-mono text-[0.7rem]">
            {cap.apiRef}
          </div>
        </div>
        {statusBadge(cap.status)}
      </div>
      <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
        {cap.description}
      </p>
    </div>
  );
}

function statusBadge(status: IntegrationCapability["status"]) {
  const variant =
    status === "live" ? "default" : status === "mock" ? "secondary" : "outline";
  return (
    <Badge variant={variant} className="font-mono text-[0.65rem]">
      {status}
    </Badge>
  );
}

function filterClass(active: boolean) {
  return cn(
    "rounded-md border px-2 py-1 font-mono text-[0.65rem] transition-colors",
    active
      ? "border-transparent bg-primary text-primary-foreground"
      : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}
