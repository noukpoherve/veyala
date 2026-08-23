import type { CVData } from "@/lib/cv-schema";
import type { TemplateDefinition } from "@/lib/templates/definition";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { intlLocale } from "@/i18n/format";

/**
 * Cover letter as a standalone A4 HTML document. Pure function shared by the
 * PDF export and the live preview in the editor.
 */

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function renderCoverLetterHtml(
  cv: CVData,
  letter: { body: string; jobTitle: string },
  def: TemplateDefinition,
  locale: Locale = "fr"
): string {
  const c = def.colors;
  const copy = getMessages(locale).cv;
  const contactParts = [
    cv.contact.email,
    cv.contact.phone,
    cv.contact.location,
    ...cv.contact.links.map((l) => l.url),
  ].filter(Boolean);

  const paragraphs = letter.body
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join("");

  const today = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "long" }).format(
    new Date()
  );

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<title>${esc(copy.letterDocumentTitle(cv.identity.fullName))}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: 0; }
  html, body { width: 210mm; }
  body {
    font-family: "${def.fonts.body}", "Segoe UI", Arial, sans-serif;
    font-size: 10.5pt; line-height: 1.55; color: #333333;
    padding: 16mm 18mm;
    -webkit-box-decoration-break: clone; box-decoration-break: clone;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .rule { height: 2.2mm; border-radius: 1mm; margin-bottom: 6mm;
    background: linear-gradient(90deg, ${c.sidebar.join(", ")}); }
  header h1 { font-family: "${def.fonts.heading}", Arial, sans-serif;
    font-size: 15pt; color: ${c.heading}; }
  .contact { font-size: 8.5pt; color: #666666; margin-top: 1mm; }
  .date { text-align: right; font-size: 9.5pt; color: #555555; margin: 6mm 0; }
  .subject { font-weight: bold; color: ${c.heading}; margin-bottom: 5mm; }
  main p { margin-bottom: 3.5mm; text-align: justify; }
  .signature { margin-top: 8mm; font-weight: bold; color: ${c.heading}; }
</style>
</head>
<body>
  <div class="rule" aria-hidden="true"></div>
  <header>
    <h1>${esc(cv.identity.fullName)}</h1>
    <p class="contact">${contactParts.map(esc).join(" · ")}</p>
  </header>
  <p class="date">${esc(copy.letterDate(today))}</p>
  <p class="subject">${esc(copy.letterSubject(letter.jobTitle))}</p>
  <main>${paragraphs}</main>
  <p class="signature">${esc(cv.identity.fullName)}</p>
</body>
</html>`;
}
