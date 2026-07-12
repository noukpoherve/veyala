import { cache } from "react";
import NextAuth from "next-auth";
import { compare } from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";
import { creditCredits } from "@/lib/credits";
import { normalizeEmail } from "@/lib/utils";
import { consumeSigninToken } from "@/lib/verification";

export const SIGNUP_BONUS_CREDITS = 2;

/**
 * Which optional sign-in methods are configured. Single source of truth:
 * both the provider registration below and the login page UI read these flags.
 */
export const authProviderFlags = {
  google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  magicLink: !!(process.env.EMAIL_SERVER && process.env.EMAIL_FROM),
  devLogin: process.env.NODE_ENV !== "production",
} as const;

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && adminEmails().includes(email.toLowerCase());
}

const providers: Provider[] = [];

if (authProviderFlags.google) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Low risk: Google only asserts verified emails, and password accounts
      // must pass OTP verification before they can sign in.
      allowDangerousEmailAccountLinking: true,
    })
  );
}

if (authProviderFlags.magicLink) {
  providers.push(
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    })
  );
}

// Classic email + password sign-in (accounts created via /register).
providers.push(
  Credentials({
    id: "credentials",
    name: "Email et mot de passe",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Mot de passe", type: "password" },
    },
    async authorize(credentials) {
      const email = normalizeEmail(credentials?.email);
      const password = String(credentials?.password ?? "");
      if (!email || !password) return null;
      const user = await db.user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null;
      // Password accounts must confirm their email (OTP) before signing in.
      if (!user.emailVerified) return null;
      const valid = await compare(password, user.passwordHash);
      return valid ? user : null;
    },
  })
);

// Single-use token sign-in, used right after a successful OTP verification
// so new users land signed-in on the dashboard instead of the login page.
providers.push(
  Credentials({
    id: "otp-signin",
    name: "Connexion post-vérification",
    credentials: { email: { type: "email" }, token: { type: "text" } },
    async authorize(credentials) {
      const email = normalizeEmail(credentials?.email);
      const token = String(credentials?.token ?? "");
      if (!email || !token) return null;
      return consumeSigninToken(email, token);
    },
  })
);

// Local sign-in without SMTP or OAuth, enabled outside production only.
if (authProviderFlags.devLogin) {
  providers.push(
    Credentials({
      id: "dev-login",
      name: "Connexion dev (sans email)",
      credentials: { email: { label: "Email", type: "email" } },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email);
        if (!email.includes("@")) return null;
        const user = await db.user.upsert({
          where: { email },
          create: { email, role: isAdminEmail(email) ? "ADMIN" : "USER" },
          update: {},
        });
        const credits = await db.credits.findUnique({ where: { userId: user.id } });
        if (!credits) {
          await creditCredits(user.id, SIGNUP_BONUS_CREDITS, "SIGNUP_BONUS");
        }
        return user;
      },
    })
  );
}

const {
  handlers,
  auth: uncachedAuth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers,
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      if (isAdminEmail(user.email)) {
        await db.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
      }
      await creditCredits(user.id, SIGNUP_BONUS_CREDITS, "SIGNUP_BONUS");
    },
  },
});

/**
 * Session getter memoized per request (React cache): layout, pages and
 * helpers can all call auth() without re-decoding the session each time.
 */
const auth = cache(uncachedAuth);

export { handlers, auth, signIn, signOut };
