import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { LogIn, Mail, TerminalSquare } from "lucide-react";
import { auth, authProviderFlags, signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientIp, rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/utils";
import { VeyalaLogo } from "@/components/landing/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Connexion" };

const ERROR_MESSAGES: Record<string, string> = {
  credentials: "Email ou mot de passe incorrect.",
  ratelimited: "Trop de tentatives de connexion. Réessayez dans quelques minutes.",
  default: "La connexion a échoué. Réessayez ou utilisez une autre méthode.",
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
      />
    </svg>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string; verified?: string };
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const callbackUrl = searchParams.callbackUrl ?? "/dashboard";

  async function loginWithPassword(formData: FormData) {
    "use server";
    const email = normalizeEmail(formData.get("email"));
    const { limit, windowMs } = RATE_LIMITS.login;
    if (!rateLimit(`login:${clientIp()}:${email}`, limit, windowMs)) {
      redirect("/login?error=ratelimited");
    }
    try {
      await signIn("credentials", {
        email,
        password: formData.get("password"),
        redirectTo: callbackUrl,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        // Unverified password accounts are sent back to the OTP step.
        const user = await db.user.findUnique({ where: { email } });
        if (user?.passwordHash && !user.emailVerified) {
          redirect(`/verify-email?email=${encodeURIComponent(email)}`);
        }
        redirect("/login?error=credentials");
      }
      throw error;
    }
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
            <Label htmlFor="password">Mot de passe</Label>
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

        {authProviderFlags.google || authProviderFlags.magicLink ? (
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs uppercase text-muted-foreground">ou</span>
            <Separator className="flex-1" />
          </div>
        ) : null}

        {authProviderFlags.google ? (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: callbackUrl });
            }}
          >
            <Button variant="outline" className="w-full" type="submit">
              <GoogleIcon />
              Continuer avec Google
            </Button>
          </form>
        ) : null}

        {authProviderFlags.magicLink ? (
          <form
            className="space-y-3"
            action={async (formData: FormData) => {
              "use server";
              await signIn("nodemailer", {
                email: formData.get("email"),
                redirectTo: callbackUrl,
              });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="magic-email">Adresse email</Label>
              <Input
                id="magic-email"
                name="email"
                type="email"
                required
                placeholder="vous@exemple.fr"
              />
            </div>
            <Button type="submit" variant="outline" className="w-full">
              <Mail />
              Recevoir un lien magique
            </Button>
          </form>
        ) : null}

        {authProviderFlags.devLogin ? (
          <form
            className="space-y-3 rounded-md border border-dashed p-3"
            action={async (formData: FormData) => {
              "use server";
              await signIn("dev-login", {
                email: formData.get("email"),
                redirectTo: callbackUrl,
              });
            }}
          >
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <TerminalSquare className="size-3.5" aria-hidden />
              Mode développement : connexion directe sans email.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="dev-email">Email (dev)</Label>
              <Input
                id="dev-email"
                name="email"
                type="email"
                required
                placeholder="dev@local.test"
              />
            </div>
            <Button type="submit" variant="secondary" className="w-full">
              Connexion dev
            </Button>
          </form>
        ) : null}

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
