import "server-only";
import nodemailer from "nodemailer";

/** True when an SMTP transport is configured (Inbucket locally, real SMTP in prod). */
export function isMailerConfigured(): boolean {
  return !!(process.env.EMAIL_SERVER && process.env.EMAIL_FROM);
}

function transport() {
  return nodemailer.createTransport(process.env.EMAIL_SERVER);
}

function wrap(title: string, intro: string, blockHtml: string) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
      <h1 style="font-size:20px;color:#0f172a;margin:0 0 8px">${title}</h1>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px">${intro}</p>
      ${blockHtml}
    </div>
  `;
}

const quoteBlock = (body: string) =>
  `<div style="color:#334155;font-size:14px;line-height:1.7;background:#f8fafc;border-left:3px solid #2563eb;border-radius:0 12px 12px 0;padding:16px 20px;white-space:pre-wrap">${body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")}</div>`;

/** Notifies admins that a user sent a support message. */
export async function sendSupportNotificationEmail(params: {
  to: string[];
  userEmail: string;
  subject: string;
  body: string;
}) {
  if (params.to.length === 0) return;
  await transport().sendMail({
    from: process.env.EMAIL_FROM,
    to: params.to,
    subject: `[Support Veyala] ${params.subject}`,
    text: `Nouveau message de ${params.userEmail}\n\nSujet : ${params.subject}\n\n${params.body}\n\nRépondez depuis la boîte de réception admin.`,
    html: wrap(
      "Nouveau message support",
      `De <strong>${params.userEmail}</strong> — sujet : <strong>${params.subject}</strong>. Répondez depuis la boîte de réception admin.`,
      quoteBlock(params.body)
    ),
  });
}

/** Sends the admin's reply to the user by email. */
export async function sendSupportReplyEmail(params: { to: string; subject: string; body: string }) {
  await transport().sendMail({
    from: process.env.EMAIL_FROM,
    to: params.to,
    subject: `Re: ${params.subject} — Support Veyala`,
    text: `L'équipe Veyala vous a répondu :\n\n${params.body}\n\nVous pouvez poursuivre la conversation depuis votre espace, page Support.`,
    html: wrap(
      "L'équipe Veyala vous a répondu",
      `À propos de votre demande « ${params.subject} ». Vous pouvez poursuivre la conversation depuis votre espace, page Support.`,
      quoteBlock(params.body)
    ),
  });
}
