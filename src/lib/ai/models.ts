import "server-only";

import { anthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

/**
 * Default model for Agent X. Locked in `docs/BUILD_PLAN.md` and overridable
 * via the `DEFAULT_MODEL` env var.
 *
 * The agent loop is provider-agnostic — call sites should depend on
 * `defaultModel()`, not on Anthropic types directly.
 */
export const DEFAULT_MODEL_ID = "claude-opus-4-6";

export function defaultModel(): LanguageModel {
  const id = process.env.DEFAULT_MODEL ?? DEFAULT_MODEL_ID;
  return anthropic(id);
}

export interface ModelInfo {
  id: string;
  provider: "anthropic";
}

export function defaultModelInfo(): ModelInfo {
  return {
    id: process.env.DEFAULT_MODEL ?? DEFAULT_MODEL_ID,
    provider: "anthropic",
  };
}
