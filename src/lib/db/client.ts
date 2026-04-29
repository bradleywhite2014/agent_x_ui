import "server-only";

import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import { databaseFile, ensureAgentXHome } from "@/lib/paths";
import * as schema from "./schema";

let cached: BetterSQLite3Database<typeof schema> | null = null;
let cachedRaw: Database.Database | null = null;

/**
 * Get the singleton Drizzle client. Lazy-initialized so importing this module
 * in route handlers doesn't immediately touch the disk.
 */
export function getDb(): BetterSQLite3Database<typeof schema> {
  if (cached) return cached;
  ensureAgentXHome();
  const sqlite = new Database(databaseFile());
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  cachedRaw = sqlite;
  cached = drizzle(sqlite, { schema });
  return cached;
}

export function getRawSqlite(): Database.Database {
  if (cachedRaw) return cachedRaw;
  getDb();
  if (!cachedRaw) {
    throw new Error("getDb() failed to initialize the SQLite handle.");
  }
  return cachedRaw;
}

export type Db = ReturnType<typeof getDb>;
