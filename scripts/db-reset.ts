/**
 * Drop the local Agent X SQLite database (destructive). For development only.
 *
 * Usage:
 *   npm run db:reset
 */
import fs from "node:fs";
import { databaseFile } from "../src/lib/paths";

function main(): void {
  const dbPath = databaseFile();
  for (const suffix of ["", "-wal", "-shm", "-journal"]) {
    const target = `${dbPath}${suffix}`;
    if (fs.existsSync(target)) {
      fs.rmSync(target);
      console.log(`[agent-x] db:reset removed ${target}`);
    }
  }
  console.log(`[agent-x] db:reset: done`);
}

main();
