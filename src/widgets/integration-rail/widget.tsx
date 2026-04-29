"use client";

import {
  LifeBuoy,
  Mail,
  Search,
  Webhook,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MOCK_INTEGRATION_CAPABILITIES,
  summarizeCapabilityCounts,
} from "@/lib/integrations/mock-catalog";
import type { WidgetComponentProps, WidgetModule } from "../types";
import { meta, propsSchema, defaultProps, type Props } from "./meta";

function IntegrationRail({ props }: WidgetComponentProps<Props>) {
  const counts = summarizeCapabilityCounts(MOCK_INTEGRATION_CAPABILITIES);
  const label = props.productLabel ?? "Console";

  function mockAction(name: string) {
    toast.message(`${name} (mock)`, {
      description:
        "Middleware not wired — interaction proves UX composition only.",
    });
  }

  return (
    <div className="bg-sidebar text-sidebar-foreground flex h-full min-h-0 flex-col border-r">
      <div className="px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold">
            AX
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold tracking-tight">
              {label}
            </p>
            <p className="text-muted-foreground truncate font-mono text-[0.6rem] tracking-[0.12em] uppercase">
              Middleware UX
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-1 px-2 py-2">
        <p className="text-muted-foreground px-1 font-mono text-[0.6rem] tracking-[0.16em] uppercase">
          Quick actions
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-start gap-2 font-normal"
          onClick={() => mockAction("web.search")}
        >
          <Search className="size-4 shrink-0 opacity-80" aria-hidden />
          Search web
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-start gap-2 font-normal"
          onClick={() => mockAction("email.send")}
        >
          <Mail className="size-4 shrink-0 opacity-80" aria-hidden />
          Compose mail
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-start gap-2 font-normal"
          onClick={() => mockAction("zendesk.ticket")}
        >
          <LifeBuoy className="size-4 shrink-0 opacity-80" aria-hidden />
          Open ticket
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-start gap-2 font-normal"
          onClick={() => mockAction("webhook.inbound")}
        >
          <Webhook className="size-4 shrink-0 opacity-80" aria-hidden />
          Simulate webhook
        </Button>
      </div>

      <Separator />

      <div className="flex flex-1 flex-col gap-1 overflow-auto px-2 py-2">
        <p className="text-muted-foreground px-1 font-mono text-[0.6rem] tracking-[0.16em] uppercase">
          System map
        </p>
        <p className="text-muted-foreground px-1 text-xs leading-relaxed">
          Open <span className="text-foreground">Integrations</span> in the top
          toolbar to inspect mocked APIs, domains, and future adapter refs.
        </p>
      </div>

      <div className="mt-auto border-t px-3 py-3">
        <p className="text-muted-foreground mb-1 font-mono text-[0.6rem] tracking-[0.14em] uppercase">
          Catalog (mock)
        </p>
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="font-mono text-[0.65rem]">
            total {counts.total}
          </Badge>
          <Badge variant="outline" className="font-mono text-[0.65rem]">
            mock {counts.mock}
          </Badge>
          {counts.live ? (
            <Badge variant="default" className="font-mono text-[0.65rem]">
              live {counts.live}
            </Badge>
          ) : null}
          <Badge variant="outline" className="font-mono text-[0.65rem]">
            planned {counts.planned}
          </Badge>
        </div>
      </div>
    </div>
  );
}

const integrationRailModule: WidgetModule<Props> = {
  meta,
  propsSchema,
  defaultProps,
  Component: IntegrationRail,
};

export default integrationRailModule;
