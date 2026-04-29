"use client";

import { useState } from "react";
import { z } from "zod";
import { ArrowUpRight, Globe, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WidgetComponentProps, WidgetModule } from "../types";

const propsSchema = z.object({
  title: z.string().max(80).optional(),
  url: z
    .string()
    .url("URL must include a scheme, e.g. https://…")
    .default("https://example.com"),
});

type Props = z.infer<typeof propsSchema>;

const defaultProps: Props = {
  title: "Web Preview",
  url: "https://example.com",
};

function WebPreview({ props }: WidgetComponentProps<Props>) {
  const [loadKey, setLoadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refused, setRefused] = useState(false);

  const reload = () => {
    setLoadKey((k) => k + 1);
    setLoading(true);
    setRefused(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-2.5 flex items-center gap-2">
        <Globe className="text-muted-foreground size-4" aria-hidden />
        <span className="text-sm font-medium">{props.title ?? "Preview"}</span>
        <code
          className="text-muted-foreground ml-3 max-w-[40ch] truncate font-mono text-xs"
          title={props.url}
        >
          {props.url}
        </code>
        <div className="ml-auto flex items-center gap-1">
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={reload}
            aria-label="Reload preview"
          >
            <RefreshCw />
          </Button>
          <a
            href={props.url}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-6 items-center justify-center rounded-[10px] transition-colors"
            aria-label="Open in new tab"
          >
            <ArrowUpRight className="size-3" />
          </a>
        </div>
      </div>

      <div className="bg-muted/30 relative flex-1">
        {loading ? (
          <div className="text-muted-foreground absolute inset-0 flex items-center justify-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading…
          </div>
        ) : null}
        {refused ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm font-medium">
              This site refuses to embed in an iframe.
            </p>
            <p className="text-muted-foreground max-w-md text-xs">
              Many enterprise SaaS apps block iframe embedding via{" "}
              <code className="font-mono">X-Frame-Options</code> or{" "}
              <code className="font-mono">CSP frame-ancestors</code>. Open it
              directly to keep working — full coverage lands with the v1.5
              Electron host.
            </p>
            <a
              href={props.url}
              target="_blank"
              rel="noreferrer"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 items-center gap-1 rounded-md px-3 text-xs font-medium"
            >
              Open in new tab
              <ArrowUpRight className="size-3" />
            </a>
          </div>
        ) : null}
        <iframe
          key={loadKey}
          src={props.url}
          title={props.title ?? "Web preview"}
          className={cn(
            "h-full w-full border-0",
            loading || refused ? "opacity-0" : "opacity-100",
          )}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setRefused(true);
          }}
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}

const webPreviewModule: WidgetModule<Props> = {
  meta: {
    slug: "web-preview",
    name: "Web Preview",
    description:
      "Embed a website in an iframe. Sites that refuse iframe embedding fall back to an open-in-new-tab affordance.",
    icon: "globe",
  },
  propsSchema,
  defaultProps,
  Component: WebPreview,
};

export default webPreviewModule;
