import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const PACKS_TAG = "packs";
export const PUBLIC_TEMPLATES_TAG = "public-templates";

/**
 * Active credit packs, cached across requests (Next.js data cache).
 * Rarely change; revalidated by tag on admin edits and every 5 min as a fallback.
 */
export const getActivePacks = unstable_cache(
  () => db.pack.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ["active-packs"],
  { revalidate: 300, tags: [PACKS_TAG] }
);

/**
 * Approved public templates, cached across requests.
 * Revalidated by tag when an admin approves/rejects a template.
 */
export const getPublicTemplates = unstable_cache(
  () =>
    db.template.findMany({
      where: { isPublic: true, status: "APPROVED" },
      orderBy: { createdAt: "asc" },
    }),
  ["public-templates"],
  { revalidate: 300, tags: [PUBLIC_TEMPLATES_TAG] }
);
