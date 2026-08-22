import type { Metadata } from "next";
import { ErrorScreen } from "@/components/errors/error-screen";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).seo.notFoundTitle };
}

export default function NotFound() {
  const m = getMessages(getLocale());

  return (
    <ErrorScreen
      messages={m}
      kind="not-found"
      primaryHref="/"
      primaryLabel={m.common.backHome}
      supportHref="/contact"
    />
  );
}
