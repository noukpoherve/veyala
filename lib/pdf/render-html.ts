import type { CVData, CVSkillGroup } from "@/lib/cv-schema";
import type { SectionId, TemplateDefinition } from "@/lib/templates/definition";

/**
 * Renders a CV as a self-contained A4 HTML document, driven by a template
 * definition. Used both for the on-screen preview (iframe) and the PDF
 * export (Playwright print). Real selectable text, clickable links, ATS-safe.
 */

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const httpUrl = (url: string): string => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

function gradientCss(stops: string[]): string {
  if (stops.length === 1) return stops[0]!;
  const step = 100 / (stops.length - 1);
  return `linear-gradient(180deg, ${stops.map((c, i) => `${c} ${Math.round(i * step)}%`).join(", ")})`;
}

function contactSection(cv: CVData, inSidebar: boolean): string {
  const { email, phone, location, links } = cv.contact;
  const items = [
    phone && `<li>${esc(phone)}</li>`,
    email && `<li><a href="mailto:${esc(email)}">${esc(email)}</a></li>`,
    location && `<li>${esc(location)}</li>`,
    ...links.map(
      (l) => `<li><a href="${esc(httpUrl(l.url))}">${esc(l.label || l.url)}</a></li>`
    ),
  ].filter(Boolean);
  if (items.length === 0) return "";
  return `<section class="contact">
    ${inSidebar ? `<h2>Informations</h2>` : ""}
    <ul>${items.join("")}</ul>
  </section>`;
}

