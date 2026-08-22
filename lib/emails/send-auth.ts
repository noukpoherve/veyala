import "server-only";
import nodemailer from "nodemailer";
import type { AuthEmailId } from "@/lib/emails/auth";
import { renderAuthEmail } from "@/lib/emails/auth";
import type { Locale } from "@/i18n/config";
import { isMailerConfigured } from "@/lib/mailer";

function transport() {
  return nodemailer.createTransport(process.env.EMAIL_SERVER);
}

export async function sendAuthEmail(params: {
  to: string;
  id: AuthEmailId;
  locale: Locale;
  siteUrl: string;
  confirmationUrl?: string;
  newEmail?: string;
}): Promise<void> {
  if (!isMailerConfigured()) {
    throw new Error("EMAIL_SERVER / EMAIL_FROM missing: cannot send auth email.");
  }
  const rendered = renderAuthEmail(params.id, {
    locale: params.locale,
    siteUrl: params.siteUrl,
    confirmationUrl: params.confirmationUrl,
    newEmail: params.newEmail,
  });
  await transport().sendMail({
    from: process.env.EMAIL_FROM,
    to: params.to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });
}
