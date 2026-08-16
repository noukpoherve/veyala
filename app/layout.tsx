import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { siteUrl } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });

const base = siteUrl();

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1527" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: {
    default: "Veyala — CV optimisés par IA, adaptés à chaque offre",
    template: "%s · Veyala",
  },
  description:
    "Importez votre CV, collez une offre d'emploi et recevez un CV sur mesure, optimisé ATS, exportable en Word et PDF.",
  applicationName: "Veyala",
  authors: [{ name: "Veyala" }],
  creator: "Veyala",
  keywords: ["CV", "lettre de motivation", "ATS", "IA", "candidature", "Campus France", "emploi"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: base,
    siteName: "Veyala",
    title: "Veyala — Votre candidature, augmentée par l'IA",
    description: "CV et lettres de motivation adaptés par IA. Export Word & PDF, compatible ATS.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Veyala — CV adaptés par IA",
    description: "Collez une offre, générez un CV ATS + lettre de motivation en quelques secondes.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.png", type: "image/png", sizes: "32x32" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("veyala:theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${bricolage.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
