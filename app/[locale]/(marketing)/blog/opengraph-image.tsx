import { ImageResponse } from "next/og";
import { parseLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateImageMetadata({ params }: { params: { locale: string } }) {
  const t = getMessages(parseLocale(params.locale)).content.blog;
  return [{ id: "og", alt: t.metaTitle, size, contentType }];
}

export default function BlogOgImage({ params }: { params: { locale: string } }) {
  const t = getMessages(parseLocale(params.locale)).content.blog;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px",
        background: "linear-gradient(145deg, #2563EB 0%, #1D4ED8 42%, #0B1527 100%)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}
      >
        Veyala
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 920 }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#BFDBFE",
          }}
        >
          {t.eyebrow}
        </div>
        <div
          style={{
            fontSize: 58,
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
          }}
        >
          {t.heading}
        </div>
        <div style={{ fontSize: 26, color: "#DBEAFE", lineHeight: 1.35, maxWidth: 860 }}>
          {t.intro}
        </div>
      </div>
    </div>,
    { ...size }
  );
}
