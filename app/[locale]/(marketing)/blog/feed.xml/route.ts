import { getPublishedPosts } from "@/lib/blog/queries";
import { siteUrl } from "@/lib/utils";
import { getLocaleFromRequest } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { localizePath } from "@/i18n/path";

export const revalidate = 60;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET(req: Request) {
  const locale = getLocaleFromRequest(req);
  const t = getMessages(locale).content.blog;
  const base = siteUrl();
  const blogUrl = `${base}${localizePath("/blog", locale)}`;
  const posts = await getPublishedPosts();

  const items = posts
    .map((post) => {
      const link = `${blogUrl}/${post.slug}`;
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
      <category>${escapeXml(post.category)}</category>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(t.feedTitle)}</title>
    <link>${blogUrl}</link>
    <description>${escapeXml(t.feedDescription)}</description>
    <language>${t.feedLanguage}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${blogUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
