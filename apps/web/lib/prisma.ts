import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function loadDatabaseUrlFromRootEnvLocal() {
  if (process.env.DATABASE_URL) return;

  const candidates = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), "..", ".env.local"),
    path.join(process.cwd(), "..", "..", ".env.local")
  ];

  for (const envPath of candidates) {
    if (!existsSync(envPath)) continue;

    const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (key !== "DATABASE_URL") continue;
      const rawValue = trimmed.slice(eq + 1).trim();
      const unquoted =
        (rawValue.startsWith("\"") && rawValue.endsWith("\"")) ||
        (rawValue.startsWith("'") && rawValue.endsWith("'"))
          ? rawValue.slice(1, -1)
          : rawValue;
      if (unquoted) {
        process.env.DATABASE_URL = unquoted;
      }
      return;
    }
  }
}

export function createPrismaClient() {
  loadDatabaseUrlFromRootEnvLocal();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for Prisma database access.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString })
  });
}
