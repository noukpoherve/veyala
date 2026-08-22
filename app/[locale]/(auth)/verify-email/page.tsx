import type { Metadata } from "next";
import { MailCheck, RefreshCw } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clientIp, rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/utils";
import { VeyalaLogo } from "@/components/landing/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { getLocale } from "@/i18n/get-locale";
import { getMessages, type Messages } from "@/i18n/messages";
import { Link } from "@/i18n/navigation";
import { redirectLocalized } from "@/i18n/redirect";
import { authCallbackRedirect } from "@/i18n/auth-urls";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).seo.verifyTitle };
}

const STATUS_TONES: Record<keyof Messages["auth"]["verifyStatus"], "error" | "info"> = {
  resent: "info",
  cooldown: "info",
  ratelimited: "error",
};

function isStatus(value: string): value is keyof typeof STATUS_TONES {
  return value in STATUS_TONES;
}

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { email?: string; status?: string };
}) {
  const locale = getLocale();
  const m = getMessages(locale);
  const email = normalizeEmail(searchParams.email);
  if (!email) redirectLocalized("/register", locale);

  const status = searchParams.status ?? "";
  const statusKey = isStatus(status) ? status : null;

  async function resendConfirmation() {
    "use server";
    const loc = getLocale();
    const { limit, windowMs } = RATE_LIMITS.otp;
    if (!(await rateLimit(`resend:${clientIp()}:${email}`, limit, windowMs))) {
      redirectLocalized(`/verify-email?email=${encodeURIComponent(email)}&status=ratelimited`, loc);
    }
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: authCallbackRedirect(loc, "/dashboard") },
    });
    redirectLocalized(
      `/verify-email?email=${encodeURIComponent(email)}&status=${error ? "cooldown" : "resent"}`,
      loc
    );
  }

  return (
    <Card className="relative w-full max-w-md rounded-3xl border-slate-100 text-center shadow-xl shadow-blue-900/5">
      <CardHeader className="items-center">
        <Link href="/" className="mb-2" aria-label={m.common.homeAria}>
          <VeyalaLogo />
        </Link>
        <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-50">
          <MailCheck className="size-7 text-blue-600" aria-hidden />
        </span>
        <CardTitle className="font-display text-2xl font-extrabold tracking-tight">
          {m.auth.verifyTitle}
        </CardTitle>
        <CardDescription>
          {m.auth.verifySentTo} <strong className="text-slate-700">{email}</strong>
          {m.auth.verifySentToAfter}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusKey ? (
          <Alert
            variant={STATUS_TONES[statusKey]}
            title={
              STATUS_TONES[statusKey] === "error"
                ? m.auth.verifyLimitedTitle
                : m.auth.verifyInfoTitle
            }
          >
            {m.auth.verifyStatus[statusKey]}
          </Alert>
        ) : null}

        <form action={resendConfirmation}>
          <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
            <RefreshCw />
            {m.auth.verifyResendLink}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground">
          {m.auth.verifyWrongEmail}{" "}
          <Link href="/register" className="underline">
            {m.auth.verifyRestartSignup}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
