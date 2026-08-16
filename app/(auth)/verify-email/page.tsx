import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MailCheck, RefreshCw } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clientIp, rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { normalizeEmail, siteUrl } from "@/lib/utils";
import { VeyalaLogo } from "@/components/landing/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Vérifiez votre email" };

const MESSAGES: Record<string, { text: string; tone: "error" | "info" }> = {
  resent: { text: "Un nouveau lien vient de vous être envoyé.", tone: "info" },
  cooldown: {
    text: "Un email vient déjà d'être envoyé. Patientez une minute avant d'en redemander un.",
    tone: "info",
  },
  ratelimited: {
    text: "Trop d'essais rapprochés. Patientez quelques minutes avant de réessayer.",
    tone: "error",
  },
};

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { email?: string; status?: string };
}) {
  const email = normalizeEmail(searchParams.email);
  if (!email) redirect("/register");

  const message = searchParams.status ? MESSAGES[searchParams.status] : null;

  async function resendConfirmation() {
    "use server";
    const { limit, windowMs } = RATE_LIMITS.otp;
    if (!(await rateLimit(`resend:${clientIp()}:${email}`, limit, windowMs))) {
      redirect(`/verify-email?email=${encodeURIComponent(email)}&status=ratelimited`);
    }
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${siteUrl()}/auth/callback?next=/dashboard` },
    });
    redirect(
      `/verify-email?email=${encodeURIComponent(email)}&status=${error ? "cooldown" : "resent"}`
    );
  }

  return (
    <Card className="relative w-full max-w-md rounded-3xl border-slate-100 text-center shadow-xl shadow-blue-900/5">
      <CardHeader className="items-center">
        <Link href="/" className="mb-2" aria-label="Accueil Veyala">
          <VeyalaLogo />
        </Link>
        <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-50">
          <MailCheck className="size-7 text-blue-600" aria-hidden />
        </span>
        <CardTitle className="font-display text-2xl font-extrabold tracking-tight">
          Vérifiez votre email
        </CardTitle>
        <CardDescription>
          Un lien de confirmation a été envoyé à <strong className="text-slate-700">{email}</strong>
          . Cliquez dessus pour activer votre compte et accéder à votre espace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message ? (
          <Alert
            variant={message.tone === "error" ? "error" : "info"}
            title={message.tone === "error" ? "Action limitée" : "Information"}
          >
            {message.text}
          </Alert>
        ) : null}

        <form action={resendConfirmation}>
          <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
            <RefreshCw />
            Renvoyer le lien
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
  );
}
