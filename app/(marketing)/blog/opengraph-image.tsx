import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Blog Veyala : CV, ATS et emploi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function BlogOgImage() {
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
          Blog
        </div>
        <div
          style={{
            fontSize: 58,
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
          }}
        >
          CV, ATS & emploi : candidater avec méthode
        </div>
        <div style={{ fontSize: 26, color: "#DBEAFE", lineHeight: 1.35, maxWidth: 860 }}>
          Guides pratiques pour optimiser votre CV, passer les filtres ATS et décrocher plus
          d&apos;entretiens.
        </div>
      </div>
    </div>,
    { ...size }
  );
}
