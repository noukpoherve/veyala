import type { BlogPost } from "@/lib/blog/types";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { localizePath } from "@/i18n/path";
import { siteUrl } from "@/lib/utils";

function absolute(path: string, locale: Locale): string {
  return `${siteUrl()}${localizePath(path, locale)}`;
}

export function blogPostingJsonLd(post: BlogPost, locale: Locale = "fr") {
  const url = absolute(`/blog/${post.slug}`, locale);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: locale === "en" ? "en-US" : "fr-FR",
    keywords: post.keywords.join(", "),
    articleSection: post.category,
    wordCount: estimateWordCount(post),
    author: {
      "@type": "Organization",
      name: post.author.name,
      url: siteUrl(),
    },
    publisher: {
      "@type": "Organization",
      name: "Veyala",
      url: siteUrl(),
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl()}/brand/veyala-mark.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    image: [`${absolute(`/blog/${post.slug}`, locale)}/opengraph-image`],
    url,
  };
}

export function blogFaqJsonLd(post: BlogPost) {
  if (!post.faq?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function blogBreadcrumbJsonLd(post: BlogPost, locale: Locale = "fr") {
  const m = getMessages(locale);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: m.content.blog.home,
        item: absolute("/", locale),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: m.blog.title,
        item: absolute("/blog", locale),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: absolute(`/blog/${post.slug}`, locale),
      },
    ],
  };
}

export function blogIndexJsonLd(posts: BlogPost[], locale: Locale = "fr") {
  const t = getMessages(locale).content.blog;
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: t.feedTitle,
    description: t.feedDescription,
    url: absolute("/blog", locale),
    inLanguage: t.feedLanguage,
    publisher: {
      "@type": "Organization",
      name: "Veyala",
      url: base,
    },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: absolute(`/blog/${post.slug}`, locale),
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      description: post.description,
    })),
  };
}

function estimateWordCount(post: BlogPost): number {
  const text = post.body
    .map((block) => {
      if ("text" in block) return block.text;
      if ("items" in block) return block.items.join(" ");
      return "";
    })
    .join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}
