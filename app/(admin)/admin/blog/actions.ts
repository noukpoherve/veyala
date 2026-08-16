"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { blocksToMarkdown, estimateReadingTimeMin, markdownToBlocks } from "@/lib/blog/markdown";
import { toPrismaCategory } from "@/lib/blog/mapper";
import { PUBLISH_MIN_SCORE, scoreSeo, splitCsv } from "@/lib/blog/seo-score";
import { blogPostInputSchema } from "@/lib/blog/validation";
import type { BlogFaq } from "@/lib/blog/types";

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
    authorName: String(formData.get("authorName") ?? "Équipe Veyala"),
    authorRole: String(formData.get("authorRole") ?? "Experts CV, ATS & candidature"),
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
  const existing = await db.blogPost.findUnique({ where: { slug }, select: { id: true } });
  if (existing && existing.id !== excludeId) {
    return fail("Ce slug est déjà utilisé.", { slug: ["Slug déjà pris"] });
  }
  return null;
}

export async function createBlogPost(
  _prev: BlogActionState | null,
  formData: FormData
): Promise<BlogActionState> {
  await requireAdmin();
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return fail(
      "Formulaire invalide.",
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    );
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
      message: `Score SEO ${seo.score}/100 (minimum ${PUBLISH_MIN_SCORE} pour publier).`,
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
  redirect(`/admin/blog/${post.id}/edit?saved=1`);
}

export async function updateBlogPost(
  _prev: BlogActionState | null,
  formData: FormData
): Promise<BlogActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return fail("Article introuvable.");

  const parsed = parseInput(formData);
  if (!parsed.success) {
    return fail(
      "Formulaire invalide.",
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    );
  }

  const conflict = await assertUniqueSlug(parsed.data.slug, id);
  if (conflict) return conflict;

  const existing = await db.blogPost.findUnique({ where: { id } });
  if (!existing) return fail("Article introuvable.");

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
      message: `Score SEO ${seo.score}/100 (minimum ${PUBLISH_MIN_SCORE} pour publier).`,
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
      intent === "publish"
        ? `Publié (SEO ${seo.score}/100).`
        : `Brouillon enregistré (SEO ${seo.score}/100).`,
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
  redirect("/admin/blog");
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
