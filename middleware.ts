import { LOCALE_COOKIE, LOCALE_HEADER, type Locale } from "@/i18n/config";
import { hasFrenchPrefix, isUnlocalizedPath, localizePath, resolveRoute } from "@/i18n/path";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { updateSession } from "@/lib/supabase/middleware";

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

const LOCALE_COOKIE_BASE = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
};

function localeCookieOptions(req: NextRequest) {
  const https = req.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production";
  return { ...LOCALE_COOKIE_BASE, secure: https };
}

function hasSupabaseSession(req: NextRequest): boolean {
  return req.cookies.getAll().some(({ name }) => name.startsWith("sb-") && name.includes("auth-"));
}

function isRscNavigation(req: NextRequest): boolean {
  return (
    req.headers.get("rsc") === "1" ||
    req.headers.has("next-router-prefetch") ||
    req.headers.has("next-router-state-tree")
  );
}

/**
 * Maps public URLs onto the `app/[locale]` tree: French stays unprefixed and is
 * rewritten to `/fr/...`, English is already `/en/...` and passes through. The
 * locale therefore lives in the route tree, so FR and EN are distinct entries in
 * the client router cache and switching languages is a real navigation.
 */
export default async function middleware(req: NextRequest) {
  const { locale, path, internal, prefixed } = resolveRoute(req.nextUrl.pathname);
  const cookieOpts = localeCookieOptions(req);

  // Typed or shared `/fr/...` URLs must never stay in the address bar.
  // RSC flights to `/fr/...` (from locale-aware Links) must not redirect,
  // or language switching would pay for an extra round-trip.
  if (hasFrenchPrefix(req.nextUrl.pathname) && !isRscNavigation(req)) {
    const url = req.nextUrl.clone();
    url.pathname = path;
    const redirect = NextResponse.redirect(url);
    redirect.cookies.set(LOCALE_COOKIE, locale, cookieOpts);
    return redirect;
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(LOCALE_HEADER, locale);

  const unlocalized = isUnlocalizedPath(path);

  let response: NextResponse;
  if (unlocalized && prefixed) {
    // `/en/auth/callback` → rewrite to `/auth/callback` (lives outside `[locale]`).
    // Locale is preserved via cookie + LOCALE_HEADER for the route handler.
    const url = req.nextUrl.clone();
    url.pathname = path;
    response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  } else if (prefixed || unlocalized) {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  } else {
    const url = req.nextUrl.clone();
    url.pathname = internal;
    response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  response.cookies.set(LOCALE_COOKIE, locale, cookieOpts);

  const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

  // Anonymous visitors have no session to refresh, so skip the Supabase
  // round-trip entirely instead of paying for it on every navigation.
  if (!hasSupabaseSession(req)) {
    if (!isProtected) return response;
    return redirectToLogin(req, path, locale);
  }

  const { response: authed, user } = await updateSession(req, response);
  Sentry.setUser(user?.id ? { id: user.id } : null);

  if (isProtected && !user) return redirectToLogin(req, path, locale);

  return authed;
}

function redirectToLogin(req: NextRequest, path: string, locale: Locale): NextResponse {
  const loginUrl = new URL(localizePath("/login", locale), req.nextUrl.origin);
  loginUrl.searchParams.set("callbackUrl", localizePath(path, locale));
  const redirect = NextResponse.redirect(loginUrl);
  redirect.cookies.set(LOCALE_COOKIE, locale, localeCookieOptions(req));
  return redirect;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|monitoring|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|svg|ico|webmanifest)$).*)",
  ],
};
