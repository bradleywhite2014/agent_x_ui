import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * `shells` — the user-visible work surfaces. Each shell is a named frame the
 * user picked from a template (or created manually) and can have many ratified
 * revisions.
 *
 * The active config for a shell is the latest revision. We do not store config
 * directly on this row to keep the audit trail strictly append-only via
 * `revisions`.
 */
export const shells = sqliteTable(
  "shells",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    template: text("template").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
  },
  (table) => ({
    nameUnique: uniqueIndex("shells_name_unique").on(table.name),
  }),
);

/**
 * `revisions` — append-only history of every ratified mutation. The latest
 * non-reverted revision per shell is the active config.
 *
 * `config` holds the full JSON shape of the shell at this revision. Storing
 * snapshots (not patches) means revert and time-travel are O(1) reads. Patches
 * are stored alongside for traceability; they are not load-bearing for replay.
 */
export const revisions = sqliteTable("revisions", {
  id: text("id").primaryKey(),
  shellId: text("shell_id")
    .notNull()
    .references(() => shells.id, { onDelete: "cascade" }),
  parentRevisionId: text("parent_revision_id"),
  /** Full JSON snapshot of the shell at this revision. */
  config: text("config", { mode: "json" }).notNull(),
  /** JSON Patch the agent or user proposed; null for the genesis revision. */
  patch: text("patch", { mode: "json" }),
  /** "user" | "agent" | "revert" */
  authoredBy: text("authored_by").notNull(),
  /** Free-text reasoning the agent (or user) provided alongside the change. */
  reasoning: text("reasoning"),
  /** Mirrors `revisions.id` of the revision this revert restored to, if any. */
  revertOf: text("revert_of"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

/**
 * `themes` — saved theme presets and the user's currently-active global theme.
 * Per-frame theme overrides live inside the shell `config` JSON.
 */
export const themes = sqliteTable("themes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  /** "preset" | "custom" */
  kind: text("kind").notNull(),
  tokens: text("tokens", { mode: "json" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

/**
 * `prefs` — single-row key/value store for user preferences (active theme,
 * default model, dock position, etc.). Single-user v1 only; will be scoped per
 * user in v1.5.
 */
export const prefs = sqliteTable("prefs", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

/**
 * `browser_windows` — persisted state of `BrowserPane` widgets. Restored on
 * reload so the operator's working set of browser windows is durable.
 *
 * Inspired by Space Agent's `space.web_browsing.windows.v1` localStorage key,
 * but moved server-side so it survives across browsers and device migrations.
 */
export const browserWindows = sqliteTable("browser_windows", {
  id: text("id").primaryKey(),
  /** Numeric ordinal exposed to the agent (`browser.list()` returns these). */
  ordinal: integer("ordinal").notNull(),
  url: text("url").notNull(),
  title: text("title"),
  /** JSON: `{ x: number, y: number, width: number, height: number }` */
  geometry: text("geometry", { mode: "json" }).notNull(),
  minimized: integer("minimized", { mode: "boolean" }).notNull().default(false),
  zIndex: integer("z_index").notNull().default(0),
  shellId: text("shell_id").references(() => shells.id, {
    onDelete: "set null",
  }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type Shell = typeof shells.$inferSelect;
export type NewShell = typeof shells.$inferInsert;
export type Revision = typeof revisions.$inferSelect;
export type NewRevision = typeof revisions.$inferInsert;
export type Theme = typeof themes.$inferSelect;
export type NewTheme = typeof themes.$inferInsert;
export type Pref = typeof prefs.$inferSelect;
export type NewPref = typeof prefs.$inferInsert;
export type BrowserWindow = typeof browserWindows.$inferSelect;
export type NewBrowserWindow = typeof browserWindows.$inferInsert;
