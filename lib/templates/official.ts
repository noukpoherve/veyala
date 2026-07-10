import type { TemplateDefinition } from "./definition";

/** Built-in templates seeded as APPROVED and public. */
export interface OfficialTemplate {
  name: string;
  slug: string;
  engine: "DOCX" | "HTML";
  definition: TemplateDefinition;
}

/** Signature design: blue → purple → burgundy gradient sidebar, skill bricks, blue bands. */
const signature: OfficialTemplate = {
  name: "Signature — dégradé",
  slug: "signature-degrade",
  engine: "HTML",
  definition: {
    layout: "sidebar-left",
    colors: {
      sidebar: ["#5491c7", "#49558f", "#583974", "#883454", "#a03e50"],
      sidebarText: "#ffffff",
      band: "#56a8dc",
      bandText: "#ffffff",
      heading: "#1f3550",
      body: "#555555",
      link: "#2563eb",
    },
    fonts: { heading: "Century Gothic", body: "Century Gothic" },
    photo: true,
    skillsStyle: "bricks",
    headerStyle: "band",
    namePlacement: "main",
    datesStyle: "inline",
    sidebarSections: ["contact", "skills", "languages"],
    mainSections: ["summary", "experience", "education"],
    sidebarImageAsset: "assets/sidebar.png",
  },
};

/** Light sidebar, blue accents, underlined titles, date pills — "Cadre" style. */
const cadre: OfficialTemplate = {
  name: "Cadre — bleu",
  slug: "cadre-bleu",
  engine: "HTML",
  definition: {
    layout: "sidebar-left",
    colors: {
      sidebar: ["#f4f6f9"],
      sidebarText: "#1f2937",
      band: "#3b5bdb",
      bandText: "#ffffff",
      heading: "#111827",
      body: "#4b5563",
      link: "#3b5bdb",
    },
    fonts: { heading: "Helvetica", body: "Helvetica" },
    photo: false,
    skillsStyle: "bricks",
    headerStyle: "underline",
    namePlacement: "sidebar",
    datesStyle: "pill",
    sidebarSections: ["contact", "skills", "languages", "interests"],
    mainSections: ["summary", "experience", "education"],
  },
};

/** Clean single-column layout, maximum ATS compatibility. */
const clarte: OfficialTemplate = {
  name: "Clarté — classique",
  slug: "clarte-classique",
  engine: "HTML",
  definition: {
    layout: "single-column",
    colors: {
      sidebar: ["#ffffff"],
      sidebarText: "#1f2937",
      band: "#111827",
      bandText: "#ffffff",
      heading: "#111827",
      body: "#374151",
      link: "#1d4ed8",
    },
    fonts: { heading: "Georgia", body: "Helvetica" },
    photo: false,
    skillsStyle: "inline",
    headerStyle: "band",
    namePlacement: "main",
    datesStyle: "inline",
    sidebarSections: [],
    mainSections: ["contact", "summary", "experience", "skills", "education", "languages", "interests"],
  },
};

/** Two-column layout with a solid deep-navy sidebar. */
const horizon: OfficialTemplate = {
  name: "Horizon — bleu nuit",
  slug: "horizon-bleu-nuit",
  engine: "HTML",
  definition: {
    layout: "sidebar-left",
    colors: {
      sidebar: ["#16324f"],
      sidebarText: "#ffffff",
      band: "#16324f",
      bandText: "#ffffff",
      heading: "#16324f",
      body: "#4b5563",
      link: "#0e7490",
    },
    fonts: { heading: "Trebuchet MS", body: "Trebuchet MS" },
    photo: true,
    skillsStyle: "list",
    headerStyle: "band",
    namePlacement: "main",
    datesStyle: "inline",
    sidebarSections: ["contact", "skills", "languages", "interests"],
    mainSections: ["summary", "experience", "education"],
  },
};

export const OFFICIAL_TEMPLATES: OfficialTemplate[] = [signature, cadre, clarte, horizon];
