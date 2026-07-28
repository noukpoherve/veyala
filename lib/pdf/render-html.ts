import type { CVData, CVSkillGroup } from "@/lib/cv-schema";
import { inlineLinksToHtml, normalizeHttpUrl } from "@/lib/inline-links";
import type { SectionId, TemplateDefinition } from "@/lib/templates/definition";

/**
 * Renders a CV as a self-contained A4 HTML document, driven by a template
 * definition. Used both for the on-screen preview (iframe) and the PDF
 * export (Playwright print). Real selectable text, clickable links, ATS-safe.
 */

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const httpUrl = normalizeHttpUrl;

function gradientCss(stops: string[]): string {
  if (stops.length === 1) return stops[0]!;
  const step = 100 / (stops.length - 1);
  return `linear-gradient(180deg, ${stops.map((c, i) => `${c} ${Math.round(i * step)}%`).join(", ")})`;
}

/** Relative luminance of a #rrggbb color (0 = black, 1 = white). */
function luminance(hex: string): number {
  const chan = (i: number) => parseInt(hex.slice(i, i + 2), 16) / 255;
  return 0.2126 * chan(1) + 0.7152 * chan(3) + 0.0722 * chan(5);
}

function isLightSidebar(def: TemplateDefinition): boolean {
  return luminance(def.colors.sidebar[0]!) > 0.6;
}

