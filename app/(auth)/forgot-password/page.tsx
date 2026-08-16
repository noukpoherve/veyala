import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clientIp, rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { normalizeEmail, siteUrl } from "@/lib/utils";
import { VeyalaLogo } from "@/components/landing/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  async function requestReset(formData: FormData) {
    "use server";
    const email = normalizeEmail(formData.get("email"));
    const { limit, windowMs } = RATE_LIMITS.otp;
    if (!(await rateLimit(`forgot:${clientIp()}`, limit, windowMs))) {
      redirect("/forgot-password?status=ratelimited");
    }
    const supabase = createSupabaseServerClient();
    // Same response whether the account exists or not: no user enumeration.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
    });
    redirect("/forgot-password?status=sent");
  }

  return (
    <Card className="relative w-full max-w-md rounded-3xl border-slate-100 shadow-xl shadow-blue-900/5">
      <CardHeader className="items-center text-center">
        <Link href="/" className="mb-2" aria-label="Accueil Veyala">
          <VeyalaLogo />
        </Link>
        <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-50">
          <KeyRound className="size-7 text-blue-600" aria-hidden />
        </span>
        <CardTitle className="font-display text-2xl font-extrabold tracking-tight">
          Mot de passe oublié
        </CardTitle>
        <CardDescription>
          Indiquez votre adresse email : si un compte existe, vous recevrez un lien de
          réinitialisation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {searchParams.status === "sent" ? (
          <Alert variant="success" title="Email envoyé">
            Si un compte existe avec cette adresse, un lien de réinitialisation vient de partir.
          </Alert>
        ) : null}
        {searchParams.status === "ratelimited" ? (
          <Alert variant="error" title="Trop de demandes">
            Patientez quelques minutes avant de réessayer.
          </Alert>
        ) : null}

        <form className="space-y-3" action={requestReset}>
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
          <Button type="submit" variant="gradient" className="w-full">
            Envoyer le lien de réinitialisation
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
