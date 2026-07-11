import type { Template } from "@prisma/client";

/**
 * Merges the cached public template list with the user's own templates,
 * deduplicated by id (an approved community template appears in both),
 * ordered by creation date like the original single query.
 */
export function mergeTemplateLists(publicTemplates: Template[], ownTemplates: Template[]) {
  const ownIds = new Set(ownTemplates.map((t) => t.id));
  return [...publicTemplates.filter((t) => !ownIds.has(t.id)), ...ownTemplates].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}
