import { PrismaClient } from "@prisma/client";

/**
 * Dev singleton must be invalidated when the Prisma schema gains fields
 * (otherwise hot-reload keeps an old client → "Unknown argument `softSkills`").
 * Bump CLIENT_REV after schema changes that require a fresh PrismaClient.
 */
const CLIENT_REV = "archive-activity-1";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaClientRev?: string;
};

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

if (process.env.NODE_ENV !== "production") {
  if (globalForPrisma.prismaClientRev !== CLIENT_REV) {
    void globalForPrisma.prisma?.$disconnect().catch(() => undefined);
    globalForPrisma.prisma = createClient();
    globalForPrisma.prismaClientRev = CLIENT_REV;
  }
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.prismaClientRev = CLIENT_REV;
}
