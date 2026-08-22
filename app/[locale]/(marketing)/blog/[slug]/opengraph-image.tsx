import { ImageResponse } from "next/og";
import { getPublishedPostBySlug } from "@/lib/blog/queries";
import type { BlogCategory } from "@/lib/blog/types";
import { parseLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 60;

const CATEGORY_KEYS: Record<BlogCategory, "CV" | "ATS" | "LETTRE" | "EMPLOI" | "ETUDES" | "IA"> = {
  cv: "CV",
  ats: "ATS",
  lettre: "LETTRE",
  emploi: "EMPLOI",
  etudes: "ETUDES",
  ia: "IA",
};

type Props = {
  params: { locale: string; slug: string };
};

export async function generateImageMetadata({ params }: Props) {
  const locale = parseLocale(params.locale);
  const post = await getPublishedPostBySlug(params.slug);
  const m = getMessages(locale);
  return [
    {
      id: "og",
      alt: post?.title ?? m.content.blog.notFoundTitle,
      size,
      contentType,
    },
  ];
}

export default async function ArticleOgImage({ params }: Props) {
  const locale = parseLocale(params.locale);
  const m = getMessages(locale);
  const post = await getPublishedPostBySlug(params.slug);
  const title = post?.title ?? m.content.blog.notFoundTitle;
  const category = post ? m.blog.categories[CATEGORY_KEYS[post.category]] : m.blog.title;
  const accent = post?.accent ?? "#2563EB";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px",
        background: `linear-gradient(145deg, ${accent} 0%, #0B1527 78%)`,
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>Veyala</div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#BFDBFE",
          }}
        >
          {category}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 980 }}>
        <div
          style={{
            fontSize: title.length > 70 ? 46 : 56,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </div>
        {post ? (
          <div style={{ fontSize: 24, color: "#DBEAFE", lineHeight: 1.35, maxWidth: 900 }}>
            {post.excerpt.length > 140 ? `${post.excerpt.slice(0, 137)}…` : post.excerpt}
          </div>
        ) : null}
      </div>
    </div>,
    { ...size }
  );
}
