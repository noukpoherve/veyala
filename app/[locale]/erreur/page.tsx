import type { Metadata } from "next";
import { ErrorScreen, type ErrorScreenKind } from "@/components/errors/error-screen";
import { getLocale } from "@/i18n/get-locale";
import { getMessages, type Messages } from "@/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).seo.errorTitle };
}

const REASON_KINDS: Record<keyof Messages["errors"]["reasons"], ErrorScreenKind> = {
  regenerate: "generic",
  analyze: "generic",
  generate: "generic",
  payment: "unavailable",
};

function isReason(value: string): value is keyof typeof REASON_KINDS {
  return value in REASON_KINDS;
}

/**
 * Soft failure landing (no red dump): used when an action fails and we redirect
 * instead of rendering an inline destructive banner.
 */
export default function ErreurPage({
  searchParams,
}: {
  searchParams: { reason?: string; back?: string };
}) {
  const m = getMessages(getLocale());
  const reason = searchParams.reason ?? "";
  const preset = isReason(reason) ? m.errors.reasons[reason] : null;
  const back = safeInternalPath(searchParams.back) ?? "/dashboard";

  return (
    <ErrorScreen
      messages={m}
      kind={isReason(reason) ? REASON_KINDS[reason] : "generic"}
      title={preset?.title}
      description={preset?.body}
      primaryHref={back}
      primaryLabel={preset?.back ?? m.common.continue}
      supportHref="/support"
    />
  );
}

function safeInternalPath(value: string | undefined): string | null {
  if (!value?.startsWith("/") || value.startsWith("//")) return null;
  return value;
}
