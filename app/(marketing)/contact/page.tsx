import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { LegalArticle } from "@/components/marketing/legal-article";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <LegalArticle title="Contact" updated="9 juillet 2026">
      <section>
        <p>
          Une question, un problème de génération ou une demande liée à vos données ?
          Écrivez-nous, nous répondons sous 48 h ouvrées.
        </p>
        <p className="mt-4">
          <a
            href="mailto:contact@cvgen.example"
            className="inline-flex items-center gap-2 font-medium text-primary underline"
          >
            <Mail className="size-4" aria-hidden />
            contact@cvgen.example
          </a>
        </p>
      </section>
    </LegalArticle>
  );
}
