import { PrismaClient } from "./node_modules/.prisma/client/index.js";
async function test() {
  try {
    const prisma = new PrismaClient();
    console.log("Prisma client instantiated successfully from .prisma/client");
    await prisma.$disconnect();
  } catch (e) {
    console.error("Failed to instantiate Prisma client:", e);
  }
}
test();
