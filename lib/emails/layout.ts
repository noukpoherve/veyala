/** Shared transactional email chrome — table layout, inline CSS, Outlook-safe. */

export const EMAIL_BRAND = {
  primary: "#2563EB",
  navy: "#0F172A",
  body: "#475569",
  muted: "#64748B",
  faint: "#94A3B8",
  bg: "#EFF6FF",
  card: "#FFFFFF",
  quoteBg: "#F8FAFC",
  font: "Inter,Arial,Helvetica,sans-serif",
} as const;

const PREHEADER_PAD = Array.from({ length: 80 }, () => "&#847;&zwnj;&nbsp;").join("");

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function paragraphs(text: string): string {
  return text
    .split(/\n\n+/)
    .map(
      (block) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${EMAIL_BRAND.body}">${escapeHtml(
          block
        ).replace(/\n/g, "<br>")}</p>`
    )
    .join("");
}

function ctaButton(href: string, label: string): string {
  return `
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px">
                      <tr>
                        <td align="center" bgcolor="${EMAIL_BRAND.primary}" style="border-radius:999px;background-color:${EMAIL_BRAND.primary}">
                          <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-family:${EMAIL_BRAND.font};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none">${escapeHtml(label)}</a>
                        </td>
                      </tr>
                    </table>`;
}

export type TransactionalEmail = {
  siteUrl: string;
  preheader: string;
  title: string;
  intro: string;
  /** Pre-escaped HTML (e.g. a quoted message). Inserted as-is. */
  bodyHtml?: string;
  /** Plain-text counterpart of `bodyHtml` (quote, etc.). */
  bodyText?: string;
  cta?: { href: string; label: string };
  /** Shown under the button; include the raw URL for clients that block buttons. */
  ctaUrl?: string;
  note?: string;
};

export function renderTransactionalEmail(email: TransactionalEmail): {
  html: string;
  text: string;
} {
  const origin = email.siteUrl.replace(/\/+$/, "");
  const logoUrl = `${origin}/brand/veyala-logo-full.png`;
  const cta = email.cta ? ctaButton(email.cta.href, email.cta.label) : "";
  const ctaUrl = email.ctaUrl
    ? `<p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:${EMAIL_BRAND.muted}">${escapeHtml(
        "Si le bouton ne s'affiche pas, copiez ce lien :"
      )}</p><p style="margin:6px 0 0;font-size:12px;line-height:1.6;color:${EMAIL_BRAND.faint};word-break:break-all">${escapeHtml(
        email.ctaUrl
      )}</p>`
    : "";
  const note = email.note
    ? `<p style="margin:28px 0 0;font-size:13px;line-height:1.65;color:${EMAIL_BRAND.muted}">${escapeHtml(
        email.note
      ).replace(/\n/g, "<br>")}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(email.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL_BRAND.bg}">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${escapeHtml(email.preheader)} ${PREHEADER_PAD}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_BRAND.bg}">
    <tr>
      <td align="center" style="padding:40px 16px 24px">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="width:100%;max-width:520px">
          <tr>
            <td style="background-color:${EMAIL_BRAND.card};border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(37,99,235,0.08)">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:4px;line-height:4px;font-size:0;background-color:${EMAIL_BRAND.primary}">&nbsp;</td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:36px 36px 40px;font-family:${EMAIL_BRAND.font}">
                    <img src="${escapeHtml(logoUrl)}" alt="Veyala" width="132" height="34" style="display:block;border:0;height:34px;width:auto">
                    <h1 style="margin:28px 0 16px;font-family:${EMAIL_BRAND.font};font-size:22px;line-height:1.3;font-weight:800;letter-spacing:-0.02em;color:${EMAIL_BRAND.navy}">${escapeHtml(email.title)}</h1>
                    ${[paragraphs(email.intro), email.bodyHtml, cta, ctaUrl, note]
                      .filter((part) => part?.trim())
                      .join("\n")}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 12px 8px;text-align:center;font-family:${EMAIL_BRAND.font}">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${EMAIL_BRAND.muted}">${escapeHtml(
                "Veyala — votre candidature, augmentée par l'IA."
              )}</p>
              <p style="margin:0;font-size:12px;line-height:1.6;color:${EMAIL_BRAND.faint}">
                <a href="${escapeHtml(`${origin}/cgu`)}" style="color:${EMAIL_BRAND.muted};text-decoration:underline">CGU</a>
                &nbsp;·&nbsp;
                <a href="${escapeHtml(`${origin}/confidentialite`)}" style="color:${EMAIL_BRAND.muted};text-decoration:underline">Confidentialité</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const textParts = [
    email.title,
    "",
    email.intro,
    email.bodyText ? `\n${email.bodyText}` : "",
    email.cta ? `\n${email.cta.label} : ${email.cta.href}` : "",
    email.note ? `\n${email.note}` : "",
    "\n—\nVeyala — votre candidature, augmentée par l'IA.",
    `${origin}/cgu · ${origin}/confidentialite`,
  ];

  return { html, text: textParts.filter((part) => part !== "").join("\n") };
}

export function quoteBlock(body: string): string {
  return `<div style="margin:8px 0 0;padding:16px 18px;background-color:${EMAIL_BRAND.quoteBg};border-left:3px solid ${EMAIL_BRAND.primary};border-radius:0 12px 12px 0;color:#334155;font-size:14px;line-height:1.7;white-space:pre-wrap">${escapeHtml(body)}</div>`;
}