function contactSection(cv: CVData, inSidebar: boolean): string {
  const { email, phone, location, links, details } = cv.contact;
  const items = [
    phone && `<li>${esc(phone)}</li>`,
    email && `<li><a href="mailto:${esc(email)}">${esc(email)}</a></li>`,
    location && `<li>${esc(location)}</li>`,
    ...links.map((l) => `<li><a href="${esc(httpUrl(l.url))}">${esc(l.label || l.url)}</a></li>`),
    ...details.map(
      (d) => `<li><strong>${esc(d.label)}</strong>${d.value ? ` : ${esc(d.value)}` : ""}</li>`
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

function jobHead(title: string, dates: string, def: TemplateDefinition): string {
  if (def.datesStyle === "pill") {
    return `<div class="job-head"><h3>${title}</h3>${dates ? `<p class="meta"><strong>${esc(dates)}</strong></p>` : ""}</div>`;
  }
  return `<h3>${title}</h3>`;
}

function experienceSection(cv: CVData, def: TemplateDefinition): string {
  if (cv.experiences.length === 0) return "";
  const items = cv.experiences
    .map((e) => {
      const companyHtml = e.company
        ? e.companyUrl
          ? `<a href="${esc(httpUrl(e.companyUrl))}">${esc(e.company)}</a>`
          : esc(e.company)
        : "";
      const companyLine = [companyHtml, e.place ? esc(e.place) : ""].filter(Boolean).join(" — ");
      const inlineMeta =
        def.datesStyle === "pill"
          ? ""
          : `<p class="meta"><strong>${esc(e.dates)}</strong>${e.place && !companyLine ? `<em> · ${esc(e.place)}</em>` : ""}</p>`;
      const refs =
        e.links.length > 0
          ? `<p class="refs">${e.links
              .filter((l) => l.url)
              .map((l) => `<a href="${esc(httpUrl(l.url))}">${esc(l.label || l.url)}</a>`)
              .join(" · ")}</p>`
          : "";
      return `<article class="job">
      ${jobHead(esc(e.title), e.dates, def)}
      ${companyLine ? `<p class="company">${companyLine}</p>` : ""}
      ${inlineMeta}
      ${e.bullets.length ? `<ul>${e.bullets.map((b) => `<li>${inlineLinksToHtml(b, esc)}</li>`).join("")}</ul>` : ""}
      ${refs}
      ${e.stack.length ? `<p class="stack"><strong>Stack :</strong> <em>${e.stack.map(esc).join(", ")}</em></p>` : ""}
    </article>`;
    })
    .join("");
  return `<section class="experience"><h2>Expériences professionnelles</h2>${items}</section>`;
}

function educationSection(cv: CVData, def: TemplateDefinition): string {
  if (cv.education.length === 0) return "";
  const items = cv.education
    .map((e) => {
      const schoolLine = [e.school, e.place].filter(Boolean).map(esc).join(" — ");
      const inlineMeta =
        def.datesStyle === "pill" ? "" : `<p class="meta"><strong>${esc(e.dates)}</strong></p>`;
      return `<article class="job">
      ${jobHead(esc(e.degree), e.dates, def)}
      ${schoolLine ? `<p class="company">${schoolLine}</p>` : ""}
      ${inlineMeta}
      ${e.details ? `<p>${esc(e.details)}</p>` : ""}
    </article>`;
    })
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

function renderSection(
  id: SectionId,
  cv: CVData,
  def: TemplateDefinition,
  inSidebar: boolean
): string {
  switch (id) {
    case "contact":
      return contactSection(cv, inSidebar);
    case "summary":
      return summarySection(cv);
    case "experience":
      return experienceSection(cv, def);
    case "education":
      return educationSection(cv, def);
    case "skills":
      return skillsSection(cv, def);
    case "languages":
      return languagesSection(cv);
    case "interests":
      return interestsSection(cv);
  }
}

/** Name heading; in sidebar placement the last word gets the accent color. */
function nameHtml(cv: CVData, def: TemplateDefinition, accentLastWord: boolean): string {
  const words = cv.identity.fullName.trim().split(/\s+/);
  if (!accentLastWord || words.length < 2) return `<h1>${esc(cv.identity.fullName)}</h1>`;
  const last = words.pop()!;
  return `<h1>${esc(words.join(" "))}<br /><span style="color:${def.colors.band}">${esc(last)}</span></h1>`;
}

function headerHtml(cv: CVData, def: TemplateDefinition): string {
  const photo =
    def.photo && cv.identity.photoUrl
      ? `<img class="photo" src="${esc(cv.identity.photoUrl)}" alt="Photo de ${esc(cv.identity.fullName)}" />`
      : "";
  return `<header class="identity">
    <div>
      ${nameHtml(cv, def, false)}
      ${cv.identity.headline ? `<p class="headline">${esc(cv.identity.headline)}</p>` : ""}
    </div>
    ${photo}
  </header>`;
}

function baseCss(def: TemplateDefinition): string {
  const c = def.colors;
  const headerCss =
    def.headerStyle === "underline"
      ? `color: ${c.heading}; background: none; padding: 0 0 1mm;
         border-bottom: 2px solid ${c.band}; margin-bottom: 2.6mm;`
      : `background: ${c.band}; color: ${c.bandText}; padding: 1.4mm 2.5mm; margin-bottom: 2.4mm;`;
  const datesCss =
    def.datesStyle === "pill"
      ? `.job .job-head { display: flex; justify-content: space-between; align-items: baseline; gap: 3mm; }
         .job .meta strong {
           border: 1px solid ${c.band}; color: ${c.heading}; border-radius: 1.5mm;
           padding: .4mm 2mm; font-size: 7.8pt; white-space: nowrap;
         }`
      : `.job .job-head { display: block; }`;

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
  h1 { font-size: 19pt; letter-spacing: .5px; color: ${c.heading}; line-height: 1.15; }
  .headline { font-size: 10.5pt; font-style: italic; margin-top: 2mm; color: ${c.heading}; }
  section { margin-bottom: 4mm; }
  section > h2 {
    font-size: 10pt; text-transform: uppercase; letter-spacing: 1.2px;
    ${headerCss}
  }
  .job { margin-bottom: 3mm; page-break-inside: avoid; }
  .job h3 { font-size: 10pt; color: ${c.heading}; }
  .job .company { color: ${c.band}; font-weight: 600; font-size: 9pt; }
  .job .refs { font-size: 8.4pt; margin-top: 1mm; }
  .job .meta { font-size: 8.6pt; margin: .6mm 0 1.2mm; }
  ${datesCss}
  .job ul { padding-left: 4.5mm; }
  .job li { margin-bottom: .8mm; }
  .job .stack { font-size: 8.4pt; margin-top: 1mm; color: ${c.heading}; }
  .job .stack em { color: ${c.body}; }
  .photo { width: 30mm; height: ${def.photoShape === "circle" ? "30mm" : "34mm"}; object-fit: cover; border: 1.5px solid #ffffffcc; border-radius: ${def.photoShape === "circle" ? "50%" : "1.5mm"}; }
  .bricks { list-style: none; display: flex; flex-wrap: wrap; gap: 1.4mm; }
  .bricks li { padding: .8mm 2mm; border-radius: 1.2mm; font-size: 8pt; }
  .skill-list { padding-left: 4.5mm; }
  .contact ul, .languages ul { list-style: none; }
  .contact li, .languages li { margin-bottom: 1.2mm; word-break: break-word; }
  `;
}

function sidebarLayout(cv: CVData, def: TemplateDefinition): string {
  const c = def.colors;
  const light = isLightSidebar(def);
  const sidebar = def.sidebarSections.map((s) => renderSection(s, cv, def, true)).join("");
  const main = def.mainSections.map((s) => renderSection(s, cv, def, false)).join("");
  const photo =
    def.photo && cv.identity.photoUrl
      ? `<img class="photo" src="${esc(cv.identity.photoUrl)}" alt="Photo de ${esc(cv.identity.fullName)}" />`
      : "";
  const nameInSidebar = def.namePlacement === "sidebar";

  const sidebarName = nameInSidebar
    ? `<header class="identity">
        ${nameHtml(cv, def, true)}
        ${cv.identity.headline ? `<p class="headline">${esc(cv.identity.headline)}</p>` : ""}
      </header>`
    : "";
  const mainHeader = nameInSidebar
    ? ""
    : `<header class="identity">
        <div>
          ${nameHtml(cv, def, false)}
          ${cv.identity.headline ? `<p class="headline">${esc(cv.identity.headline)}</p>` : ""}
        </div>
      </header>`;

  // Chip and rule colors adapt to light vs dark sidebars.
  const chipCss = light
    ? `background: #ffffff; border: 1px solid #d5d9e2; color: ${c.body};`
    : `background: #ffffff22; border: 1px solid #ffffff55; color: ${c.sidebarText};`;
  const ruleColor = light ? c.band : "#ffffff66";

  return `<style>
    ${baseCss(def)}
    body { display: flex; min-height: 296mm; }
    .sidebar {
      width: 62mm; flex: none; padding: 8mm 5.5mm;
      background: ${gradientCss(c.sidebar)}; color: ${c.sidebarText};
    }
    .sidebar a { color: ${light ? c.link : c.sidebarText}; }
    .sidebar .identity { display: block; margin-bottom: 6mm; }
    .sidebar .identity h1 { font-size: 15pt; }
    .sidebar .identity .headline { font-size: 8.8pt; margin-top: 1.5mm; font-style: normal;
      color: ${light ? c.body : c.sidebarText}; }
    .sidebar section > h2 {
      background: none; padding: 0 0 1mm; margin: 4.5mm 0 2mm;
      border-bottom: 1px solid ${ruleColor};
      color: ${light ? c.heading : c.sidebarText};
    }
    .sidebar h3 { font-size: 8.8pt; margin: 2.2mm 0 1mm; color: ${light ? c.heading : c.sidebarText}; }
    .sidebar .photo { display: block; margin: 0 auto 4mm; }
    .sidebar .inline-skills { font-size: 8.4pt; }
    .sidebar .bricks li { ${chipCss} }
    .main { flex: 1; padding: 8mm 7mm 8mm 7mm; background: #ffffff; }
    .main .bricks li { background: #ffffff; border: 1px solid #d5d9e2; color: ${c.body}; }
    .identity { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5mm; }
  </style>
  <div class="sidebar">
    ${sidebarName}
    ${photo}
    ${sidebar}
  </div>
  <main class="main">
    ${mainHeader}
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
    .bricks li { background: #ffffff; border: 1px solid #d5d9e2; color: ${def.colors.body}; }
  </style>
  ${headerHtml(cv, def)}
  <main>${main}</main>`;
}

/** Full standalone HTML document for a CV + template definition. */
export function renderCVHtml(cv: CVData, def: TemplateDefinition): string {
  const content =
    def.layout === "sidebar-left" ? sidebarLayout(cv, def) : singleColumnLayout(cv, def);
  const logo = def.logo
    ? `<img class="cv-logo" src="${esc(def.logo)}" alt="" aria-hidden="true" />`
    : "";
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>CV — ${esc(cv.identity.fullName)}</title>
<style>
  body { position: relative; }
  .cv-logo {
    position: absolute; top: 7mm; right: 7mm;
    width: 22mm; height: 22mm; object-fit: contain; opacity: .9; z-index: 5;
  }
</style>
</head>
<body>
${logo}
${content}
</body>
</html>`;
}
