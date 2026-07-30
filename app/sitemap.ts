import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/blog/queries";
import { siteUrl } from "@/lib/utils";

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

  const staticEntries = pages.map(({ path, changeFrequency, priority, lastModified }) => ({
    url: `${base}${path}`,
    lastModified: lastModified ?? new Date(),
    changeFrequency,
    priority,
  }));

  const posts = await getPublishedPosts();
  const blogEntries = posts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...blogEntries];
}
