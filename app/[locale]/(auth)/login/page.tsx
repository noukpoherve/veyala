import type { Metadata } from "next";
import { LogIn } from "lucide-react";
import { auth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { persistUserLocale } from "@/lib/persist-locale";
import { clientIp, rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/utils";
import { db } from "@/lib/db";
import { VeyalaLogo } from "@/components/landing/logo";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
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
import { sanitizeCallbackUrl } from "@/i18n/safe-path";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).seo.loginTitle };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string; verified?: string; reset?: string };
}) {
  const locale = getLocale();
  const m = getMessages(locale);
  const session = await auth();
  if (session?.user) redirectLocalized("/dashboard", locale);

  const callbackUrl = sanitizeCallbackUrl(searchParams.callbackUrl, locale);

  async function loginWithPassword(formData: FormData) {
    "use server";
    const loc = getLocale();
    const email = normalizeEmail(formData.get("email"));
    const password = String(formData.get("password") ?? "");
    const { limit, windowMs } = RATE_LIMITS.login;
    if (!(await rateLimit(`login:${clientIp()}:${email}`, limit, windowMs))) {
      redirectLocalized("/login?error=ratelimited", loc);
    }

    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.code === "email_not_confirmed") {
        redirectLocalized(`/verify-email?email=${encodeURIComponent(email)}`, loc);
      }
      if (error.code === "user_banned" || /banned/i.test(error.message)) {
        redirectLocalized("/login?error=archived", loc);
      }
      redirectLocalized("/login?error=credentials", loc);
    }

    const profile = await db.user.findUnique({
      where: { email },
      select: { archivedAt: true },
    });
    if (profile?.archivedAt) {
      await supabase.auth.signOut();
      redirectLocalized("/login?error=archived", loc);
    }

    await persistUserLocale(supabase, loc);
    redirectLocalized(callbackUrl, loc);
  }

  const errorCopy =
    searchParams.error === "archived"
      ? m.auth.errors.archived
      : searchParams.error
        ? (m.auth.errors[searchParams.error as keyof typeof m.auth.errors] ?? m.auth.errors.default)
        : null;

  return (
    <Card className="relative w-full max-w-md rounded-3xl border-slate-100 shadow-xl shadow-blue-900/5">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex w-full items-center justify-between">
          <Link href="/" aria-label={m.common.homeAria}>
            <VeyalaLogo />
          </Link>
          <LanguageSwitcher variant="compact" />
        </div>
        <CardTitle className="font-display text-2xl font-extrabold tracking-tight">
          {m.auth.loginTitle}
        </CardTitle>
        <CardDescription>{m.auth.loginDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {searchParams.verified ? (
          <Alert variant="success" title={m.auth.verifiedTitle}>
            {m.auth.verifiedBody}
          </Alert>
        ) : null}

        {searchParams.reset ? (
          <Alert variant="success" title={m.auth.resetDoneTitle}>
            {m.auth.resetDoneBody}
          </Alert>
        ) : null}

        {searchParams.error ? (
          <Alert
            variant="error"
            title={
              searchParams.error === "archived" ? m.auth.accountDisabled : m.auth.loginImpossible
            }
          >
            {errorCopy}
          </Alert>
        ) : null}

        <form className="space-y-3" action={loginWithPassword}>
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
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{m.auth.loginPassword}</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                {m.auth.forgotPassword}
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder={m.auth.loginPasswordPlaceholder}
            />
          </div>
          <Button type="submit" variant="gradient" className="w-full">
            <LogIn />
            {m.auth.loginCta}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {m.auth.noAccount}{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:underline">
            {m.auth.createAccount}
          </Link>
        </p>

        <OAuthButtons callbackUrl={callbackUrl} />

        <p className="text-center text-xs text-muted-foreground">
          {m.auth.acceptTerms}{" "}
          <Link href="/cgu" className="underline">
            {m.auth.terms}
          </Link>{" "}
          {m.auth.and}{" "}
          <Link href="/confidentialite" className="underline">
            {m.auth.privacy}
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}
