import { PrismaClient } from "@prisma/client";

export function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for Prisma database access.");
  }

  return new PrismaClient();
}
