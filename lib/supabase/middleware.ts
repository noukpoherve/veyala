import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase session on the given response (must already be the
 * rewrite/next response so locale headers survive cookie refresh).
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse
): Promise<{ response: NextResponse; user: User | null }> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
