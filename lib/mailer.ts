import "server-only";
import nodemailer from "nodemailer";
import { quoteBlock, renderTransactionalEmail } from "@/lib/emails/layout";
import { siteUrl } from "@/lib/utils";

/** True when an SMTP transport is configured (Inbucket locally, real SMTP in prod). */
export function isMailerConfigured(): boolean {
  return !!(process.env.EMAIL_SERVER && process.env.EMAIL_FROM);
}

function transport() {
  return nodemailer.createTransport(process.env.EMAIL_SERVER);
}

/** Notifies admins that a user sent a support message. */
export async function sendSupportNotificationEmail(params: {
  to: string[];
  userEmail: string;
  subject: string;
  body: string;
}) {
  if (params.to.length === 0) return;
  const origin = siteUrl();
  const { html, text } = renderTransactionalEmail({
    siteUrl: origin,
    preheader: `Nouveau message de ${params.userEmail}`,
    title: "Nouveau message support",
    intro: `${params.userEmail} vient d'écrire depuis l'espace Veyala, à propos de « ${params.subject} ». Répondez depuis la boîte de réception admin.`,
    bodyHtml: quoteBlock(params.body),
    bodyText: params.body,
    cta: { href: `${origin}/admin/inbox`, label: "Ouvrir la boîte de réception" },
  });
  await transport().sendMail({
    from: process.env.EMAIL_FROM,
    to: params.to,
    subject: `[Support Veyala] ${params.subject}`,
    text,
    html,
  });
}

/** Sends the admin's reply to the user by email. */
export async function sendSupportReplyEmail(params: { to: string; subject: string; body: string }) {
  const origin = siteUrl();
  const { html, text } = renderTransactionalEmail({
    siteUrl: origin,
    preheader: "L'équipe Veyala vous a répondu.",
    title: "L'équipe Veyala vous a répondu",
    intro: `À propos de votre demande « ${params.subject} ». Vous pouvez poursuivre la conversation depuis votre espace, page Support.`,
    bodyHtml: quoteBlock(params.body),
    bodyText: params.body,
    cta: { href: `${origin}/support`, label: "Voir la conversation" },
    note: "Cet email est une copie : la réponse est aussi disponible dans votre espace Veyala.",
  });
  await transport().sendMail({
    from: process.env.EMAIL_FROM,
    to: params.to,
    subject: `Re: ${params.subject} | Support Veyala`,
    text,
    html,
  });
}
