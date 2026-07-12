import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * PKCE callback for every Supabase auth email link (signup confirmation,
 * password recovery, admin invitation): exchanges the one-time code for a
 * session, then forwards to `next` (sanitized to a local path).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const rawNext = url.searchParams.get("next") ?? "/dashboard";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  if (code) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL("/login?error=confirmation", url.origin));
    return NextResponse.redirect(new URL(next, url.origin));
  }

  // No code: implicit-flow links (admin invitations) carry the tokens in the
  // URL fragment, which never reaches the server. The fragment survives this
  // redirect; the client bridge on the target page stores the session.
  return NextResponse.redirect(new URL(next, url.origin));
}
