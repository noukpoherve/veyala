import type { Metadata } from "next";
import { ErrorScreen } from "@/components/errors/error-screen";

export const metadata: Metadata = {
  title: "Page introuvable",
};

export default function NotFound() {
  return (
    <ErrorScreen
      kind="not-found"
      primaryHref="/"
      primaryLabel="Retour à l'accueil"
      supportHref="/contact"
    />
  );
}
