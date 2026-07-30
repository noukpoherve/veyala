import { ImageResponse } from "next/og";
import { getPublishedPostBySlug } from "@/lib/blog/queries";
import { CATEGORY_LABELS } from "@/lib/blog/types";

export const alt = "Article Veyala";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 60;

type Props = {
  params: { slug: string };
};

export default async function ArticleOgImage({ params }: Props) {
  const post = await getPublishedPostBySlug(params.slug);
  const title = post?.title ?? "Article Veyala";
  const category = post ? CATEGORY_LABELS[post.category] : "Blog";
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
