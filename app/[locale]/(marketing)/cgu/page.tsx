import type { Metadata } from "next";
import { LegalArticle } from "@/components/marketing/legal-article";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { localizePath } from "@/i18n/path";

const UPDATED_AT = "2026-07-09";

export function generateMetadata(): Metadata {
  const locale = getLocale();
  return {
    title: getMessages(locale).seo.cguTitle,
    alternates: {
      canonical: localizePath("/cgu", locale),
      languages: { "fr-FR": "/cgu", en: "/en/cgu", "x-default": "/cgu" },
    },
  };
}

export default function CguPage() {
  const m = getMessages(getLocale());
  const t = m.content.cgu;

  return (
    <LegalArticle title={m.legal.cguTitle} updated={UPDATED_AT} binding>
      <section>
        <h2>{t.purposeTitle}</h2>
        <p>{t.purposeBody}</p>
      </section>
      <section>
        <h2>{t.accountTitle}</h2>
        <ul>
          {t.accountItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2>{t.generatedTitle}</h2>
        <p>{t.generatedBody}</p>
      </section>
      <section>
        <h2>{t.acceptableUseTitle}</h2>
        <p>{t.acceptableUseBody}</p>
      </section>
      <section>
        <h2>{t.paymentsTitle}</h2>
        <p>{t.paymentsBody}</p>
      </section>
      <section>
        <h2>{t.terminationTitle}</h2>
        <p>{t.terminationBody}</p>
      </section>
    </LegalArticle>
  );
}
