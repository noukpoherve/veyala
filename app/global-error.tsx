"use client";

import { useEffect } from "react";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import { ErrorScreen } from "@/components/errors/error-screen";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });

/**
 * Root layout failures — must define its own <html>/<body>.
 * Same calm branded page as segment errors (no red dump).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="fr" className={`${inter.variable} ${bricolage.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <ErrorScreen
          kind="server"
          detail={error.digest}
          onRetry={reset}
          primaryHref="/"
          primaryLabel="Retour à l'accueil"
          supportHref="/contact"
        />
      </body>
    </html>
  );
}
