import { NextResponse } from "next/server";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { resolveAuthEmailLocale } from "@/i18n/auth-locale";
import { siteUrl } from "@/lib/utils";
import { verifyStandardWebhook } from "@/lib/emails/webhook";
import { sendAuthEmail } from "@/lib/emails/send-auth";
import type { AuthEmailId } from "@/lib/emails/auth";
import { reportError } from "@/lib/sentry";

export const runtime = "nodejs";

type HookEmailData = {
  token?: string;
  token_hash?: string;
  redirect_to?: string;
  email_action_type?: string;
  site_url?: string;
  token_new?: string;
  token_hash_new?: string;
};

type HookUser = {
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type HookPayload = {
  user?: HookUser;
  email_data?: HookEmailData;
};

const ACTION_TO_ID: Record<string, AuthEmailId> = {
  signup: "confirmation",
  email: "confirmation",
  recovery: "recovery",
  invite: "invite",
  email_change: "email_change",
  password_changed: "password_changed",
};

function confirmationUrl(data: HookEmailData, supabaseUrl: string): string | undefined {
  if (!data.token_hash || !data.email_action_type) return undefined;
  const verify = new URL(`${supabaseUrl.replace(/\/+$/, "")}/auth/v1/verify`);
  verify.searchParams.set("token", data.token_hash);
  verify.searchParams.set("type", data.email_action_type);
  if (data.redirect_to) verify.searchParams.set("redirect_to", data.redirect_to);
  return verify.toString();
}

/**
 * Supabase Auth Send Email Hook.
 * GoTrue supplies the token/link; Veyala picks FR/EN copy and sends via SMTP.
 * When this hook is not configured, GoTrue keeps sending the static FR templates.
 */
export async function POST(req: Request) {
  const secret = process.env.SEND_EMAIL_HOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Send Email Hook is not configured." }, { status: 503 });
  }

  const payload = await req.text();
  if (!verifyStandardWebhook(payload, req.headers, secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let body: HookPayload;
  try {
    body = JSON.parse(payload) as HookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const email = body.user?.email?.trim();
  const action = body.email_data?.email_action_type ?? "";
  const id = ACTION_TO_ID[action];
  if (!email || !id) {
    return NextResponse.json({ error: "Unsupported auth email." }, { status: 400 });
  }

  const locale: Locale =
    action === "invite"
      ? DEFAULT_LOCALE
      : resolveAuthEmailLocale({
          redirectTo: body.email_data?.redirect_to,
          metadataLocale: body.user?.user_metadata?.locale,
        });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? body.email_data?.site_url ?? siteUrl();
  const origin = siteUrl();

  try {
    await sendAuthEmail({
      to: email,
      id,
      locale,
      siteUrl: origin,
      confirmationUrl: confirmationUrl(body.email_data ?? {}, supabaseUrl),
      newEmail:
        typeof body.user?.user_metadata?.new_email === "string"
          ? body.user.user_metadata.new_email
          : undefined,
    });
  } catch (error) {
    reportError(error, "auth.send_email");
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }

  return NextResponse.json({});
}
