import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogIn } from "lucide-react";
import { auth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clientIp, rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/utils";
import { VeyalaLogo } from "@/components/landing/logo";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Connexion" };

const ERROR_MESSAGES: Record<string, string> = {
  credentials: "Email ou mot de passe incorrect.",
  ratelimited: "Trop de tentatives de connexion. Réessayez dans quelques minutes.",
  confirmation: "Le lien de confirmation est invalide ou expiré. Reconnectez-vous.",
  oauth: "La connexion via ce fournisseur a échoué. Réessayez.",
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
    if (!rateLimit(`login:${clientIp()}:${email}`, limit, windowMs)) {
      redirect("/login?error=ratelimited");
    }

    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.code === "email_not_confirmed") {
        redirect(`/verify-email?email=${encodeURIComponent(email)}`);
      }
      redirect("/login?error=credentials");
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
          <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
            Email vérifié — vous pouvez maintenant vous connecter.
          </p>
        ) : null}

        {searchParams.reset ? (
          <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
            Mot de passe mis à jour — reconnectez-vous.
          </p>
        ) : null}

        {searchParams.error ? (
          <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {ERROR_MESSAGES[searchParams.error] ?? ERROR_MESSAGES.default}
          </p>
        ) : null}

        <form className="space-y-3" action={loginWithPassword}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Adresse email</Label>
            <Input id="email" name="email" type="email" required placeholder="vous@exemple.fr" />
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
