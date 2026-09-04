import { PrismaClient } from "@prisma/client";

/**
 * Dev singleton must be invalidated when the Prisma schema gains fields/models
 * (otherwise hot-reload keeps an old client → missing delegates like `blogPost`).
 * Bump CLIENT_REV after schema changes that require a fresh PrismaClient.
 */
const CLIENT_REV = "onboarding-tour-1";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaClientRev?: string;
};

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

function needsFreshClient(client: PrismaClient | undefined): boolean {
  if (!client) return true;
  if (globalForPrisma.prismaClientRev !== CLIENT_REV) return true;
  // Stale HMR clients created before `prisma generate` for newer models.
  const c = client as PrismaClient & {
    blogPost?: { findMany?: unknown };
    formationAnalysis?: { findUnique?: unknown };
  };
  if (typeof c.blogPost?.findMany !== "function") return true;
  if (typeof c.formationAnalysis?.findUnique !== "function") return true;
  return false;
}

if (process.env.NODE_ENV !== "production") {
  if (needsFreshClient(globalForPrisma.prisma)) {
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
