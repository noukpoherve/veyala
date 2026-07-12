import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} manquante : configurez l'environnement Supabase.`);
  return value;
}

/**
 * Request-scoped Supabase client (anon key + auth cookies). Safe in server
 * components, server actions and route handlers; cookie writes are silently
 * skipped in contexts that forbid them (the middleware refreshes tokens).
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server components cannot write cookies; middleware handles refresh.
          }
        },
      },
    }
  );
}

/**
 * Service-role client for GoTrue admin operations (invitations, user deletion,
 * migration). Never expose to the client; bypasses RLS.
 */
export function createSupabaseAdminClient() {
  return createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
