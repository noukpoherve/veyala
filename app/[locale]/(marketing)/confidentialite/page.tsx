import type { Metadata } from "next";
import { AnalyticsPreferences } from "@/components/analytics/analytics";
import { LegalArticle } from "@/components/marketing/legal-article";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { localizePath } from "@/i18n/path";

const UPDATED_AT = "2026-08-31";

export function generateMetadata(): Metadata {
  const locale = getLocale();
  return {
    title: getMessages(locale).seo.privacyTitle,
    alternates: {
      canonical: localizePath("/confidentialite", locale),
      languages: {
        "fr-FR": "/confidentialite",
        en: "/en/confidentialite",
        "x-default": "/confidentialite",
      },
    },
  };
}

export default function ConfidentialitePage() {
  const m = getMessages(getLocale());
  const t = m.content.privacy;

  return (
    <LegalArticle title={m.legal.privacyTitle} updated={UPDATED_AT} binding>
      <section>
        <h2>{t.collectedTitle}</h2>
        <ul>
          {t.collectedItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2>{t.purposesTitle}</h2>
        <p>{t.purposesBody}</p>
      </section>
      <section>
        <h2>{t.processorsTitle}</h2>
        <p>{t.processorsBody}</p>
      </section>
      <section>
        <h2>{t.cookiesTitle}</h2>
        <p>{t.cookiesBody}</p>
        <div className="mt-3">
          <AnalyticsPreferences />
        </div>
      </section>
      <section>
        <h2>{t.retentionTitle}</h2>
        <p>{t.retentionBody}</p>
      </section>
      <section>
        <h2>{t.rightsTitle}</h2>
        <p>{t.rightsBody}</p>
      </section>
    </LegalArticle>
  );
}
