import { ErrorScreen } from "@/components/errors/error-screen";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

/** 404 inside the authenticated app shell. */
export default function AppNotFound() {
  const m = getMessages(getLocale());

  return (
    <ErrorScreen
      messages={m}
      kind="not-found"
      title={m.errors.appNotFoundTitle}
      description={m.errors.appNotFoundBody}
      primaryHref="/dashboard"
      primaryLabel={m.nav.dashboard}
      supportHref="/support"
    />
  );
}
