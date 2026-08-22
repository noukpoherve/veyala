import type { Metadata } from "next";
import { LegalArticle } from "@/components/marketing/legal-article";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { localizePath } from "@/i18n/path";

const UPDATED_AT = "2026-07-09";

export function generateMetadata(): Metadata {
  const locale = getLocale();
  return {
    title: getMessages(locale).seo.legalTitle,
    alternates: {
      canonical: localizePath("/mentions-legales", locale),
      languages: {
        "fr-FR": "/mentions-legales",
        en: "/en/mentions-legales",
        "x-default": "/mentions-legales",
      },
    },
  };
}

export default function MentionsLegalesPage() {
  const m = getMessages(getLocale());
  const t = m.content.legalNotice;

  return (
    <LegalArticle title={m.legal.mentionsTitle} updated={UPDATED_AT} binding>
      <section>
        <h2>{t.publisherTitle}</h2>
        <p>{t.publisherBody}</p>
      </section>
      <section>
        <h2>{t.hostingTitle}</h2>
        <p>{t.hostingBody}</p>
      </section>
      <section>
        <h2>{t.ipTitle}</h2>
        <p>{t.ipBody}</p>
      </section>
    </LegalArticle>
  );
}
