import type { Config } from "drizzle-kit";
import { databaseFile } from "./src/lib/paths";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: databaseFile(),
  },
  verbose: true,
  strict: true,
} satisfies Config;
