import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { cvSchema } from "../lib/cv-schema";
import { OFFICIAL_TEMPLATES } from "../lib/templates/official";
import { renderCVHtml } from "../lib/pdf/render-html";
import { htmlToPdf } from "../lib/pdf";
import { renderCVDocx } from "../lib/docx";

/** Renders a demo CV with every official template (dev sanity check). */

const demoCV = cvSchema.parse({
  identity: {
    fullName: "Jean Dupont",
    headline: "Développeur Full-Stack — React, Node.js, PostgreSQL",
  },
  contact: {
    email: "jean.dupont@mail.fr",
    phone: "06 12 34 56 78",
    location: "Paris, France",
    links: [
      { label: "LinkedIn", url: "https://linkedin.com/in/jdupont" },
      { label: "GitHub", url: "https://github.com/jdupont" },
    ],
  },
  summary:
    "Développeur full-stack avec 5 ans d'expérience sur des plateformes SaaS à fort trafic. Spécialisé en TypeScript de bout en bout, performance front et industrialisation CI/CD. Disponible immédiatement.",
  experiences: [
    {
      title: "Développeur Full-Stack Senior",
      company: "Acme SaaS",
      place: "Paris",
      dates: "2022 — 2025",
      bullets: [
        "Conception et développement d'une plateforme multi-tenant Next.js/PostgreSQL servant 40 000 utilisateurs actifs mensuels.",
        "Réduction de 45 % du temps de chargement via le rendu serveur, le cache HTTP et l'optimisation des requêtes Prisma.",
        "Mise en place de la CI/CD GitLab (tests, lint, déploiements bleu-vert) et du monitoring Grafana.",
      ],
      stack: ["Next.js", "TypeScript", "PostgreSQL", "Docker", "GitLab CI"],
    },
    {
      title: "Développeur Back-End",
      company: "Startup Labs",
      place: "Lyon",
      dates: "2020 — 2022",
      bullets: [
        "Développement d'APIs REST Node.js/Express consommées par 3 applications mobiles.",
        "Migration progressive d'un monolithe PHP vers des services Node.js sans interruption de service.",
      ],
      stack: ["Node.js", "Express", "MongoDB", "Redis"],
    },
  ],
  education: [
    {
      degree: "Master Informatique",
      school: "Université Paris-Saclay",
      place: "Paris",
      dates: "2018 — 2020",
      details: "Spécialité génie logiciel — major de promotion.",
    },
  ],
  skills: [
    { category: "Front-end", items: ["React", "Next.js", "TypeScript", "Tailwind CSS"] },
    { category: "Back-end", items: ["Node.js", "PostgreSQL", "Prisma", "Redis"] },
    { category: "DevOps", items: ["Docker", "GitLab CI", "Grafana", "AWS"] },
  ],
  languages: [
    { name: "Français", level: "Langue maternelle" },
    { name: "Anglais", level: "Courant (C1)" },
  ],
  interests: ["Open source", "Escalade", "Échecs"],
});

async function main() {
  const outDir = process.argv[2] ?? path.join(process.cwd(), "demo-output");
  await mkdir(outDir, { recursive: true });

  for (const template of OFFICIAL_TEMPLATES) {
    const html = renderCVHtml(demoCV, template.definition);
    const [pdf, docx] = await Promise.all([
      htmlToPdf(html),
      renderCVDocx(demoCV, template.definition),
    ]);
    await Promise.all([
      writeFile(path.join(outDir, `${template.slug}.html`), html),
      writeFile(path.join(outDir, `${template.slug}.pdf`), pdf),
      writeFile(path.join(outDir, `${template.slug}.docx`), docx),
    ]);
    console.log(`✓ ${template.name} → ${template.slug}.{html,pdf,docx}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
