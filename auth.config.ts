import type { NextAuthConfig } from "next-auth";

/**
 * Auth.js config without adapter or Node-only providers: safe to import from
 * the (edge) middleware. The full config (Prisma, nodemailer) lives in lib/auth.ts.
 */
export const authConfig = {
  providers: [],
  session: { strategy: "jwt" },
  pages: { signIn: "/login", verifyRequest: "/login/verifie" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: "USER" | "ADMIN" }).role ?? "USER";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "USER" | "ADMIN") ?? "USER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