function skillGroupHtml(group: CVSkillGroup, style: TemplateDefinition["skillsStyle"]): string {
  if (group.items.length === 0) return "";
  const title = `<h3>${esc(group.category)}</h3>`;
  switch (style) {
    case "bricks":
      return `${title}<ul class="bricks">${group.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
    case "list":
      return `${title}<ul class="skill-list">${group.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
    default:
      return `${title}<p class="inline-skills">${group.items.map(esc).join(" · ")}</p>`;
  }
}

function skillsSection(cv: CVData, def: TemplateDefinition): string {
  if (cv.skills.length === 0) return "";
  return `<section class="skills">
    <h2>Compétences</h2>
    ${cv.skills.map((g) => skillGroupHtml(g, def.skillsStyle)).join("")}
  </section>`;
}

function summarySection(cv: CVData): string {
  if (!cv.summary) return "";
  return `<section class="summary"><h2>Profil</h2><p>${esc(cv.summary)}</p></section>`;
}

function experienceSection(cv: CVData): string {
  if (cv.experiences.length === 0) return "";
  const items = cv.experiences
    .map(
      (e) => `<article class="job">
      <h3>${esc(e.title)}${e.company ? ` — ${esc(e.company)}` : ""}</h3>
      <p class="meta"><strong>${esc(e.dates)}</strong>${e.place ? `<em> · ${esc(e.place)}</em>` : ""}</p>
      ${e.bullets.length ? `<ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
      ${e.stack.length ? `<p class="stack"><strong>Stack :</strong> <em>${e.stack.map(esc).join(", ")}</em></p>` : ""}
    </article>`
    )
    .join("");
  return `<section class="experience"><h2>Expériences professionnelles</h2>${items}</section>`;
}

function educationSection(cv: CVData): string {
  if (cv.education.length === 0) return "";
  const items = cv.education
    .map(
      (e) => `<article class="job">
      <h3>${esc(e.degree)}${e.school ? ` — ${esc(e.school)}` : ""}</h3>
      <p class="meta"><strong>${esc(e.dates)}</strong>${e.place ? `<em> · ${esc(e.place)}</em>` : ""}</p>
      ${e.details ? `<p>${esc(e.details)}</p>` : ""}
    </article>`
    )
    .join("");
  return `<section class="education"><h2>Formation</h2>${items}</section>`;
}

function languagesSection(cv: CVData): string {
  if (cv.languages.length === 0) return "";
  return `<section class="languages"><h2>Langues</h2>
    <ul>${cv.languages.map((l) => `<li>${esc(l.name)}${l.level ? ` — ${esc(l.level)}` : ""}</li>`).join("")}</ul>
  </section>`;
}

function interestsSection(cv: CVData): string {
  if (cv.interests.length === 0) return "";
  return `<section class="interests"><h2>Centres d'intérêt</h2>
    <p>${cv.interests.map(esc).join(" · ")}</p>
  </section>`;
}

function renderSection(id: SectionId, cv: CVData, def: TemplateDefinition, inSidebar: boolean): string {
  switch (id) {
    case "contact":
      return contactSection(cv, inSidebar);
    case "summary":
      return summarySection(cv);
    case "experience":
      return experienceSection(cv);
    case "education":
      return educationSection(cv);
    case "skills":
      return skillsSection(cv, def);
    case "languages":
      return languagesSection(cv);
    case "interests":
      return interestsSection(cv);
  }
}

function headerHtml(cv: CVData, def: TemplateDefinition): string {
  const photo =
    def.photo && cv.identity.photoUrl
      ? `<img class="photo" src="${esc(cv.identity.photoUrl)}" alt="Photo de ${esc(cv.identity.fullName)}" />`
      : "";
  return `<header class="identity">
    <div>
      <h1>${esc(cv.identity.fullName)}</h1>
      ${cv.identity.headline ? `<p class="headline">${esc(cv.identity.headline)}</p>` : ""}
    </div>
    ${photo}
  </header>`;
}

function baseCss(def: TemplateDefinition): string {
  const c = def.colors;
  return `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: 0; }
  html, body { width: 210mm; }
  body {
    font-family: "${def.fonts.body}", "Segoe UI", Arial, sans-serif;
    font-size: 9.2pt; line-height: 1.38; color: ${c.body};
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  a { color: ${c.link}; text-decoration: underline; }
  h1, h2, h3 { font-family: "${def.fonts.heading}", "Segoe UI", Arial, sans-serif; }
  h1 { font-size: 19pt; letter-spacing: .5px; color: ${c.heading}; }
  .headline { font-size: 10.5pt; font-style: italic; margin-top: 2mm; color: ${c.heading}; }
  section { margin-bottom: 4mm; }
  section > h2 {
    background: ${c.band}; color: ${c.bandText};
    font-size: 10pt; text-transform: uppercase; letter-spacing: 1.2px;
    padding: 1.4mm 2.5mm; margin-bottom: 2.4mm;
  }
  .job { margin-bottom: 3mm; page-break-inside: avoid; }
  .job h3 { font-size: 10pt; color: ${c.heading}; }
  .job .meta { font-size: 8.6pt; margin: .6mm 0 1.2mm; }
  .job ul { padding-left: 4.5mm; }
  .job li { margin-bottom: .8mm; }
  .job .stack { font-size: 8.4pt; margin-top: 1mm; color: ${c.heading}; }
  .job .stack em { color: ${c.body}; }
  .photo { width: 30mm; height: 34mm; object-fit: cover; border: 1.5px solid #ffffffcc; }
  .bricks { list-style: none; display: flex; flex-wrap: wrap; gap: 1.4mm; }
  .bricks li {
    background: #ffffff22; border: 1px solid #ffffff55;
    padding: .8mm 2mm; border-radius: 1.2mm; font-size: 8pt;
  }
  .skill-list { padding-left: 4.5mm; }
  .contact ul, .languages ul { list-style: none; }
  .contact li, .languages li { margin-bottom: 1.2mm; word-break: break-word; }
  `;
}

function sidebarLayout(cv: CVData, def: TemplateDefinition): string {
  const c = def.colors;
  const sidebar = def.sidebarSections.map((s) => renderSection(s, cv, def, true)).join("");
  const main = def.mainSections.map((s) => renderSection(s, cv, def, false)).join("");
  const photo =
    def.photo && cv.identity.photoUrl
      ? `<img class="photo" src="${esc(cv.identity.photoUrl)}" alt="Photo de ${esc(cv.identity.fullName)}" />`
      : "";

  return `<style>
    ${baseCss(def)}
    body { display: flex; min-height: 296mm; }
    .sidebar {
      width: 62mm; flex: none; padding: 8mm 5.5mm;
      background: ${gradientCss(c.sidebar)}; color: ${c.sidebarText};
    }
    .sidebar a { color: ${c.sidebarText}; }
    .sidebar section > h2 {
      background: none; padding: 0; margin: 4.5mm 0 2mm;
      border-bottom: 1px solid #ffffff66; padding-bottom: 1mm;
    }
    .sidebar h3 { font-size: 8.8pt; margin: 2.2mm 0 1mm; }
    .sidebar .photo { display: block; margin: 0 auto 4mm; }
    .sidebar .inline-skills { font-size: 8.4pt; }
    .main { flex: 1; padding: 8mm 7mm 8mm 7mm; background: #ffffff; }
    .identity { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5mm; }
  </style>
  <div class="sidebar">
    ${photo}
    ${sidebar}
  </div>
  <main class="main">
    <header class="identity">
      <div>
        <h1>${esc(cv.identity.fullName)}</h1>
        ${cv.identity.headline ? `<p class="headline">${esc(cv.identity.headline)}</p>` : ""}
      </div>
    </header>
    ${main}
  </main>`;
}

function singleColumnLayout(cv: CVData, def: TemplateDefinition): string {
  const main = def.mainSections.map((s) => renderSection(s, cv, def, false)).join("");
  return `<style>
    ${baseCss(def)}
    body { padding: 10mm 14mm; }
    .identity { display: flex; justify-content: space-between; align-items: center;
      border-bottom: 2px solid ${def.colors.heading}; padding-bottom: 3mm; margin-bottom: 5mm; }
    .contact ul { display: flex; flex-wrap: wrap; gap: 1mm 5mm; }
  </style>
  ${headerHtml(cv, def)}
  <main>${main}</main>`;
}

/** Full standalone HTML document for a CV + template definition. */
export function renderCVHtml(cv: CVData, def: TemplateDefinition): string {
  const content = def.layout === "sidebar-left" ? sidebarLayout(cv, def) : singleColumnLayout(cv, def);
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>CV — ${esc(cv.identity.fullName)}</title>
</head>
<body>
${content}
</body>
</html>`;
}
