import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const sora = Sora({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: {
    default: "CVGen — CV optimisés par IA, adaptés à chaque offre",
    template: "%s · CVGen",
  },
  description:
    "Importez votre CV, collez une offre d'emploi et recevez un CV sur mesure, optimisé ATS, exportable en Word et PDF.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${sora.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
