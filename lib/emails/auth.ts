import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { localizePath } from "@/i18n/path";
import { renderTransactionalEmail } from "@/lib/emails/layout";

/** GoTrue placeholders — must not be HTML-escaped beyond what layout already does (braces are safe). */
const SITE = "{{ .SiteURL }}";
const CONFIRM = "{{ .ConfirmationURL }}";

export type AuthEmailId =
  | "confirmation"
  | "recovery"
  | "invite"
  | "email_change"
  | "password_changed";

const FILENAMES: Record<AuthEmailId, string> = {
  confirmation: "confirmation.html",
  recovery: "recovery.html",
  invite: "invite.html",
  email_change: "email-change.html",
  password_changed: "password-changed.html",
};

const COPY_KEY: Record<
  AuthEmailId,
  "confirmation" | "recovery" | "invite" | "emailChange" | "passwordChanged"
> = {
  confirmation: "confirmation",
  recovery: "recovery",
  invite: "invite",
  email_change: "emailChange",
  password_changed: "passwordChanged",
};

export type RenderAuthEmailOptions = {
  locale?: Locale;
  siteUrl?: string;
  confirmationUrl?: string;
  newEmail?: string;
};

function copyFor(id: AuthEmailId, locale: Locale) {
  return getMessages(locale).emails[COPY_KEY[id]];
}

export function authEmailSubject(id: AuthEmailId, locale: Locale = DEFAULT_LOCALE): string {
  return copyFor(id, locale).subject;
}

export function renderAuthEmail(
  id: AuthEmailId,
  options: RenderAuthEmailOptions = {}
): { html: string; text: string; subject: string } {
  const locale = options.locale ?? DEFAULT_LOCALE;
  const copy = copyFor(id, locale);
  const siteUrl = options.siteUrl ?? SITE;
  const confirmationUrl = options.confirmationUrl ?? CONFIRM;
  const loginHref = `${siteUrl.replace(/\/+$/, "")}${localizePath("/login", locale)}`;
  const ctaHref = id === "password_changed" ? loginHref : confirmationUrl;
  const intro =
    id === "email_change" && options.newEmail
      ? copy.intro.replaceAll("{{ .NewEmail }}", options.newEmail)
      : copy.intro;

  const rendered = renderTransactionalEmail({
    locale,
    siteUrl,
    preheader: copy.preheader,
    title: copy.title,
    intro,
    cta: copy.cta ? { href: ctaHref, label: copy.cta } : undefined,
    ctaUrl: id === "password_changed" ? undefined : ctaHref,
    note: copy.note,
  });
  return { ...rendered, subject: copy.subject };
}

/** Filenames → HTML, for writing `supabase/templates/*.html` (French fallback). */
export function authEmailFiles(): Record<string, string> {
  return Object.fromEntries(
    (Object.keys(FILENAMES) as AuthEmailId[]).map((id) => {
      const { html } = renderAuthEmail(id, { locale: "fr" });
      return [FILENAMES[id], html];
    })
  );
}
