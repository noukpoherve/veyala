import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/blog/queries";
import { siteUrl } from "@/lib/utils";

/** Refresh blog URLs after deploy without requiring DB at build time. */
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const pages: {
    path: string;
    changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
    priority: number;
    lastModified?: Date;
  }[] = [
    { path: "", changeFrequency: "weekly", priority: 1 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.9 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
    { path: "/login", changeFrequency: "monthly", priority: 0.5 },
    { path: "/register", changeFrequency: "monthly", priority: 0.5 },
    { path: "/cgu", changeFrequency: "yearly", priority: 0.3 },
    { path: "/confidentialite", changeFrequency: "yearly", priority: 0.3 },
    { path: "/mentions-legales", changeFrequency: "yearly", priority: 0.3 },
  ];

  const staticEntries = pages.flatMap(({ path, changeFrequency, priority, lastModified }) => {
    const fr = `${base}${path || ""}`;
    const enPath = path ? `/en${path}` : "/en";
    const en = `${base}${enPath}`;
    const modified = lastModified ?? new Date();
    const languages = { "fr-FR": fr, en, "x-default": fr };
    return [
      { url: fr, lastModified: modified, changeFrequency, priority, alternates: { languages } },
      {
        url: en,
        lastModified: modified,
        changeFrequency,
        priority: Math.max(priority - 0.1, 0.2),
        alternates: { languages },
      },
    ];
  });

  const posts = await getPublishedPosts();
  const blogEntries = posts.flatMap((post) => {
    const fr = `${base}/blog/${post.slug}`;
    const en = `${base}/en/blog/${post.slug}`;
    const lastModified = new Date(post.updatedAt);
    return [
      {
        url: fr,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.8,
        alternates: { languages: { "fr-FR": fr, en, "x-default": fr } },
      },
      {
        url: en,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: 0.7,
        alternates: { languages: { "fr-FR": fr, en, "x-default": fr } },
      },
    ];
  });

  return [...staticEntries, ...blogEntries];
}
