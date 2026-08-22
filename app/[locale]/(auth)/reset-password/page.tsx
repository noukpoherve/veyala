import type { Metadata } from "next";
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
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { Link } from "@/i18n/navigation";
import { redirectLocalized } from "@/i18n/redirect";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).seo.resetTitle };
}

const passwordSchema = z.object({ password: z.string().min(8), confirm: z.string() });

/**
 * Reached from a recovery or invitation email (the /auth/callback route opened
 * a session). Also serves signed-in users who want to change their password.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const locale = getLocale();
  const m = getMessages(locale);
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
          <CardTitle className="font-display text-xl font-bold">
            {m.auth.resetCheckingTitle}
          </CardTitle>
          <CardDescription>{m.auth.resetCheckingBody}</CardDescription>
        </CardHeader>
        <CardContent>
          <HashSessionBridge />
        </CardContent>
      </Card>
    );
  }

  const errorMessages: Record<string, string> = {
    invalid: m.auth.resetErrors.invalid,
    mismatch: m.auth.registerErrors.mismatch,
    failed: m.auth.resetErrors.failed,
  };
  const errorMessage = searchParams.error ? errorMessages[searchParams.error] : null;

  async function updatePassword(formData: FormData) {
    "use server";
    const loc = getLocale();
    const parsed = passwordSchema.safeParse({
      password: formData.get("password"),
      confirm: formData.get("confirm"),
    });
    if (!parsed.success) redirectLocalized("/reset-password?error=invalid", loc);
    if (parsed.data.password !== parsed.data.confirm) {
      redirectLocalized("/reset-password?error=mismatch", loc);
    }

    const client = createSupabaseServerClient();
    const { error } = await client.auth.updateUser({ password: parsed.data.password });
    if (error) {
      console.error("[reset-password] updateUser failed:", error);
      redirectLocalized("/reset-password?error=failed", loc);
    }
    redirectLocalized("/dashboard", loc);
  }

  return (
    <Card className="relative w-full max-w-md rounded-3xl border-slate-100 shadow-xl shadow-blue-900/5">
      <CardHeader className="items-center text-center">
        <Link href="/" className="mb-2" aria-label={m.common.homeAria}>
          <VeyalaLogo />
        </Link>
        <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-50">
          <ShieldCheck className="size-7 text-blue-600" aria-hidden />
        </span>
        <CardTitle className="font-display text-2xl font-extrabold tracking-tight">
          {m.auth.resetNewPassword}
        </CardTitle>
        <CardDescription>
          {m.auth.resetForEmail} <strong>{user.email}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage ? (
          <Alert variant="error" title={m.auth.resetFailedTitle}>
            {errorMessage}
          </Alert>
        ) : null}

        <form className="space-y-3" action={updatePassword}>
          <div className="space-y-1.5">
            <Label htmlFor="password">{m.auth.resetNewPassword}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder={m.auth.resetPlaceholder}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">{m.auth.registerConfirm}</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder={m.auth.resetConfirmPlaceholder}
            />
          </div>
          <Button type="submit" variant="gradient" className="w-full">
            {m.common.save}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
