import path from "node:path";
import os from "node:os";
import fs from "node:fs";

export function agentXHome(): string {
  const fromEnv = process.env.AGENT_X_HOME;
  if (fromEnv && fromEnv.trim().length > 0) {
    return path.resolve(fromEnv);
  }
  return path.join(os.homedir(), ".agent-x");
}

export function ensureAgentXHome(): string {
  const home = agentXHome();
  fs.mkdirSync(home, { recursive: true });
  fs.mkdirSync(path.join(home, "logs"), { recursive: true });
  return home;
}

export function databaseFile(): string {
  return path.join(agentXHome(), "agent_x.db");
}

export function migrationsDir(): string {
  return path.resolve(process.cwd(), "drizzle");
}
