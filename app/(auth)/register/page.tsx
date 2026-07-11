import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { hash } from "bcryptjs";
import { UserPlus } from "lucide-react";
import { z } from "zod";
import { auth, isAdminEmail, signIn, SIGNUP_BONUS_CREDITS } from "@/lib/auth";
import { creditCredits } from "@/lib/credits";
import { db } from "@/lib/db";
import { sendVerificationCode, verificationRequired } from "@/lib/verification";
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

export const metadata: Metadata = { title: "Créer un compte" };

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirm: z.string(),
});

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Email invalide ou mot de passe trop court (8 caractères minimum).",
  mismatch: "Les deux mots de passe ne correspondent pas.",
  exists: "Un compte existe déjà avec cet email. Connectez-vous.",
  unknown: "L'inscription a échoué. Réessayez.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const errorMessage = searchParams.error
    ? (ERROR_MESSAGES[searchParams.error] ?? ERROR_MESSAGES.unknown)
    : null;

  async function register(formData: FormData) {
    "use server";
    const parsed = registerSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      confirm: formData.get("confirm"),
    });
    if (!parsed.success) redirect("/register?error=invalid");
    if (parsed.data.password !== parsed.data.confirm) redirect("/register?error=mismatch");

    const email = parsed.data.email.trim().toLowerCase();
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) redirect("/register?error=exists");

    const passwordHash = await hash(parsed.data.password, 12);
    const requireOtp = verificationRequired();
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        role: isAdminEmail(email) ? "ADMIN" : "USER",
        // Without a mail transport (SMTP not configured), skip OTP gracefully.
        emailVerified: requireOtp ? null : new Date(),
      },
    });
    await creditCredits(user.id, SIGNUP_BONUS_CREDITS, "SIGNUP_BONUS");

    if (requireOtp) {
      await sendVerificationCode(user.id, email);
      redirect(`/verify-email?email=${encodeURIComponent(email)}`);
    }

    try {
      await signIn("credentials", {
        email,
        password: parsed.data.password,
        redirectTo: "/dashboard",
      });
    } catch (error) {
      // Account is created; fall back to the login page if auto sign-in fails.
      if (error instanceof AuthError) redirect("/login");
      throw error;
    }
  }

  return (
    <main className="bg-aurora relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div
        aria-hidden
        className="orb -top-32 left-[-6%] size-[480px] [animation-duration:9s]"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="orb -bottom-24 right-[-8%] size-[420px] [animation-duration:7s]"
        style={{ background: "radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%)" }}
      />
      <Card className="relative w-full max-w-md rounded-3xl border-slate-100 shadow-xl shadow-blue-900/5">
        <CardHeader className="items-center text-center">
          <Link href="/" className="mb-2" aria-label="Veyala — accueil">
            <VeyalaLogo />
          </Link>
          <CardTitle className="font-display text-2xl font-extrabold tracking-tight">
            Créer un compte
          </CardTitle>
          <CardDescription>
            {SIGNUP_BONUS_CREDITS} crédits offerts à l&apos;inscription — sans carte bancaire.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage ? (
            <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          <form className="space-y-3" action={register}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Adresse email</Label>
              <Input id="email" name="email" type="email" required placeholder="vous@exemple.fr" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="8 caractères minimum"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirmer le mot de passe</Label>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Retapez votre mot de passe"
              />
            </div>
            <Button type="submit" variant="gradient" className="w-full">
              <UserPlus />
              Créer mon compte
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:underline">
              Se connecter
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground">
            En créant un compte, vous acceptez nos{" "}
            <Link href="/cgu" className="underline">
              CGU
            </Link>{" "}
            et notre{" "}
            <Link href="/confidentialite" className="underline">
              politique de confidentialité
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
