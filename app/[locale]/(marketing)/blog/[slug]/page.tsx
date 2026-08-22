import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { ArticleBody } from "@/components/blog/article-body";
import { blogCategoryLabel, PostCard } from "@/components/blog/post-card";
import { ShareButtons } from "@/components/blog/share-buttons";
import {
  getPublishedPostBySlug,
  getPublishedSlugs,
  getRelatedPublishedPosts,
} from "@/lib/blog/queries";
import { blogBreadcrumbJsonLd, blogFaqJsonLd, blogPostingJsonLd } from "@/lib/blog/seo";
import { siteUrl } from "@/lib/utils";
import { formatDate } from "@/i18n/format";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { Link } from "@/i18n/navigation";
import { localizePath } from "@/i18n/path";

export const revalidate = 60;
/** Allow on-demand rendering when build had no DB to pre-render slugs. */
export const dynamicParams = true;

type PageProps = {
  params: { slug: string };
};

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = getLocale();
  const m = getMessages(locale);
  const post = await getPublishedPostBySlug(params.slug);
  if (!post) {
    return { title: m.content.blog.notFoundTitle, robots: { index: false, follow: false } };
  }

  const path = `/blog/${post.slug}`;
  const url = localizePath(path, locale);
  const category = blogCategoryLabel(m, post.category);
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: post.author.name }],
    category,
    alternates: {
      canonical: url,
      languages: { "fr-FR": path, en: `/en${path}`, "x-default": path },
    },
    openGraph: {
      type: "article",
      locale: locale === "en" ? "en_US" : "fr_FR",
      url,
      siteName: "Veyala",
      title: post.title,
      description: post.description,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      tags: post.tags,
      section: category,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const locale = getLocale();
  const m = getMessages(locale);
  const t = m.content.blog;
  const post = await getPublishedPostBySlug(params.slug);
  if (!post) notFound();

  const related = await getRelatedPublishedPosts(post);
  const absoluteUrl = `${siteUrl()}${localizePath(`/blog/${post.slug}`, locale)}`;
  const category = blogCategoryLabel(m, post.category);
  const schemas = [
    blogPostingJsonLd(post, locale),
    blogBreadcrumbJsonLd(post, locale),
    blogFaqJsonLd(post),
  ].filter(Boolean);

  return (
    <main>
      {schemas.map((schema) => {
        const type = (schema as { "@type"?: string })["@type"] ?? "schema";
        return (
          <script
            key={type}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        );
      })}

      <article>
        <header className="border-b border-slate-100 bg-aurora relative overflow-hidden">
          <div
            aria-hidden
            className="orb -right-20 top-0 size-[380px]"
            style={{
              background: `radial-gradient(circle, ${post.accent}33 0%, transparent 70%)`,
            }}
          />
          <div className="relative mx-auto max-w-3xl px-6 pb-12 pt-10 md:pb-14 md:pt-14">
            <nav aria-label={t.breadcrumb} className="mb-8">
              <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <li>
                  <Link href="/" className="hover:text-blue-700">
                    {t.home}
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link href="/blog" className="hover:text-blue-700">
                    {m.blog.title}
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li className="truncate text-slate-700">{category}</li>
              </ol>
            </nav>

            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
              {category}
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 md:text-5xl md:leading-[1.1]">
              {post.title}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">{post.excerpt}</p>

            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
              <span className="font-medium text-slate-700">{post.author.name}</span>
              <span aria-hidden>·</span>
              <time dateTime={post.publishedAt}>
                {t.publishedOn(formatDate(post.publishedAt, locale))}
              </time>
              {post.updatedAt !== post.publishedAt ? (
                <>
                  <span aria-hidden>·</span>
                  <time dateTime={post.updatedAt}>
                    {t.updatedOn(formatDate(post.updatedAt, locale))}
                  </time>
                </>
              ) : null}
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden />
                {m.blog.minutes(post.readingTimeMin)}
              </span>
            </div>

            <div className="mt-8">
              <ShareButtons url={absoluteUrl} title={post.title} summary={post.excerpt} />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-6 py-12 md:py-14">
          <ArticleBody blocks={post.body} />

          {post.faq?.length ? (
            <section className="mt-14 border-t border-slate-100 pt-10">
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                {t.faqTitle}
              </h2>
              <div className="mt-6 space-y-4">
                {post.faq.map((item) => (
                  <details
                    key={item.question}
                    className="group rounded-panel border border-slate-200 bg-white px-5 py-4 open:border-blue-200 open:bg-blue-50/40"
                  >
                    <summary className="cursor-pointer list-none font-semibold text-slate-900 marker:content-none [&::-webkit-details-marker]:hidden">
                      {item.question}
                    </summary>
                    <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-blue-700"
            >
              <ArrowLeft className="size-4" aria-hidden />
              {t.backToBlog}
            </Link>
            <ShareButtons url={absoluteUrl} title={post.title} summary={post.excerpt} />
          </div>

          <ul className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
              >
                #{tag}
              </li>
            ))}
          </ul>
        </div>
      </article>

      {related.length ? (
        <section className="border-t border-slate-100 bg-slate-50/60">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              {m.blog.related}
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {related.map((item) => (
                <PostCard key={item.slug} post={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
