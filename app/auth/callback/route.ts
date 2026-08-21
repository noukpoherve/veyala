import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { persistUserLocale } from "@/lib/persist-locale";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/utils";
import { getLocaleFromRequest } from "@/i18n/get-locale";
import { localizeHref } from "@/i18n/path";
import { localeFromPathname } from "@/i18n/path";

/**
 * PKCE callback for every Supabase auth email link (signup confirmation,
 * password recovery, admin invitation): exchanges the one-time code for a
 * session, then forwards to `next` (sanitized to a local path).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const locale = getLocaleFromRequest(req);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next") ?? "/dashboard";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? localizeHref(rawNext, localeFromPathname(rawNext) === "en" ? "en" : locale)
      : localizeHref("/dashboard", locale);

  if (code) {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(localizeHref("/login?error=confirmation", locale), url.origin)
      );
    }

    const email = normalizeEmail(data.user?.email);
    if (email) {
      const profile = await db.user.findUnique({
        where: { email },
        select: { archivedAt: true },
      });
      if (profile?.archivedAt) {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          new URL(localizeHref("/login?error=archived", locale), url.origin)
        );
      }
    }

    if (data.user) {
      await persistUserLocale(supabase, locale);
    }

    return NextResponse.redirect(new URL(next, url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
