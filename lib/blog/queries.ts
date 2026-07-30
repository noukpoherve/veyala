import "server-only";
import { db } from "@/lib/db";
import { mapAdminPost, mapPrismaPost, type AdminBlogPost } from "@/lib/blog/mapper";
import type { BlogPost } from "@/lib/blog/types";

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const rows = await db.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
  });
  return rows.map(mapPrismaPost);
}

export async function getPublishedPostBySlug(slug: string): Promise<BlogPost | null> {
  const row = await db.blogPost.findFirst({
    where: { slug, status: "PUBLISHED" },
  });
  return row ? mapPrismaPost(row) : null;
}

export async function getFeaturedPublishedPosts(): Promise<BlogPost[]> {
  const rows = await db.blogPost.findMany({
    where: { status: "PUBLISHED", featured: true },
    orderBy: { publishedAt: "desc" },
  });
  return rows.map(mapPrismaPost);
}

export async function getRelatedPublishedPosts(post: BlogPost, limit = 3): Promise<BlogPost[]> {
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
}

export async function getPublishedSlugs(): Promise<string[]> {
  const rows = await db.blogPost.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return rows.map((row) => row.slug);
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
