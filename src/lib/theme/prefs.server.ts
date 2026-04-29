import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { prefs } from "@/lib/db/schema";
import { defaultGlobalThemeState } from "@/lib/theme/resolve";
import type { GlobalThemeState } from "@/lib/theme/schema";
import { globalThemeSchema } from "@/lib/theme/schema";

const GLOBAL_THEME_KEY = "theme.global" as const;

export function loadGlobalThemeState(): GlobalThemeState {
  const db = getDb();
  const row = db
    .select()
    .from(prefs)
    .where(eq(prefs.key, GLOBAL_THEME_KEY))
    .get();
  if (!row) {
    return defaultGlobalThemeState();
  }
  const parsed = globalThemeSchema.safeParse(row.value);
  return parsed.success ? parsed.data : defaultGlobalThemeState();
}

export function saveGlobalThemeState(next: GlobalThemeState): void {
  const validated = globalThemeSchema.parse(next);
  const db = getDb();
  const now = new Date();
  const existing = db
    .select()
    .from(prefs)
    .where(eq(prefs.key, GLOBAL_THEME_KEY))
    .get();
  if (existing) {
    db.update(prefs)
      .set({ value: validated, updatedAt: now })
      .where(eq(prefs.key, GLOBAL_THEME_KEY))
      .run();
  } else {
    db.insert(prefs).values({
      key: GLOBAL_THEME_KEY,
      value: validated,
      updatedAt: now,
    }).run();
  }
}
