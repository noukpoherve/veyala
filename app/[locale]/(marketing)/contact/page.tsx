import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { LegalArticle } from "@/components/marketing/legal-article";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { localizePath } from "@/i18n/path";

const UPDATED_AT = "2026-07-09";

export function generateMetadata(): Metadata {
  const locale = getLocale();
  return {
    title: getMessages(locale).seo.contactTitle,
    alternates: {
      canonical: localizePath("/contact", locale),
      languages: { "fr-FR": "/contact", en: "/en/contact", "x-default": "/contact" },
    },
  };
}

export default function ContactPage() {
  const m = getMessages(getLocale());

  return (
    <LegalArticle title={m.seo.contactTitle} updated={UPDATED_AT}>
      <section>
        <p>{m.content.contact.body}</p>
        <p className="mt-4">
          <a
            href="mailto:contact@cvgen.example"
            className="inline-flex items-center gap-2 font-medium text-primary underline"
          >
            <Mail className="size-4" aria-hidden />
            contact@velaya.fr
          </a>
        </p>
      </section>
    </LegalArticle>
  );
}
