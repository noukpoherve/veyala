import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { MailCheck, RefreshCw } from "lucide-react";
import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSigninToken, sendVerificationCode, verifyCode } from "@/lib/verification";
import { VeyalaLogo } from "@/components/landing/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Vérifiez votre email" };

const MESSAGES: Record<string, { text: string; tone: "error" | "info" }> = {
  invalid: { text: "Code incorrect. Vérifiez l'email reçu et réessayez.", tone: "error" },
  expired: { text: "Ce code a expiré. Demandez un nouveau code ci-dessous.", tone: "error" },
  locked: {
    text: "Trop de tentatives. Demandez un nouveau code pour réessayer.",
    tone: "error",
  },
  resent: { text: "Un nouveau code vient de vous être envoyé.", tone: "info" },
  cooldown: {
    text: "Un code vient déjà d'être envoyé — patientez une minute avant d'en redemander un.",
    tone: "info",
  },
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { email?: string; status?: string };
}) {
  const email = (searchParams.email ?? "").trim().toLowerCase();
  if (!email) redirect("/register");

  const user = await db.user.findUnique({ where: { email } });
  if (!user) redirect("/register");
  if (user.emailVerified) redirect("/login?verified=1");

  const message = searchParams.status ? MESSAGES[searchParams.status] : null;

  async function submitCode(formData: FormData) {
    "use server";
    const code = String(formData.get("code") ?? "").trim();
    const account = await db.user.findUnique({ where: { email } });
    if (!account) redirect("/register");
    if (!/^\d{6}$/.test(code)) {
      redirect(`/verify-email?email=${encodeURIComponent(email)}&status=invalid`);
    }
    const result = await verifyCode(account.id, code);
    if (result !== "ok") {
      redirect(`/verify-email?email=${encodeURIComponent(email)}&status=${result}`);
    }
    // Sign the user straight in: no detour through the login page.
    const token = await createSigninToken(email);
    try {
      await signIn("otp-signin", { email, token, redirectTo: "/dashboard" });
    } catch (error) {
      if (error instanceof AuthError) redirect("/login?verified=1");
      throw error;
    }
  }

  async function resendCode() {
    "use server";
    const account = await db.user.findUnique({ where: { email } });
    if (!account) redirect("/register");
    const sent = await sendVerificationCode(account.id, email);
    redirect(`/verify-email?email=${encodeURIComponent(email)}&status=${sent ? "resent" : "cooldown"}`);
  }

  return (
    <main className="bg-aurora relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div
        aria-hidden
        className="orb -top-32 left-[-6%] size-[480px] [animation-duration:9s]"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 70%)" }}
      />
      <Card className="relative w-full max-w-md rounded-3xl border-slate-100 text-center shadow-xl shadow-blue-900/5">
        <CardHeader className="items-center">
          <Link href="/" className="mb-2" aria-label="Veyala — accueil">
            <VeyalaLogo />
          </Link>
          <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-50">
            <MailCheck className="size-7 text-blue-600" aria-hidden />
          </span>
          <CardTitle className="font-display text-2xl font-extrabold tracking-tight">
            Vérifiez votre email
          </CardTitle>
          <CardDescription>
            Un code à 6 chiffres a été envoyé à <strong className="text-slate-700">{email}</strong>.
            Il expire dans 15 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message ? (
            <p
              role="alert"
              className={
                message.tone === "error"
                  ? "rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                  : "rounded-md bg-blue-50 p-3 text-sm text-blue-700"
              }
            >
              {message.text}
            </p>
          ) : null}

          <form className="space-y-3" action={submitCode}>
            <div className="space-y-1.5 text-left">
              <Label htmlFor="code">Code de vérification</Label>
              <Input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                autoComplete="one-time-code"
                placeholder="123456"
                className="text-center text-2xl font-bold tracking-[0.5em]"
              />
            </div>
            <Button type="submit" variant="gradient" className="w-full">
              Vérifier mon compte
            </Button>
          </form>

          <form action={resendCode}>
            <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
              <RefreshCw />
              Renvoyer le code
            </Button>
          </form>

          <p className="text-xs text-muted-foreground">
            Mauvaise adresse ?{" "}
            <Link href="/register" className="underline">
              Recommencer l&apos;inscription
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
