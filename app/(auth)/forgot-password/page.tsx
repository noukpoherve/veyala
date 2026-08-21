import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clientIp, rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/utils";
import { VeyalaLogo } from "@/components/landing/logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { Link } from "@/i18n/navigation";
import { redirectLocalized } from "@/i18n/redirect";
import { authCallbackRedirect } from "@/i18n/auth-urls";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).seo.forgotTitle };
}

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const locale = getLocale();
  const m = getMessages(locale);

  async function requestReset(formData: FormData) {
    "use server";
    const loc = getLocale();
    const email = normalizeEmail(formData.get("email"));
    const { limit, windowMs } = RATE_LIMITS.otp;
    if (!(await rateLimit(`forgot:${clientIp()}`, limit, windowMs))) {
      redirectLocalized("/forgot-password?status=ratelimited", loc);
    }
    const supabase = createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authCallbackRedirect(loc, "/reset-password"),
    });
    redirectLocalized("/forgot-password?status=sent", loc);
  }

  return (
    <Card className="relative w-full max-w-md rounded-3xl border-slate-100 shadow-xl shadow-blue-900/5">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex w-full items-center justify-between">
          <Link href="/" aria-label={m.common.homeAria}>
            <VeyalaLogo />
          </Link>
          <LanguageSwitcher variant="compact" />
        </div>
        <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-50">
          <KeyRound className="size-7 text-blue-600" aria-hidden />
        </span>
        <CardTitle className="font-display text-2xl font-extrabold tracking-tight">
          {m.auth.forgotTitle}
        </CardTitle>
        <CardDescription>{m.auth.forgotDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {searchParams.status === "sent" ? (
          <Alert variant="success" title={m.auth.forgotSentTitle}>
            {m.auth.forgotSentBody}
          </Alert>
        ) : null}
        {searchParams.status === "ratelimited" ? (
          <Alert variant="error" title={m.auth.forgotRateTitle}>
            {m.auth.forgotRateBody}
          </Alert>
        ) : null}

        <form className="space-y-3" action={requestReset}>
          <div className="space-y-1.5">
            <Label htmlFor="email">{m.auth.loginEmail}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder={m.auth.loginEmailPlaceholder}
            />
          </div>
          <Button type="submit" variant="gradient" className="w-full">
            {m.auth.forgotCta}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            {m.auth.backToLogin}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
