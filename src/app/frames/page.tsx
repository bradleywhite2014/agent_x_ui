import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { GlobalThemeMenuButton } from "@/components/theme/GlobalThemeMenuButton";
import { ThemeToggle } from "@/components/theme-toggle";
import { listFrames } from "@/lib/shell/repo";
import {
  findTemplate,
  PERSONA_LABEL,
  personaRank,
  TEMPLATES,
} from "@/lib/shell/templates";
import { CreateFrameButton } from "./CreateFrameButton";

export const dynamic = "force-dynamic";

const SORTED_TEMPLATES = [...TEMPLATES].sort(
  (a, b) => personaRank(a.persona) - personaRank(b.persona),
);

export default function FramesPage() {
  const frames = listFrames();

  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md font-mono text-sm font-semibold transition-opacity hover:opacity-90"
            >
              X
            </Link>
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

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12">
        <section>
          <p className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">
            Frames · Workspaces
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Pick how you want to work.
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed">
            Finance, support, and ops starters ship different seeded notes and
            rail labels — composable like Cursor layouts, constrained to the
            middleware surface area you wire later. Each frame has its own
            revision history so you can ratify or revert agent proposals with
            confidence.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-foreground/80 mb-3 text-sm font-medium tracking-tight">
            Your frames
          </h2>
          {frames.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="text-muted-foreground flex flex-col items-start gap-2 py-6 text-sm">
                You don&apos;t have any frames yet. Pick a persona template
                below to start one.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {frames.map((f) => (
                <Card key={f.id} className="group/frame transition-colors">
                  <CardHeader>
                    <CardDescription className="font-mono text-[0.65rem] tracking-[0.18em] uppercase">
                      {findTemplate(f.template)?.name ?? f.template}
                    </CardDescription>
                    <CardTitle className="text-lg font-semibold">
                      {f.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 text-xs">
                      Updated{" "}
                      {new Date(f.updatedAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <Link
                      href={`/frames/${f.id}`}
                      className={buttonVariants({
                        size: "sm",
                        variant: "outline",
                      })}
                    >
                      Open
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-foreground/80 mb-1 text-sm font-medium tracking-tight">
            Start from a persona template
          </h2>
          <p className="text-muted-foreground mb-5 max-w-2xl text-xs leading-relaxed">
            Same operator shell shape everywhere — rail + stack + integrations
            atlas — tuned copy per role. Add widgets in Edit mode when you need
            more panels.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {SORTED_TEMPLATES.map((t) => (
              <Card key={t.slug} className="flex flex-col">
                <CardHeader className="gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <CardDescription className="font-mono text-[0.65rem] tracking-[0.18em] uppercase">
                        Template
                      </CardDescription>
                      <CardTitle className="text-lg font-semibold tracking-tight">
                        {t.name}
                      </CardTitle>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-muted-foreground shrink-0 font-normal"
                    >
                      {PERSONA_LABEL[t.persona ?? "general"]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto flex flex-col gap-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t.description}
                  </p>
                  <CreateFrameButton template={t.slug} label={t.name} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4 text-xs">
          <Link href="/" className="hover:text-foreground transition-colors">
            ← Home
          </Link>
          <span className="font-mono">agent_x_ui</span>
        </div>
      </footer>
    </>
  );
}
