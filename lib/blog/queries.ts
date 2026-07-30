import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { mapAdminPost, mapPrismaPost, type AdminBlogPost } from "@/lib/blog/mapper";
import type { BlogPost } from "@/lib/blog/types";

/** True while `next build` collects page data (no guaranteed DB in CI). */
function isProductionBuild(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function isDbUnreachable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P1001 = can't reach database server
    return error.code === "P1001";
  }
  return error instanceof Error && /Can't reach database server/i.test(error.message);
}

/**
 * Public blog reads must not crash `next build` when CI has no Postgres.
 * At runtime with a configured DB, errors still propagate.
 */
async function publicQuery<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    const allowEmpty = (isProductionBuild() || process.env.CI === "true") && isDbUnreachable(error);
    if (allowEmpty) {
      console.warn(`[blog] ${label}: database unavailable during build, using empty fallback`);
      return fallback;
    }
    throw error;
  }
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  return publicQuery("getPublishedPosts", async () => {
    const rows = await db.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    });
    return rows.map(mapPrismaPost);
  }, []);
}

export async function getPublishedPostBySlug(slug: string): Promise<BlogPost | null> {
  return publicQuery(
    "getPublishedPostBySlug",
    async () => {
      const row = await db.blogPost.findFirst({
        where: { slug, status: "PUBLISHED" },
      });
      return row ? mapPrismaPost(row) : null;
    },
    null
  );
}

export async function getFeaturedPublishedPosts(): Promise<BlogPost[]> {
  return publicQuery("getFeaturedPublishedPosts", async () => {
    const rows = await db.blogPost.findMany({
      where: { status: "PUBLISHED", featured: true },
      orderBy: { publishedAt: "desc" },
    });
    return rows.map(mapPrismaPost);
  }, []);
}

export async function getRelatedPublishedPosts(post: BlogPost, limit = 3): Promise<BlogPost[]> {
  return publicQuery("getRelatedPublishedPosts", async () => {
    const rows = await db.blogPost.findMany({
      where: { status: "PUBLISHED", NOT: { slug: post.slug } },
      orderBy: { publishedAt: "desc" },
      take: 20,
    });

    return rows
      .map(mapPrismaPost)
      .map((candidate) => {
        let score = 0;
        if (candidate.category === post.category) score += 3;
        score += candidate.tags.filter((tag) => post.tags.includes(tag)).length;
        return { post: candidate, score };
      })
      .sort((a, b) => b.score - a.score || b.post.publishedAt.localeCompare(a.post.publishedAt))
      .slice(0, limit)
      .map(({ post: related }) => related);
  }, []);
}

export async function getPublishedSlugs(): Promise<string[]> {
  return publicQuery("getPublishedSlugs", async () => {
    const rows = await db.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    });
    return rows.map((row) => row.slug);
  }, []);
}

export async function listAdminPosts(): Promise<AdminBlogPost[]> {
  const rows = await db.blogPost.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });
  return rows.map(mapAdminPost);
}

export async function getAdminPostById(id: string): Promise<AdminBlogPost | null> {
  const row = await db.blogPost.findUnique({ where: { id } });
  return row ? mapAdminPost(row) : null;
}
