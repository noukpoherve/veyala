"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Admin invitation links use GoTrue's implicit flow: the session tokens
 * arrive in the URL fragment, which the server never sees. This bridge stores
 * them as auth cookies, then reloads so the server-rendered form takes over.
 */
export function HashSessionBridge() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token) {
      window.location.replace("/forgot-password");
      return;
    }
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      window.location.replace(error ? "/forgot-password" : "/reset-password");
    });
  }, []);

  return null;
}
