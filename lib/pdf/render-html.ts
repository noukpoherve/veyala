import { isLightHex } from "@/lib/color";
import type { CVData, CVSkillGroup } from "@/lib/cv-schema";
import { inlineLinksToHtml, normalizeHttpUrl } from "@/lib/inline-links";
import { withSoftSkillsGroup } from "@/lib/match-score";
import type { SectionId, TemplateDefinition } from "@/lib/templates/definition";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

/**
 * Renders a CV as a self-contained A4 HTML document, driven by a template
 * definition. Used both for the on-screen preview (iframe) and the PDF
 * export (Playwright print). Real selectable text, clickable links, ATS-safe.
 */

type CvCopy = ReturnType<typeof getMessages>["cv"];

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const httpUrl = normalizeHttpUrl;

function gradientCss(stops: string[]): string {
  if (stops.length === 1) return stops[0]!;
  const step = 100 / (stops.length - 1);
  return `linear-gradient(180deg, ${stops.map((c, i) => `${c} ${Math.round(i * step)}%`).join(", ")})`;
}

function isLightSidebar(def: TemplateDefinition): boolean {
  return isLightHex(def.colors.sidebar[0]!);
}

function contactSection(cv: CVData, inSidebar: boolean, copy: CvCopy): string {
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
    ${inSidebar ? `<h2>${esc(copy.information)}</h2>` : ""}
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

function skillsSection(cv: CVData, def: TemplateDefinition, copy: CvCopy): string {
  if (cv.skills.length === 0) return "";
  return `<section class="skills">
    <h2>${esc(copy.skills)}</h2>
    ${cv.skills.map((g) => skillGroupHtml(g, def.skillsStyle)).join("")}
  </section>`;
}

function summarySection(cv: CVData, copy: CvCopy): string {
  if (!cv.summary) return "";
  return `<section class="summary"><h2>${esc(copy.summary)}</h2><p>${esc(cv.summary)}</p></section>`;
}

function jobHead(title: string, dates: string, def: TemplateDefinition): string {
  if (def.datesStyle === "pill") {
    return `<div class="job-head"><h3>${title}</h3>${dates ? `<p class="meta"><strong>${esc(dates)}</strong></p>` : ""}</div>`;
  }
  return `<h3>${title}</h3>`;
}

/** Renders one job/project article. Experience and project entries share this markup. */
function experienceArticle(
  e: CVData["experiences"][number],
  def: TemplateDefinition,
  copy: CvCopy
): string {
  const href = e.companyUrl ? esc(httpUrl(e.companyUrl)) : "";
  const companyHtml = e.company
    ? href
      ? `<a href="${href}">${esc(e.company)}</a>`
      : esc(e.company)
    : "";
  const titleHtml = href && !e.company ? `<a href="${href}">${esc(e.title)}</a>` : esc(e.title);
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
      ${jobHead(titleHtml, e.dates, def)}
      ${companyLine ? `<p class="company">${companyLine}</p>` : ""}
      ${inlineMeta}
      ${e.bullets.length ? `<ul>${e.bullets.map((b) => `<li>${inlineLinksToHtml(b, esc)}</li>`).join("")}</ul>` : ""}
      ${refs}
      ${e.stack.length ? `<p class="stack"><strong>${esc(copy.stack)} :</strong> <em>${e.stack.map(esc).join(", ")}</em></p>` : ""}
    </article>`;
}

function experienceSection(cv: CVData, def: TemplateDefinition, copy: CvCopy): string {
  const experiences = cv.experiences.filter((e) => e.included !== false);
  const projects = (cv.projects ?? []).filter((p) => p.included !== false);
  const experienceBlock = experiences.length
    ? `<section class="experience"><h2>${esc(copy.experience)}</h2>${experiences.map((e) => experienceArticle(e, def, copy)).join("")}</section>`
    : "";
  // Personal projects always render after work experience, and never before it.
  const projectsBlock = projects.length
    ? `<section class="projects"><h2>${esc(copy.projects)}</h2>${projects.map((p) => experienceArticle(p, def, copy)).join("")}</section>`
    : "";
  return experienceBlock + projectsBlock;
}

function educationSection(cv: CVData, def: TemplateDefinition, copy: CvCopy): string {
  const list = cv.education.filter((e) => e.included !== false);
  if (list.length === 0) return "";
  const items = list
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
  return `<section class="education"><h2>${esc(copy.education)}</h2>${items}</section>`;
}

function certificationsSection(cv: CVData, def: TemplateDefinition, copy: CvCopy): string {
  const list = (cv.certifications ?? []).filter((c) => c.included !== false);
  if (list.length === 0) return "";
  const items = list
    .map((c) => {
      const issuerLine = [c.issuer, c.credentialId ? `ID ${c.credentialId}` : ""]
        .filter(Boolean)
        .map(esc)
        .join(" — ");
      const name = c.url ? `<a href="${esc(httpUrl(c.url))}">${esc(c.name)}</a>` : esc(c.name);
      const inlineMeta =
        def.datesStyle === "pill"
          ? ""
          : c.dates
            ? `<p class="meta"><strong>${esc(c.dates)}</strong></p>`
            : "";
      return `<article class="job">
      ${jobHead(name, c.dates, def)}
      ${issuerLine ? `<p class="company">${issuerLine}</p>` : ""}
      ${inlineMeta}
    </article>`;
    })
    .join("");
  return `<section class="certifications"><h2>${esc(copy.certifications)}</h2>${items}</section>`;
}

function languagesSection(cv: CVData, copy: CvCopy): string {
  if (cv.languages.length === 0) return "";
  return `<section class="languages"><h2>${esc(copy.languages)}</h2>
    <ul>${cv.languages.map((l) => `<li>${esc(l.name)}${l.level ? ` — ${esc(l.level)}` : ""}</li>`).join("")}</ul>
  </section>`;
}

function interestsSection(cv: CVData, copy: CvCopy): string {
  if (cv.interests.length === 0) return "";
  return `<section class="interests"><h2>${esc(copy.interests)}</h2>
    <p>${cv.interests.map(esc).join(" · ")}</p>
  </section>`;
}

function renderSection(
  id: SectionId,
  cv: CVData,
  def: TemplateDefinition,
  inSidebar: boolean,
  copy: CvCopy
): string {
  switch (id) {
    case "contact":
      return contactSection(cv, inSidebar, copy);
    case "summary":
      return summarySection(cv, copy);
    case "experience":
      return experienceSection(cv, def, copy);
    case "education":
      return educationSection(cv, def, copy);
    case "certifications":
      return certificationsSection(cv, def, copy);
    case "skills":
      return skillsSection(cv, def, copy);
    case "languages":
      return languagesSection(cv, copy);
    case "interests":
      return interestsSection(cv, copy);
  }
}

/** CSS for skill bricks from template chip overrides (solid / outline / ghost). */
function brickItemCss(
  def: TemplateDefinition,
  opts: { lightSidebar: boolean; inSidebar: boolean }
): string {
  const { lightSidebar, inSidebar } = opts;
  const defaultBorder = inSidebar && !lightSidebar ? "#ffffff55" : "#d5d9e2";
  const defaultText = inSidebar && !lightSidebar ? def.colors.sidebarText : def.colors.body;
  const defaultBg = inSidebar && !lightSidebar ? "#ffffff22" : "#ffffff";
  const border = def.chipBorder ?? defaultBorder;
  const text = def.chipText ?? defaultText;
  const style = def.chipStyle ?? "solid";

  if (style === "ghost") {
    return `background: transparent; border: 1px solid ${border}; color: ${text};`;
  }
  if (style === "outline") {
    return `background: transparent; border: 1.5px solid ${def.chipBorder ?? def.colors.band}; color: ${def.chipText ?? def.colors.heading};`;
  }
  return `background: ${def.chipBackground ?? defaultBg}; border: 1px solid ${border}; color: ${text};`;
}

/** Name heading; in sidebar placement the last word gets the accent color. */
function nameHtml(cv: CVData, def: TemplateDefinition, accentLastWord: boolean): string {
  const words = cv.identity.fullName.trim().split(/\s+/);
  if (!accentLastWord || words.length < 2) return `<h1>${esc(cv.identity.fullName)}</h1>`;
  const last = words.pop()!;
  return `<h1>${esc(words.join(" "))}<br /><span style="color:${def.colors.band}">${esc(last)}</span></h1>`;
}

function headerHtml(cv: CVData, def: TemplateDefinition, copy: CvCopy): string {
  const photo =
    def.photo && cv.identity.photoUrl
      ? `<img class="photo" src="${esc(cv.identity.photoUrl)}" alt="${esc(copy.photoAlt(cv.identity.fullName))}" />`
      : "";
  return `<header class="identity">
    <div>
      ${nameHtml(cv, def, false)}
      ${cv.identity.headline ? `<p class="headline">${esc(cv.identity.headline)}</p>` : ""}
    </div>
    ${photo}
  </header>`;
}

/** Repeating 8mm gaps at the top/bottom of every printed page, without
 *  shrinking the full-bleed sidebar rail (which `@page` margins would do).
 *  Horizontal padding lives on an inner div: padding on the `<td>` itself
 *  inflates the table past 210mm in Chromium and clips later pages. */
function columnFlow(inner: string): string {
  return `<table class="col-flow">
    <thead><tr><td class="page-gap">&nbsp;</td></tr></thead>
    <tfoot><tr><td class="page-gap">&nbsp;</td></tr></tfoot>
    <tbody><tr><td><div class="col-pad">${inner}</div></td></tr></tbody>
  </table>`;
}

function baseCss(def: TemplateDefinition): string {
  const c = def.colors;
  const headerCss =
    def.headerStyle === "underline"
      ? `color: ${c.heading}; background: none; padding: 0 0 1mm;
         border-bottom: 2px solid ${c.band}; margin-bottom: 2.6mm;`
      : `background: ${c.band}; color: ${c.bandText}; padding: 1.8mm 3mm; margin-bottom: 2.4mm;`;
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
  html, body { width: 210mm; }
  .col-flow { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .col-flow td { border: none; padding: 0; vertical-align: top; }
  .col-flow thead { display: table-header-group; }
  .col-flow tfoot { display: table-footer-group; }
  .page-gap { height: 8mm; font-size: 0; line-height: 0; }
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

function sidebarLayout(cv: CVData, def: TemplateDefinition, copy: CvCopy): string {
  const c = def.colors;
  const light = isLightSidebar(def);
  const sidebar = def.sidebarSections.map((s) => renderSection(s, cv, def, true, copy)).join("");
  const main = def.mainSections.map((s) => renderSection(s, cv, def, false, copy)).join("");
  const photo =
    def.photo && cv.identity.photoUrl
      ? `<img class="photo" src="${esc(cv.identity.photoUrl)}" alt="${esc(copy.photoAlt(cv.identity.fullName))}" />`
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

  // Chip and rule colors adapt to light vs dark sidebars + user chip overrides.
  const sidebarBrickCss = brickItemCss(def, { lightSidebar: light, inSidebar: true });
  const mainBrickCss = brickItemCss(def, { lightSidebar: light, inSidebar: false });
  const ruleColor = light ? c.band : "#ffffff66";

  const railImage = c.sidebar.length > 1 ? gradientCss(c.sidebar) : "none";

  return `<style>
    ${baseCss(def)}
    /* Full-bleed sheet: @page margins would shrink the rail. */
    @page { size: A4; margin: 0; }
    html, body { min-height: 297mm; }
    body { display: flex; align-items: stretch; position: relative; }
    .sidebar-rail {
      display: none;
      background-color: ${c.sidebar[0]};
      background-image: ${railImage};
      background-size: 62mm 297mm; background-repeat: repeat-y;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .sidebar {
      width: 62mm; flex: none; padding: 0; align-self: stretch;
      min-height: 297mm;
      background: ${gradientCss(c.sidebar)}; color: ${c.sidebarText};
    }
    .sidebar .col-pad { padding: 0 5.5mm; }
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
    .sidebar .bricks li { ${sidebarBrickCss} }
    .main { flex: 1; padding: 0; background: #ffffff; min-height: 297mm; }
    .main .col-pad { padding: 0 7mm; }
    .main .bricks li { ${mainBrickCss} }
    .identity { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5mm; }
    @media print {
      html, body { min-height: 0; }
      body { display: block; }
      body::after { content: ""; display: block; clear: both; }
      .sidebar-rail {
        display: block; position: fixed; top: 0; left: 0; width: 62mm; height: 297mm;
        z-index: 0;
      }
      .sidebar {
        float: left; width: 62mm; min-height: 0; background: none;
        position: relative; z-index: 1;
      }
      .main { margin-left: 62mm; min-height: 297mm; position: relative; z-index: 1; }
    }
  </style>
  <div class="sidebar-rail" aria-hidden="true"></div>
  <div class="sidebar">
    ${columnFlow(`${sidebarName}${photo}${sidebar}`)}
  </div>
  <main class="main">
    ${columnFlow(`${mainHeader}${main}`)}
  </main>`;
}

function singleColumnLayout(cv: CVData, def: TemplateDefinition, copy: CvCopy): string {
  const main = def.mainSections.map((s) => renderSection(s, cv, def, false, copy)).join("");
  const brickCss = brickItemCss(def, { lightSidebar: true, inSidebar: false });
  return `<style>
    ${baseCss(def)}
    /* No rail to protect: real @page margins inset every page, including splits. */
    @page { size: A4; margin: 12mm 14mm; }
    body { padding: 12mm 14mm; }
    @media print { body { padding: 0; } }
    .identity { display: flex; justify-content: space-between; align-items: center;
      border-bottom: 2px solid ${def.colors.heading}; padding-bottom: 3mm; margin-bottom: 5mm; }
    .contact ul { display: flex; flex-wrap: wrap; justify-content: flex-start; gap: 1mm 5mm; }
    .bricks li { ${brickCss} }
  </style>
  ${headerHtml(cv, def, copy)}<main>${main}</main>`;
}

/** Full standalone HTML document for a CV + template definition. */
export function renderCVHtml(cv: CVData, def: TemplateDefinition, locale: Locale = "fr"): string {
  const data = withSoftSkillsGroup(cv);
  const copy = getMessages(locale).cv;
  const content =
    def.layout === "sidebar-left"
      ? sidebarLayout(data, def, copy)
      : singleColumnLayout(data, def, copy);
  const logo = def.logo
    ? `<img class="cv-logo" src="${esc(def.logo)}" alt="" aria-hidden="true" />`
    : "";
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<title>${esc(copy.documentTitle(cv.identity.fullName))}</title>
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
