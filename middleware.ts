import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
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

/**
 * Refreshes the Supabase session and gates authenticated areas. The /admin
 * role check is done in requireAdmin() (DB-backed), not here: the middleware
 * only guarantees authentication.
 */
export default async function middleware(req: NextRequest) {
  const { response, user } = await updateSession(req);

  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (isProtected && !user) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)"],
};
