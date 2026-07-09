import type { NextAuthConfig } from "next-auth";

/**
 * Config Auth.js sans adaptateur ni provider Node : importable depuis le
 * middleware (edge). La config complète (Prisma, nodemailer) est dans lib/auth.ts.
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
