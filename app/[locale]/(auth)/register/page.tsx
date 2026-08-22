import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clientIp, rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/utils";
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
import { authCallbackRedirect } from "@/i18n/auth-urls";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMessages(getLocale()).seo.registerTitle };
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirm: z.string(),
});

export default async function RegisterPage({ searchParams }: { searchParams: { error?: string } }) {
  const locale = getLocale();
  const m = getMessages(locale);
  const session = await auth();
  if (session?.user) redirectLocalized("/dashboard", locale);

  const errorMessage = searchParams.error
    ? (m.auth.registerErrors[searchParams.error as keyof typeof m.auth.registerErrors] ??
      m.auth.registerErrors.unknown)
    : null;

  async function register(formData: FormData) {
    "use server";
    const loc = getLocale();
    const parsed = registerSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      confirm: formData.get("confirm"),
    });
    if (!parsed.success) redirectLocalized("/register?error=invalid", loc);
    if (parsed.data.password !== parsed.data.confirm) {
      redirectLocalized("/register?error=mismatch", loc);
    }

    const { limit, windowMs } = RATE_LIMITS.register;
    if (!(await rateLimit(`register:${clientIp()}`, limit, windowMs))) {
      redirectLocalized("/register?error=ratelimited", loc);
    }

    const email = normalizeEmail(parsed.data.email);
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: authCallbackRedirect(loc, "/dashboard"),
        data: { locale: loc },
      },
    });
    if (error) {
      if (error.code === "user_already_exists" || error.code === "email_exists") {
        redirectLocalized("/register?error=exists", loc);
      }
      console.error("[register] signUp failed:", error);
      redirectLocalized("/register?error=unknown", loc);
    }
    if (data.user && data.user.identities?.length === 0) {
      redirectLocalized("/register?error=exists", loc);
    }

    redirectLocalized(`/verify-email?email=${encodeURIComponent(email)}`, loc);
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
        <CardTitle className="font-display text-2xl font-extrabold tracking-tight">
          {m.auth.registerTitle}
        </CardTitle>
        <CardDescription>{m.auth.registerDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage ? (
          <Alert variant="error" title={m.auth.registerTitle}>
            {errorMessage}
          </Alert>
        ) : null}

        <form className="space-y-3" action={register}>
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
            <Label htmlFor="password">{m.auth.loginPassword}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder={m.auth.loginPasswordPlaceholder}
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
            />
          </div>
          <Button type="submit" variant="gradient" className="w-full">
            <UserPlus />
            {m.auth.registerCta}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {m.auth.hasAccount}{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            {m.auth.loginCta}
          </Link>
        </p>

        <OAuthButtons />

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
