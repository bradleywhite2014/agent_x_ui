"use client";

import { Activity, DatabaseZap, Radar, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getRoleDashboardData } from "@/lib/integrations/mock-results";
import { cn } from "@/lib/utils";
import type { WidgetComponentProps, WidgetModule } from "../types";
import { defaultProps, meta, propsSchema, type Props } from "./meta";

function RoleCommandCenter({ props }: WidgetComponentProps<Props>) {
  const data = getRoleDashboardData(props.persona);
  const max = Math.max(...data.series.map((p) => p.value), 1);

  return (
    <div className="bg-background flex h-full min-h-0 flex-col">
      <div className="border-b px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-muted-foreground mb-1 flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.16em] uppercase">
              <span className="bg-primary/80 inline-flex size-1.5 rounded-full shadow-[0_0_0_4px_color-mix(in_oklch,var(--primary)_18%,transparent)]" />
              {data.eyebrow}
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {props.title ?? data.title}
            </h2>
            <p className="text-muted-foreground mt-1 max-w-3xl text-sm leading-relaxed">
              {data.subtitle}
            </p>
          </div>
          <Badge variant="secondary" className="gap-1.5 font-mono">
            <Sparkles className="size-3" aria-hidden />
            live mock
          </Badge>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
          <section className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {data.kpis.map((kpi) => (
                <Card key={kpi.label} size="sm" className="shadow-none">
                  <CardHeader className="pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-muted-foreground text-xs font-medium">
                        {kpi.label}
                      </CardTitle>
                      <span
                        className={cn(
                          "mt-1 size-2 rounded-full",
                          kpi.tone === "good" && "bg-primary",
                          kpi.tone === "watch" && "bg-destructive",
                          kpi.tone === "neutral" && "bg-muted-foreground",
                        )}
                        aria-hidden
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold tracking-tight">
                      {kpi.value}
                    </div>
                    <div className="text-muted-foreground mt-1 flex items-center justify-between gap-2 text-[0.7rem]">
                      <span>{kpi.delta}</span>
                      <span className="truncate font-mono">{kpi.source}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <Radar className="text-primary size-4" aria-hidden />
                    {data.seriesLabel}
                  </CardTitle>
                  <span className="text-muted-foreground font-mono text-[0.65rem]">
                    p95 refresh 430ms
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className="flex h-44 items-end gap-2 rounded-lg border bg-muted/20 p-3"
                  role="img"
                  aria-label={data.seriesLabel}
                >
                  {data.series.map((point) => (
                    <div
                      key={point.label}
                      className="flex min-w-0 flex-1 flex-col items-center gap-2"
                    >
                      <div
                        className="w-full rounded-t-md bg-primary/75 transition-[height] duration-300"
                        style={{
                          height: `${Math.max(12, (point.value / max) * 100)}%`,
                        }}
                      />
                      <span className="text-muted-foreground truncate font-mono text-[0.6rem]">
                        {point.label}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground mt-2 text-xs">
                  {data.delight}
                </p>
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-4">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="text-primary size-4" aria-hidden />
                  Work queue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.workItems.map((item) => (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {item.id}
                      </Badge>
                      <span className="text-muted-foreground ml-auto font-mono text-[0.65rem]">
                        {item.status}
                      </span>
                    </div>
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      {item.owner} · {item.signal}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DatabaseZap className="text-primary size-4" aria-hidden />
                  Mock API feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.feed.map((item, i) => (
                    <div key={`${item.system}-${item.object}`}>
                      {i > 0 ? <Separator className="mb-3" /> : null}
                      <div className="flex items-start gap-3">
                        <span className="bg-primary mt-1 size-2 rounded-full" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">
                              {item.system}
                            </span>
                            <span className="text-muted-foreground font-mono text-[0.65rem]">
                              {item.freshness}
                            </span>
                          </div>
                          <div className="text-muted-foreground font-mono text-[0.7rem]">
                            {item.object}
                          </div>
                          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </ScrollArea>
    </div>
  );
}

const roleCommandCenterModule: WidgetModule<Props> = {
  meta,
  propsSchema,
  defaultProps,
  Component: RoleCommandCenter,
};

export default roleCommandCenterModule;
