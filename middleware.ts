import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { updateSession } from "@/lib/supabase/middleware";
import { LOCALE_COOKIE, LOCALE_HEADER, type Locale } from "@/i18n/config";
import { localeFromPathname, localizePath, stripLocalePrefix } from "@/i18n/path";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/generate",
  "/campus-france",
  "/cv",
  "/profile",
  "/templates",
  "/billing",
  "/admin",
];

const LOCALE_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
};

function withLocaleHeaders(req: NextRequest, locale: Locale): Headers {
  const headers = new Headers(req.headers);
  headers.set(LOCALE_HEADER, locale);
  return headers;
}

/**
 * Locale rewrite (FR unprefixed, EN `/en/...`) then Supabase session refresh.
 * Auth gates use the stripped pathname so `/en/dashboard` stays protected.
 */
export default async function middleware(req: NextRequest) {
  const locale = localeFromPathname(req.nextUrl.pathname);
  const internalPath = stripLocalePrefix(req.nextUrl.pathname);
  const requestHeaders = withLocaleHeaders(req, locale);

  let response: NextResponse;
  if (locale === "en") {
    const url = req.nextUrl.clone();
    url.pathname = internalPath;
    response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }

  response.cookies.set(LOCALE_COOKIE, locale, LOCALE_COOKIE_OPTIONS);

  const { response: authed, user } = await updateSession(req, response);
  Sentry.setUser(user?.id ? { id: user.id } : null);

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => internalPath === p || internalPath.startsWith(`${p}/`)
  );

  if (isProtected && !user) {
    const loginUrl = new URL(localizePath("/login", locale), req.nextUrl.origin);
    const callback = localizePath(internalPath, locale);
    loginUrl.searchParams.set("callbackUrl", callback);
    const redirect = NextResponse.redirect(loginUrl);
    redirect.cookies.set(LOCALE_COOKIE, locale, LOCALE_COOKIE_OPTIONS);
    return redirect;
  }

  return authed;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|monitoring|.*\\.(?:png|jpg|svg|ico)$).*)",
  ],
};
