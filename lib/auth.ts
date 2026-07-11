import { cache } from "react";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";
import { creditCredits } from "@/lib/credits";

export const SIGNUP_BONUS_CREDITS = 2;

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

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
  providers.push(
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    })
  );
}

// Local sign-in without SMTP or OAuth, enabled outside production only.
if (process.env.NODE_ENV !== "production") {
  providers.push(
    Credentials({
      id: "dev-login",
      name: "Connexion dev (sans email)",
      credentials: { email: { label: "Email", type: "email" } },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
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

const { handlers, auth: uncachedAuth, signIn, signOut } = NextAuth({
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
