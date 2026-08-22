import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";

const PRIVATE_PATHS = [
  "/api/",
  "/admin",
  "/dashboard",
  "/generate",
  "/cv/",
  "/profile",
  "/billing",
  "/support",
  "/templates",
  "/erreur",
];

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          ...PRIVATE_PATHS,
          ...PRIVATE_PATHS.map((path) => `/en${path}`),
          // `/fr/...` resolves as an internal alias of the unprefixed French
          // URLs; keeping it out of the index avoids duplicate content.
          "/fr/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
