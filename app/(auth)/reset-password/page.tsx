import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HashSessionBridge } from "./hash-session-bridge";
import { VeyalaLogo } from "@/components/landing/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

const passwordSchema = z.object({ password: z.string().min(8), confirm: z.string() });

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Mot de passe trop court (8 caractères minimum).",
  mismatch: "Les deux mots de passe ne correspondent pas.",
  failed: "La mise à jour a échoué. Redemandez un lien de réinitialisation.",
};

/**
 * Reached from a recovery or invitation email (the /auth/callback route opened
 * a session). Also serves signed-in users who want to change their password.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No server session yet: an invitation link puts the tokens in the URL
  // fragment — let the client bridge store them, then reload this page.
  if (!user) {
    return (
      <Card className="relative w-full max-w-md rounded-3xl border-slate-100 text-center shadow-xl shadow-blue-900/5">
        <CardHeader className="items-center">
          <VeyalaLogo />
          <CardTitle className="font-display text-xl font-bold">Validation du lien…</CardTitle>
          <CardDescription>Un instant, nous vérifions votre lien de connexion.</CardDescription>
        </CardHeader>
        <CardContent>
          <HashSessionBridge />
        </CardContent>
      </Card>
    );
  }

  const errorMessage = searchParams.error ? ERROR_MESSAGES[searchParams.error] : null;

  async function updatePassword(formData: FormData) {
    "use server";
    const parsed = passwordSchema.safeParse({
      password: formData.get("password"),
      confirm: formData.get("confirm"),
    });
    if (!parsed.success) redirect("/reset-password?error=invalid");
    if (parsed.data.password !== parsed.data.confirm) redirect("/reset-password?error=mismatch");

    const client = createSupabaseServerClient();
    const { error } = await client.auth.updateUser({ password: parsed.data.password });
    if (error) {
      console.error("[reset-password] updateUser failed:", error);
      redirect("/reset-password?error=failed");
    }
    redirect("/dashboard");
  }

  return (
    <Card className="relative w-full max-w-md rounded-3xl border-slate-100 shadow-xl shadow-blue-900/5">
      <CardHeader className="items-center text-center">
        <Link href="/" className="mb-2" aria-label="Accueil Veyala">
          <VeyalaLogo />
        </Link>
        <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-50">
          <ShieldCheck className="size-7 text-blue-600" aria-hidden />
        </span>
        <CardTitle className="font-display text-2xl font-extrabold tracking-tight">
          Nouveau mot de passe
        </CardTitle>
        <CardDescription>
          Choisissez un nouveau mot de passe pour <strong>{user.email}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage ? (
          <Alert variant="error" title="Mise à jour impossible">
            {errorMessage}
          </Alert>
        ) : null}

        <form className="space-y-3" action={updatePassword}>
          <div className="space-y-1.5">
            <Label htmlFor="password">Nouveau mot de passe</Label>
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
            Enregistrer
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
