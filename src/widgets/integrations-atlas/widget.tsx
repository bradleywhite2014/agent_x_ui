"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { IntegrationCapability } from "@/lib/integrations/mock-catalog";
import { MOCK_INTEGRATION_CAPABILITIES } from "@/lib/integrations/mock-catalog";
import { cn } from "@/lib/utils";
import type { WidgetComponentProps, WidgetModule } from "../types";
import { meta, propsSchema, defaultProps, type Props } from "./meta";

function statusBadge(status: IntegrationCapability["status"]) {
  switch (status) {
    case "live":
      return (
        <Badge variant="default" className="font-mono text-[0.65rem]">
          live
        </Badge>
      );
    case "mock":
      return (
        <Badge variant="secondary" className="font-mono text-[0.65rem]">
          mock
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="font-mono text-[0.65rem]">
          planned
        </Badge>
      );
  }
}

function IntegrationsAtlas({ props }: WidgetComponentProps<Props>) {
  const title = props.title ?? "Middleware & integrations";
  const [domainFilter, setDomainFilter] = useState<string | null>(null);

  const domainId = (domain: string) =>
    `domain-${domain.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const grouped = useMemo(() => {
    const map = new Map<string, IntegrationCapability[]>();
    for (const c of MOCK_INTEGRATION_CAPABILITIES) {
      if (domainFilter && c.domain !== domainFilter) continue;
      const list = map.get(c.domain) ?? [];
      list.push(c);
      map.set(c.domain, list);
    }
    const domains = [...map.keys()].sort((a, b) => a.localeCompare(b));
    return domains.map((d) => ({
      domain: d,
      items: (map.get(d) ?? []).sort((a, b) => a.label.localeCompare(b.label)),
    }));
  }, [domainFilter]);

  const domains = useMemo(
    () =>
      [...new Set(MOCK_INTEGRATION_CAPABILITIES.map((c) => c.domain))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [],
  );

  return (
    <div className="bg-background flex h-full min-h-0 flex-col">
      <div className="border-b px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          <span className="text-muted-foreground font-mono text-[0.65rem]">
            Same payload as GET /api/integrations/catalog
          </span>
        </div>
        <p className="text-muted-foreground mt-1 max-w-3xl text-xs leading-relaxed">
          Compose panels against these surfaces — today everything is mocked so
          you can exercise layout + agent proposals without vendor keys. Wire a
          middleware row to flip mock → live per adapter.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setDomainFilter(null)}
            className={cn(
              "rounded-md border px-2 py-0.5 font-mono text-[0.65rem] transition-colors",
              domainFilter === null
                ? "bg-primary text-primary-foreground border-transparent"
                : "bg-muted/40 text-muted-foreground hover:bg-muted",
            )}
          >
            All domains
          </button>
          {domains.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() =>
                setDomainFilter((cur) => (cur === d ? null : d))
              }
              className={cn(
                "rounded-md border px-2 py-0.5 font-mono text-[0.65rem] transition-colors",
                domainFilter === d
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted",
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-4">
          {grouped.map(({ domain, items }) => (
            <section key={domain} aria-labelledby={domainId(domain)}>
              <h3
                id={domainId(domain)}
                className="text-muted-foreground mb-2 font-mono text-[0.65rem] tracking-[0.14em] uppercase"
              >
                {domain}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((cap) => (
                  <Card key={cap.id} className="border-muted shadow-none">
                    <CardHeader className="gap-1 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="font-mono text-sm leading-snug">
                          {cap.label}
                        </CardTitle>
                        {statusBadge(cap.status)}
                      </div>
                      <CardDescription className="font-mono text-[0.65rem] leading-relaxed">
                        {cap.apiRef}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-muted-foreground pt-0 text-xs leading-relaxed">
                      {cap.description}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

const integrationsAtlasModule: WidgetModule<Props> = {
  meta,
  propsSchema,
  defaultProps,
  Component: IntegrationsAtlas,
};

export default integrationsAtlasModule;
