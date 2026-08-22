"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { blocksToMarkdown, estimateReadingTimeMin, markdownToBlocks } from "@/lib/blog/markdown";
import { toPrismaCategory } from "@/lib/blog/mapper";
import { PUBLISH_MIN_SCORE, scoreSeo, splitCsv } from "@/lib/blog/seo-score";
import { blogPostInputSchema } from "@/lib/blog/validation";
import type { BlogFaq } from "@/lib/blog/types";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { redirectLocalized } from "@/i18n/redirect";

export type BlogActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
  seoScore?: number;
};

function formToInput(formData: FormData) {
  const faqRaw = String(formData.get("faqJson") ?? "[]");
  let faq: BlogFaq[] = [];
  try {
    const parsed = JSON.parse(faqRaw) as unknown;
    if (Array.isArray(parsed)) {
      faq = (parsed as BlogFaq[]).filter((item) => item.question?.trim() && item.answer?.trim());
    }
  } catch {
    faq = [];
  }

  return {
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    excerpt: String(formData.get("excerpt") ?? ""),
    category: String(formData.get("category") ?? "cv"),
    tags: splitCsv(String(formData.get("tags") ?? "")),
    keywords: splitCsv(String(formData.get("keywords") ?? "")),
    focusKeyword: String(formData.get("focusKeyword") ?? "") || null,
    featured: formData.get("featured") === "on" || formData.get("featured") === "true",
    accent: String(formData.get("accent") ?? "#2563EB"),
    authorName: String(
      formData.get("authorName") ?? getMessages(getLocale()).pages.support.fromTeam
    ),
    authorRole: String(
      formData.get("authorRole") ?? getMessages(getLocale()).adminUi.blogForm.defaultAuthorRole
    ),
    bodyMarkdown: String(formData.get("bodyMarkdown") ?? ""),
    faq,
  };
}

function parseInput(formData: FormData) {
  return blogPostInputSchema.safeParse(formToInput(formData));
}

function fail(message: string, fieldErrors?: Record<string, string[]>): BlogActionState {
  return { ok: false, message, fieldErrors };
}

async function assertUniqueSlug(slug: string, excludeId?: string) {
  const m = getMessages(getLocale());
  const existing = await db.blogPost.findUnique({ where: { slug }, select: { id: true } });
  if (existing && existing.id !== excludeId) {
    return fail(m.api.blog.slugTaken, { slug: [m.api.blog.slugTakenShort] });
  }
  return null;
}

export async function createBlogPost(
  _prev: BlogActionState | null,
  formData: FormData
): Promise<BlogActionState> {
  await requireAdmin();
  const locale = getLocale();
  const m = getMessages(locale);
  const parsed = parseInput(formData);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return fail(m.api.blog.invalidForm, fieldErrors);
  }

  const conflict = await assertUniqueSlug(parsed.data.slug);
  if (conflict) return conflict;

  const body = markdownToBlocks(parsed.data.bodyMarkdown);
  const seo = scoreSeo({
    ...parsed.data,
    focusKeyword: parsed.data.focusKeyword ?? "",
    faqCount: parsed.data.faq.length,
  });

  const intent = String(formData.get("intent") ?? "draft");
  if (intent === "publish" && !seo.canPublish) {
    return {
      ok: false,
      message: m.api.blog.seoTooLow(seo.score, PUBLISH_MIN_SCORE),
      seoScore: seo.score,
    };
  }

  const post = await db.blogPost.create({
    data: {
      slug: parsed.data.slug,
      title: parsed.data.title,
      description: parsed.data.description,
      excerpt: parsed.data.excerpt,
      category: toPrismaCategory(parsed.data.category),
      tags: parsed.data.tags,
      keywords: parsed.data.keywords,
      focusKeyword: parsed.data.focusKeyword,
      featured: parsed.data.featured,
      accent: parsed.data.accent,
      authorName: parsed.data.authorName,
      authorRole: parsed.data.authorRole,
      body,
      bodyMarkdown: parsed.data.bodyMarkdown || blocksToMarkdown(body),
      faq: parsed.data.faq,
      readingTimeMin: estimateReadingTimeMin(body),
      status: intent === "publish" ? "PUBLISHED" : "DRAFT",
      publishedAt: intent === "publish" ? new Date() : null,
    },
  });

  revalidateBlog();
  redirectLocalized(`/admin/blog/${post.id}/edit?saved=1`, locale);
}

export async function updateBlogPost(
  _prev: BlogActionState | null,
  formData: FormData
): Promise<BlogActionState> {
  await requireAdmin();
  const m = getMessages(getLocale());
  const id = String(formData.get("id") ?? "");
  if (!id) return fail(m.api.blog.postNotFound);

  const parsed = parseInput(formData);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return fail(m.api.blog.invalidForm, fieldErrors);
  }

  const conflict = await assertUniqueSlug(parsed.data.slug, id);
  if (conflict) return conflict;

  const existing = await db.blogPost.findUnique({ where: { id } });
  if (!existing) return fail(m.api.blog.postNotFound);

  const body = markdownToBlocks(parsed.data.bodyMarkdown);
  const seo = scoreSeo({
    ...parsed.data,
    focusKeyword: parsed.data.focusKeyword ?? "",
    faqCount: parsed.data.faq.length,
  });

  const intent = String(formData.get("intent") ?? "draft");
  if (intent === "publish" && !seo.canPublish) {
    return {
      ok: false,
      message: m.api.blog.seoTooLow(seo.score, PUBLISH_MIN_SCORE),
      seoScore: seo.score,
    };
  }

  let status = existing.status;
  let publishedAt = existing.publishedAt;
  if (intent === "publish") {
    status = "PUBLISHED";
    publishedAt = publishedAt ?? new Date();
  } else if (intent === "draft") {
    status = "DRAFT";
  }

  await db.blogPost.update({
    where: { id },
    data: {
      slug: parsed.data.slug,
      title: parsed.data.title,
      description: parsed.data.description,
      excerpt: parsed.data.excerpt,
      category: toPrismaCategory(parsed.data.category),
      tags: parsed.data.tags,
      keywords: parsed.data.keywords,
      focusKeyword: parsed.data.focusKeyword,
      featured: parsed.data.featured,
      accent: parsed.data.accent,
      authorName: parsed.data.authorName,
      authorRole: parsed.data.authorRole,
      body,
      bodyMarkdown: parsed.data.bodyMarkdown || blocksToMarkdown(body),
      faq: parsed.data.faq,
      readingTimeMin: estimateReadingTimeMin(body),
      status,
      publishedAt,
    },
  });

  revalidateBlog(parsed.data.slug);
  return {
    ok: true,
    message:
      intent === "publish" ? m.api.blog.published(seo.score) : m.api.blog.draftSaved(seo.score),
    seoScore: seo.score,
  };
}

export async function unpublishBlogPost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const post = await db.blogPost.update({
    where: { id },
    data: { status: "DRAFT" },
  });
  revalidateBlog(post.slug);
  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${id}/edit`);
}

export async function deleteBlogPost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const post = await db.blogPost.delete({ where: { id } });
  revalidateBlog(post.slug);
  redirectLocalized("/admin/blog");
}

function revalidateBlog(slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/blog/feed.xml");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/blog");
  if (slug) {
    revalidatePath(`/blog/${slug}`);
    revalidatePath(`/blog/${slug}/opengraph-image`);
  }
}
