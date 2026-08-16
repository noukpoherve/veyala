import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogIn } from "lucide-react";
import { auth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clientIp, rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/utils";
import { db } from "@/lib/db";
import { VeyalaLogo } from "@/components/landing/logo";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Connexion" };

const ERROR_MESSAGES: Record<string, string> = {
  credentials: "Email ou mot de passe incorrect.",
  ratelimited: "Trop de tentatives de connexion. Réessayez dans quelques minutes.",
  confirmation: "Le lien de confirmation est invalide ou expiré. Reconnectez-vous.",
  oauth: "La connexion via ce fournisseur a échoué. Réessayez.",
  archived: "Votre compte est désactivé. Contactez un administrateur pour le réactiver.",
  default: "La connexion a échoué. Réessayez.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string; verified?: string; reset?: string };
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const rawCallback = searchParams.callbackUrl ?? "/dashboard";
  const callbackUrl = rawCallback.startsWith("/") ? rawCallback : "/dashboard";

  async function loginWithPassword(formData: FormData) {
    "use server";
    const email = normalizeEmail(formData.get("email"));
    const password = String(formData.get("password") ?? "");
    const { limit, windowMs } = RATE_LIMITS.login;
    if (!(await rateLimit(`login:${clientIp()}:${email}`, limit, windowMs))) {
      redirect("/login?error=ratelimited");
    }

    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.code === "email_not_confirmed") {
        redirect(`/verify-email?email=${encodeURIComponent(email)}`);
      }
      // Banned / archived accounts (Supabase ban synced on archive).
      if (error.code === "user_banned" || /banned/i.test(error.message)) {
        redirect("/login?error=archived");
      }
      redirect("/login?error=credentials");
    }

    const profile = await db.user.findUnique({
      where: { email },
      select: { archivedAt: true },
    });
    if (profile?.archivedAt) {
      await supabase.auth.signOut();
      redirect("/login?error=archived");
    }

    redirect(callbackUrl);
  }

  return (
    <Card className="relative w-full max-w-md rounded-3xl border-slate-100 shadow-xl shadow-blue-900/5">
      <CardHeader className="items-center text-center">
        <Link href="/" className="mb-2" aria-label="Veyala — accueil">
          <VeyalaLogo />
        </Link>
        <CardTitle className="font-display text-2xl font-extrabold tracking-tight">
          Connexion
        </CardTitle>
        <CardDescription>Accédez à votre espace pour générer des CV sur mesure.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {searchParams.verified ? (
          <Alert variant="success" title="Email vérifié">
            Vous pouvez maintenant vous connecter.
          </Alert>
        ) : null}

        {searchParams.reset ? (
          <Alert variant="success" title="Mot de passe mis à jour">
            Reconnectez-vous avec votre nouveau mot de passe.
          </Alert>
        ) : null}

        {searchParams.error ? (
          <Alert
            variant="error"
            title={searchParams.error === "archived" ? "Compte désactivé" : "Connexion impossible"}
          >
            {ERROR_MESSAGES[searchParams.error] ?? ERROR_MESSAGES.default}
          </Alert>
        ) : null}

        <form className="space-y-3" action={loginWithPassword}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="vous@exemple.fr"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mot de passe</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Votre mot de passe"
            />
          </div>
          <Button type="submit" variant="gradient" className="w-full">
            <LogIn />
            Se connecter
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:underline">
            Créer un compte
          </Link>
        </p>

        <OAuthButtons callbackUrl={callbackUrl} />

        <p className="text-center text-xs text-muted-foreground">
          En vous connectant, vous acceptez nos{" "}
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
