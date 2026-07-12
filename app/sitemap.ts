import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return ["", "/mentions-legales", "/cgu", "/confidentialite", "/contact", "/login"].map(
    (path) => ({
      url: `${base}${path}`,
      changeFrequency: path === "" ? "weekly" : "yearly",
      priority: path === "" ? 1 : 0.3,
    })
  );
}
