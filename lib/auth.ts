import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Role, User } from "@prisma/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { creditCredits } from "@/lib/credits";
import { normalizeEmail } from "@/lib/utils";

export const SIGNUP_BONUS_CREDITS = 2;

/**
 * OAuth providers surfaced in the UI. The provider itself must also be
 * enabled on the Supabase side (config.toml locally, dashboard in cloud) —
 * these flags only control the buttons, so keep both in sync.
 */
export const oauthProviderFlags = {
  google: process.env.NEXT_PUBLIC_AUTH_GOOGLE === "true",
  github: process.env.NEXT_PUBLIC_AUTH_GITHUB === "true",
} as const;

export type OAuthProvider = keyof typeof oauthProviderFlags;

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
  name: string | null;
  image: string | null;
};

export type Session = { user: SessionUser };

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map(normalizeEmail).filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && adminEmails().includes(normalizeEmail(email));
}

/** Role granted at profile creation: service-role metadata first, then env allow-list. */
function initialRole(supabaseUser: SupabaseUser, email: string): Role {
  // app_metadata is only writable with the service role key (admin invitations),
  // unlike user_metadata which any user can edit — never trust the latter.
  if (supabaseUser.app_metadata?.role === "ADMIN") return "ADMIN";
  return isAdminEmail(email) ? "ADMIN" : "USER";
}

/**
 * Maps the Supabase Auth user to the app profile (Prisma User, cuid ids kept
 * for all FK relations). Links pre-migration accounts by email and creates
 * the profile + signup bonus on first sign-in.
 */
async function ensureUser(supabaseUser: SupabaseUser): Promise<User> {
  const byAuthId = await db.user.findUnique({ where: { authId: supabaseUser.id } });
  if (byAuthId) return byAuthId;

  const email = normalizeEmail(supabaseUser.email);
  if (!email) throw new Error("Compte Supabase sans email.");

  const byEmail = await db.user.findUnique({ where: { email } });
  if (byEmail) {
    return db.user.update({ where: { id: byEmail.id }, data: { authId: supabaseUser.id } });
  }

  try {
    const user = await db.user.create({
      data: {
        authId: supabaseUser.id,
        email,
        name: (supabaseUser.user_metadata?.full_name as string | undefined) ?? null,
        emailVerified: supabaseUser.email_confirmed_at
          ? new Date(supabaseUser.email_confirmed_at)
          : null,
        role: initialRole(supabaseUser, email),
      },
    });
    await creditCredits(user.id, SIGNUP_BONUS_CREDITS, "SIGNUP_BONUS");
    return user;
  } catch {
    // Unique-constraint race between two parallel first requests: one of them
    // created the row — fetch it instead of failing the request.
    const user = await db.user.findUnique({ where: { authId: supabaseUser.id } });
    if (user) return user;
    throw new Error("Création du profil utilisateur impossible.");
  }
}

/**
 * Session getter memoized per request (React cache). Same shape as before the
 * Supabase migration so no call site changes: user.id is the Prisma cuid.
 */
export const auth = cache(async (): Promise<Session | null> => {
  const supabase = createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();
  if (!supabaseUser) return null;

  const user = await ensureUser(supabaseUser);
  if (user.archivedAt) {
    await supabase.auth.signOut();
    return null;
  }
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      image: user.image,
    },
  };
});

/** Terminates the Supabase session then redirects. */
export async function signOut({ redirectTo = "/" }: { redirectTo?: string } = {}): Promise<never> {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(redirectTo);
}
