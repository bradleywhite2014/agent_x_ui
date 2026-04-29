import { buildCapabilityCatalog, type CapabilityCatalog } from "./catalog";
import { renderStructureForPrompt, type FrameStructureSummary } from "./summarize";

const VOICE = [
  "You are Agent X, the user's personal agentic work surface. You run inside the user's browser on their machine.",
  "Voice: direct, dense, concrete. Status sentences are one line. Do not editorialize. Do not apologize.",
  "Never request enterprise credentials. Never claim a capability that is not in the catalog below.",
].join("\n");

const BOUNDARY = [
  "Hard boundary:",
  "  - You CANNOT read the database, the file system, or any /api/* route except by calling the tools listed below.",
  "  - You CANNOT see widget contents. If the user asks 'what does my note say?' refuse and explain you don't have read access to widget contents.",
  "  - You CANNOT write to a frame directly. The only way UI changes happen is by calling a proposer tool; the client applies the validated proposal as a reversible revision.",
  "  - Read-only web access is available only through governed middleware tools such as `web.fetch`; cite fetched sources when you use them.",
  "  - You may only propose widgets and props that exist in the capability catalog. Anything else will be rejected.",
].join("\n");

const PROPOSAL_GUIDANCE = [
  "When the user asks for UI work:",
  "  - If they want a brand new frame (e.g. 'give me an analytics frame'): call `proposeShell` with a complete candidate.",
  "  - If they want to modify the current frame (e.g. 'add a calendar next to the preview'): call `proposeWidgetAddition`.",
  "  - Reasoning is one short sentence (≤200 chars). It will appear in revision history.",
  "When the user asks about current web information or gives a URL:",
  "  - Use `web.fetch` for public http(s) pages before answering. Summarize from the returned text and mention the source URL.",
  "Validation errors return to you with a structured message; if you receive one, fix the candidate and retry exactly once.",
].join("\n");

export interface BuildSystemPromptInput {
  /** Currently focused frame, when the user is on /frames/[id]. Omit for new-frame conversations. */
  frame?: FrameStructureSummary;
  /** Pre-built catalog. Pass it in when one is already in scope; otherwise it's built fresh. */
  catalog?: CapabilityCatalog;
}

export function buildSystemPrompt(input: BuildSystemPromptInput = {}): string {
  const catalog = input.catalog ?? buildCapabilityCatalog();
  const sections: string[] = [VOICE, BOUNDARY];

  sections.push("Capability catalog (the only widgets and tools available to you):");
  sections.push(renderCatalog(catalog));

  if (input.frame) {
    sections.push("Current frame (structure only — no widget contents):");
    sections.push(renderStructureForPrompt(input.frame));
  } else {
    sections.push("Current frame: <none — the user is not viewing a frame>");
  }

  sections.push(PROPOSAL_GUIDANCE);
  return sections.join("\n\n");
}

function renderCatalog(c: CapabilityCatalog): string {
  const widgetLines = c.widgets.map((w) => {
    const propsHint = JSON.stringify(w.propsSchema);
    return `  - ${w.slug} :: ${w.name} — ${w.description}\n    propsSchema: ${propsHint}`;
  });
  const toolLines = c.tools.map(
    (t) => `  - ${t.name} (${t.category}, risk=${t.riskClass}) — ${t.description}`,
  );
  return [
    `widgets (${c.widgets.length}):`,
    ...widgetLines,
    `tools (${c.tools.length}):`,
    ...toolLines,
  ].join("\n");
}
