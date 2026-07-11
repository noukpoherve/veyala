import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return ["", "/mentions-legales", "/cgu", "/confidentialite", "/contact", "/login"].map(
    (path) => ({
      url: `${base}${path}`,
      changeFrequency: path === "" ? "weekly" : "yearly",
      priority: path === "" ? 1 : 0.3,
    })
  );
}
