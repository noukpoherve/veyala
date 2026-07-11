import "server-only";
import nodemailer from "nodemailer";

/** True when an SMTP transport is configured (Inbucket locally, real SMTP in prod). */
export function isMailerConfigured(): boolean {
  return !!(process.env.EMAIL_SERVER && process.env.EMAIL_FROM);
}

function transport() {
  return nodemailer.createTransport(process.env.EMAIL_SERVER);
}

/** Sends the 6-digit sign-up verification code. */
export async function sendVerificationCodeEmail(to: string, code: string) {
  await transport().sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `${code} — votre code de vérification Veyala`,
    text: `Votre code de vérification Veyala : ${code}\n\nIl expire dans 15 minutes. Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h1 style="font-size:20px;color:#0f172a;margin:0 0 8px">Vérifiez votre adresse email</h1>
        <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px">
          Saisissez ce code sur Veyala pour activer votre compte. Il expire dans 15&nbsp;minutes.
        </p>
        <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#2563eb;background:#eff6ff;border-radius:12px;padding:16px 24px;text-align:center;margin:0 0 24px">
          ${code}
        </p>
        <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0">
          Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet email.
        </p>
      </div>
    `,
  });
}
