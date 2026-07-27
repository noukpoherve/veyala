import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { z } from "zod";
import { auth, SIGNUP_BONUS_CREDITS } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clientIp, rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { normalizeEmail, siteUrl } from "@/lib/utils";
import { VeyalaLogo } from "@/components/landing/logo";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

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
  ratelimited: "Trop de créations de compte rapprochées. Réessayez plus tard.",
  unknown: "L'inscription a échoué. Réessayez.",
};

export default async function RegisterPage({ searchParams }: { searchParams: { error?: string } }) {
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

    const { limit, windowMs } = RATE_LIMITS.register;
    if (!(await rateLimit(`register:${clientIp()}`, limit, windowMs))) {
      redirect("/register?error=ratelimited");
    }

    const email = normalizeEmail(parsed.data.email);
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: parsed.data.password,
      options: { emailRedirectTo: `${siteUrl()}/auth/callback?next=/dashboard` },
    });
    if (error) {
      if (error.code === "user_already_exists" || error.code === "email_exists") {
        redirect("/register?error=exists");
      }
      console.error("[register] signUp failed:", error);
      redirect("/register?error=unknown");
    }
    // Existing confirmed accounts come back as an obfuscated user without identities.
    if (data.user && data.user.identities?.length === 0) redirect("/register?error=exists");

    // Email confirmation required: the profile row and signup credits are
    // created by ensureUser() on the first authenticated request.
    redirect(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  return (
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
          <Alert variant="error" title="Inscription impossible">
            {errorMessage}
          </Alert>
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

        <OAuthButtons />

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
  );
}
