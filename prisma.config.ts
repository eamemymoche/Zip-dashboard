import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local" });
loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "[prisma.config.ts] DATABASE_URL environment variable is not set.\n" +
    "This is required for all Prisma commands (migrate, generate, db:seed).\n" +
    "Set it in .env.local (or your shell environment) before running DB commands.\n" +
    "Example: DATABASE_URL=\"postgresql://user:password@localhost:5432/zipline\"\n" +
    "See README.md § PostgreSQL rollout — what you need first for full setup steps."
  );
}

export default defineConfig({
  schema: "packages/db/prisma/schema.prisma",
  migrations: {
    path: "packages/db/prisma/migrations"
  },
  datasource: {
    url: DATABASE_URL
  }
});
