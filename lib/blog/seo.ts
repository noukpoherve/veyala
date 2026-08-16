import type { BlogPost } from "@/lib/blog/types";
import { siteUrl } from "@/lib/utils";

export function blogPostingJsonLd(post: BlogPost) {
  const base = siteUrl();
  const url = `${base}/blog/${post.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: "fr-FR",
    keywords: post.keywords.join(", "),
    articleSection: post.category,
    wordCount: estimateWordCount(post),
    author: {
      "@type": "Organization",
      name: post.author.name,
      url: base,
    },
    publisher: {
      "@type": "Organization",
      name: "Veyala",
      url: base,
      logo: {
        "@type": "ImageObject",
        url: `${base}/brand/veyala-mark.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    image: [`${base}/blog/${post.slug}/opengraph-image`],
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

export function blogBreadcrumbJsonLd(post: BlogPost) {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: base,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${base}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${base}/blog/${post.slug}`,
      },
    ],
  };
}

export function blogIndexJsonLd(posts: BlogPost[]) {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog Veyala : CV, ATS, emploi et lettres de motivation",
    description:
      "Guides pratiques pour optimiser votre CV ATS, adapter votre candidature à chaque offre d'emploi et rédiger des lettres de motivation efficaces.",
    url: `${base}/blog`,
    inLanguage: "fr-FR",
    publisher: {
      "@type": "Organization",
      name: "Veyala",
      url: base,
    },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${base}/blog/${post.slug}`,
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
