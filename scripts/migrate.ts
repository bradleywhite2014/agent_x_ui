/**
 * Apply Drizzle migrations against the local Agent X SQLite database.
 *
 * Usage:
 *   npm run db:migrate
 *
 * Reads migrations from ./drizzle/ and applies them in order.
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { databaseFile, ensureAgentXHome, migrationsDir } from "../src/lib/paths";

function main(): void {
  const home = ensureAgentXHome();
  const dbPath = databaseFile();
  console.log(`[agent-x] migrate: home=${home}`);
  console.log(`[agent-x] migrate: db=${dbPath}`);

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite);

  migrate(db, { migrationsFolder: migrationsDir() });

  sqlite.close();
  console.log(`[agent-x] migrate: done`);
}

main();
