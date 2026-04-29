"use client";

import { useState, useTransition } from "react";
import { z } from "zod";
import { Save, NotebookPen, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WidgetComponentProps, WidgetModule } from "../types";

const propsSchema = z.object({
  title: z.string().max(80).optional(),
  content: z.string().default(""),
  placeholder: z.string().max(120).optional(),
});

type Props = z.infer<typeof propsSchema>;

const defaultProps: Props = {
  title: "Notes",
  content: "",
  placeholder: "Write something…",
};

function MarkdownNotes({ props, host }: WidgetComponentProps<Props>) {
  const persisted = props.content ?? "";
  // "Resetting state when a prop changes" — the derived-state pattern from
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders.
  // When the parent passes a new `persisted` value (e.g. after revert), we
  // re-seed the draft and baseline by calling setState during render.
  const [baseline, setBaseline] = useState(persisted);
  const [draft, setDraft] = useState(persisted);
  if (persisted !== baseline) {
    setBaseline(persisted);
    setDraft(persisted);
  }

  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty = draft !== baseline;

  const onSave = () => {
    if (!dirty) return;
    const nextContent = draft;
    startTransition(async () => {
      await host.updateProps({ ...props, content: nextContent });
      setBaseline(nextContent);
      setSavedAt(Date.now());
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-2.5 flex items-center gap-2">
        <NotebookPen className="text-muted-foreground size-4" aria-hidden />
        <span className="text-sm font-medium">{props.title ?? "Notes"}</span>
        <span className="text-muted-foreground ml-auto font-mono text-[0.65rem] tracking-wide uppercase">
          {pending
            ? "saving…"
            : dirty
              ? "unsaved"
              : savedAt
                ? "saved"
                : "ready"}
        </span>
        <Button
          size="xs"
          variant={dirty ? "default" : "ghost"}
          disabled={!dirty || pending}
          onClick={onSave}
          aria-label="Save notes"
        >
          {savedAt && !dirty ? (
            <Check data-icon="inline-start" />
          ) : (
            <Save data-icon="inline-start" />
          )}
          Save
        </Button>
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "s") {
            e.preventDefault();
            onSave();
          }
        }}
        placeholder={props.placeholder ?? "Write something…"}
        spellCheck
        className="text-foreground placeholder:text-muted-foreground flex-1 resize-none bg-transparent px-4 py-3 font-mono text-sm leading-relaxed outline-none"
        aria-label={`${props.title ?? "Notes"} editor`}
      />
    </div>
  );
}

const markdownNotesModule: WidgetModule<Props> = {
  meta: {
    slug: "markdown-notes",
    name: "Notes",
    description: "A plain-text notes panel. Use Cmd/Ctrl+S to save.",
    icon: "notebook-pen",
  },
  propsSchema,
  defaultProps,
  Component: MarkdownNotes,
};

export default markdownNotesModule;
