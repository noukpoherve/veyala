import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: {
    default: "Veyala — CV optimisés par IA, adaptés à chaque offre",
    template: "%s · Veyala",
  },
  description:
    "Importez votre CV, collez une offre d'emploi et recevez un CV sur mesure, optimisé ATS, exportable en Word et PDF.",
};

// Applies the saved theme before first paint to avoid a light/dark flash.
const themeInitScript = `(function(){try{var t=localStorage.getItem("veyala:theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${bricolage.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
