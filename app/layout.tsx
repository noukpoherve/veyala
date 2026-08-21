import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { siteUrl } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { localizePath } from "@/i18n/path";
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

export async function generateMetadata(): Promise<Metadata> {
  const locale = getLocale();
  const m = getMessages(locale);
  const canonical = localizePath("/", locale);

  return {
    metadataBase: new URL(base),
    title: {
      default: m.seo.defaultTitle,
      template: m.seo.titleTemplate,
    },
    description: m.seo.defaultDescription,
    applicationName: "Veyala",
    authors: [{ name: "Veyala" }],
    creator: "Veyala",
    keywords: [...m.seo.keywords],
    alternates: {
      canonical,
      languages: {
        "fr-FR": "/",
        en: "/en",
        "x-default": "/",
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_US" : "fr_FR",
      url: canonical,
      siteName: "Veyala",
      title: m.seo.ogTitle,
      description: m.seo.ogDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: m.seo.twitterTitle,
      description: m.seo.twitterDescription,
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
}

const themeInitScript = `(function(){try{var t=localStorage.getItem("veyala:theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();

  return (
    <html
      lang={locale === "en" ? "en" : "fr"}
      className={`${inter.variable} ${bricolage.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen font-sans">
        <LocaleProvider locale={locale}>
          {children}
          <Toaster />
        </LocaleProvider>
      </body>
    </html>
  );
}
