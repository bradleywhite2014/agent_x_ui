import Link from "next/link";
import { ArrowRight, Code2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { GlobalThemeMenuButton } from "@/components/theme/GlobalThemeMenuButton";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md font-mono text-sm font-semibold">
              X
            </div>
            <span className="font-mono text-sm font-semibold tracking-tight">
              Agent X
            </span>
            <Badge variant="secondary" className="font-mono">
              v0.1 pre-alpha
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <GlobalThemeMenuButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-16">
        <section className="max-w-3xl">
          <p className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">
            Personal · Local-first · BYO-Identity
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            A personal agentic work-surface.
          </h1>

          <p className="text-muted-foreground mt-5 max-w-2xl text-base sm:text-lg">
            Agent X runs on your machine, observes how you work, and proposes
            mutations to a config-driven shell that you ratify, reject, or
            revert. It acts inside your already-authorized browser sessions —
            no enterprise credentials are ever held by the agent.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/frames" className={buttonVariants({ size: "lg" })}>
              Pick a frame
              <ArrowRight data-icon="inline-end" />
            </Link>
            <a
              href="https://github.com/bradleywhite2014/agent_x_ui"
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              <Code2 data-icon="inline-start" />
              Source
            </a>
          </div>
        </section>

        <Separator className="my-12" />

        <section className="grid gap-4 sm:grid-cols-3">
          <FactCard
            label="Status"
            value="Pre-alpha"
            description="P0 foundation phase. See docs/BUILD_PLAN.md."
          />
          <FactCard
            label="Default model"
            value="Claude Opus 4.6"
            description="Provider-agnostic via Vercel AI SDK."
          />
          <FactCard
            label="Runtime"
            value="Local-first"
            description="Your machine. Your sessions. Your access."
          />
        </section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4 text-xs">
          <span className="font-mono">agent_x_ui</span>
          <span>
            Source of truth ·{" "}
            <code className="font-mono">docs/BUILD_PLAN.md</code>
          </span>
        </div>
      </footer>
    </>
  );
}

function FactCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="font-mono text-[0.65rem] tracking-[0.18em] uppercase">
          {label}
        </CardDescription>
        <CardTitle className="text-lg font-semibold">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}
