import type {
  BlogCategory as PrismaBlogCategory,
  BlogPost as PrismaBlogPost,
  BlogPostStatus,
} from "@prisma/client";
import type { BlogCategory, BlogFaq, BlogPost, ContentBlock } from "@/lib/blog/types";

const CATEGORY_TO_PRISMA: Record<BlogCategory, PrismaBlogCategory> = {
  cv: "CV",
  ats: "ATS",
  lettre: "LETTRE",
  emploi: "EMPLOI",
  etudes: "ETUDES",
  ia: "IA",
};

const CATEGORY_FROM_PRISMA: Record<PrismaBlogCategory, BlogCategory> = {
  CV: "cv",
  ATS: "ats",
  LETTRE: "lettre",
  EMPLOI: "emploi",
  ETUDES: "etudes",
  IA: "ia",
};

export function toPrismaCategory(category: BlogCategory): PrismaBlogCategory {
  return CATEGORY_TO_PRISMA[category];
}

export function fromPrismaCategory(category: PrismaBlogCategory): BlogCategory {
  return CATEGORY_FROM_PRISMA[category];
}

export function mapPrismaPost(row: PrismaBlogPost): BlogPost {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    excerpt: row.excerpt,
    category: fromPrismaCategory(row.category),
    tags: row.tags,
    keywords: row.keywords,
    publishedAt: (row.publishedAt ?? row.createdAt).toISOString().slice(0, 10),
    updatedAt: row.updatedAt.toISOString().slice(0, 10),
    readingTimeMin: row.readingTimeMin,
    featured: row.featured,
    author: { name: row.authorName, role: row.authorRole },
    accent: row.accent,
    body: parseBody(row.body),
    faq: parseFaq(row.faq),
  };
}

export type AdminBlogPost = BlogPost & {
  id: string;
  status: BlogPostStatus;
  focusKeyword: string | null;
  bodyMarkdown: string;
  publishedAtIso: string | null;
  createdAtIso: string;
  updatedAtIso: string;
};

export function mapAdminPost(row: PrismaBlogPost): AdminBlogPost {
  const post = mapPrismaPost(row);
  return {
    ...post,
    id: row.id,
    status: row.status,
    focusKeyword: row.focusKeyword,
    bodyMarkdown: row.bodyMarkdown,
    publishedAtIso: row.publishedAt?.toISOString() ?? null,
    createdAtIso: row.createdAt.toISOString(),
    updatedAtIso: row.updatedAt.toISOString(),
  };
}

function parseBody(value: unknown): ContentBlock[] {
  if (!Array.isArray(value)) return [];
  return value as ContentBlock[];
}

function parseFaq(value: unknown): BlogFaq[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  return value as BlogFaq[];
}

export function formatPostDate(isoDate: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(isoDate));
}

export function slugifyTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}
