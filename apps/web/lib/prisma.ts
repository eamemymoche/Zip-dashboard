import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;

type PrismaGlobal = typeof globalThis & {
  ziplinePrisma?: PrismaClient;
  ziplinePgPool?: pg.Pool;
};

function loadDatabaseUrlFromRootEnvLocal() {
  if (process.env.DATABASE_URL) return;

  const candidates = [
    path.join(/*turbopackIgnore: true*/ process.cwd(), ".env.local"),
    path.join(/*turbopackIgnore: true*/ process.cwd(), "..", ".env.local"),
    path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", ".env.local")
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

  const globalForPrisma = globalThis as PrismaGlobal;
  if (globalForPrisma.ziplinePrisma) {
    return globalForPrisma.ziplinePrisma;
  }

  const pool =
    globalForPrisma.ziplinePgPool ??
    new Pool({
      connectionString,
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      idleTimeoutMillis: Number(process.env.DATABASE_POOL_IDLE_TIMEOUT_MS ?? 30_000),
      connectionTimeoutMillis: Number(process.env.DATABASE_POOL_CONNECTION_TIMEOUT_MS ?? 5_000),
      statement_timeout: Number(process.env.DATABASE_STATEMENT_TIMEOUT_MS ?? 15_000)
    });

  pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL pool error:", error);
  });

  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool)
  });

  globalForPrisma.ziplinePgPool = pool;
  globalForPrisma.ziplinePrisma = prisma;

  return prisma;
}
