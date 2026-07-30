import { bodyPlainText, countHeadings, countWords, markdownToBlocks } from "@/lib/blog/markdown";
import type { ContentBlock } from "@/lib/blog/types";

export const PUBLISH_MIN_SCORE = 70;

export type SeoCheck = {
  id: string;
  label: string;
  ok: boolean;
  hint: string;
  weight: number;
};

export type SeoScoreInput = {
  title: string;
  description: string;
  slug: string;
  excerpt: string;
  focusKeyword: string;
  tags: string[];
  keywords: string[];
  bodyMarkdown: string;
  faqCount: number;
};

export type SeoScoreResult = {
  score: number;
  checks: SeoCheck[];
  canPublish: boolean;
};

export function scoreSeo(input: SeoScoreInput): SeoScoreResult {
  const blocks = markdownToBlocks(input.bodyMarkdown || "");
  const words = countWords(blocks);
  const h2 = countHeadings(blocks, "h2");
  const plain = bodyPlainText(blocks).toLowerCase();
  const focus = input.focusKeyword.trim().toLowerCase();
  const titleLen = input.title.trim().length;
  const descLen = input.description.trim().length;
  const hasCta = blocks.some((block) => block.type === "cta");

  const checks: SeoCheck[] = [
    {
      id: "title-length",
      label: "Titre entre 40 et 65 caractères",
      ok: titleLen >= 40 && titleLen <= 65,
      hint: `Actuellement ${titleLen} car.`,
      weight: 12,
    },
    {
      id: "description-length",
      label: "Meta description entre 140 et 160 caractères",
      ok: descLen >= 140 && descLen <= 160,
      hint: `Actuellement ${descLen} car.`,
      weight: 14,
    },
    {
      id: "slug",
      label: "Slug propre (minuscules, tirets)",
      ok: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug.trim()),
      hint: "Ex. passer-filtres-ats-cv",
      weight: 10,
    },
    {
      id: "focus-present",
      label: "Mot-clé principal renseigné",
      ok: focus.length >= 3,
      hint: "Ex. CV ATS, lettre de motivation…",
      weight: 8,
    },
    {
      id: "focus-title",
      label: "Mot-clé dans le titre",
      ok: Boolean(focus) && input.title.toLowerCase().includes(focus),
      hint: "Incluez le mot-clé principal dans le H1/titre",
      weight: 10,
    },
    {
      id: "focus-description",
      label: "Mot-clé dans la meta description",
      ok: Boolean(focus) && input.description.toLowerCase().includes(focus),
      hint: "Répétez le mot-clé une fois, naturellement",
      weight: 8,
    },
    {
      id: "focus-slug",
      label: "Mot-clé reflété dans le slug",
      ok: Boolean(focus) && slugContainsFocus(input.slug, focus),
      hint: "Le slug doit reprendre l’idée du mot-clé",
      weight: 6,
    },
    {
      id: "focus-intro",
      label: "Mot-clé dans l’introduction",
      ok: Boolean(focus) && plain.slice(0, 400).includes(focus),
      hint: "Placez-le dans les ~400 premiers caractères",
      weight: 8,
    },
    {
      id: "h2",
      label: "Au moins 3 intertitres H2",
      ok: h2 >= 3,
      hint: `Actuellement ${h2} H2 (## Titre)`,
      weight: 10,
    },
    {
      id: "length",
      label: "Contenu ≥ 800 mots",
      ok: words >= 800,
      hint: `Actuellement ~${words} mots`,
      weight: 12,
    },
    {
      id: "tags",
      label: "Au moins 2 tags",
      ok: input.tags.filter(Boolean).length >= 2,
      hint: "Tags utiles pour le maillage et la découverte",
      weight: 4,
    },
    {
      id: "keywords",
      label: "Au moins 3 mots-clés SEO",
      ok: input.keywords.filter(Boolean).length >= 3,
      hint: "Variantes / longue traîne",
      weight: 4,
    },
    {
      id: "excerpt",
      label: "Extrait renseigné (≥ 80 car.)",
      ok: input.excerpt.trim().length >= 80,
      hint: "Sert aux cartes blog et au partage",
      weight: 4,
    },
    {
      id: "cta",
      label: "CTA interne dans l’article",
      ok: hasCta,
      hint: "Bloc @@cta|/register|Label",
      weight: 5,
    },
    {
      id: "faq",
      label: "FAQ (bonus)",
      ok: input.faqCount >= 2,
      hint: "2+ questions → rich results FAQ",
      weight: 5,
    },
  ];

  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  const earned = checks.reduce((sum, check) => sum + (check.ok ? check.weight : 0), 0);
  const score = Math.round((earned / totalWeight) * 100);

  return {
    score,
    checks,
    canPublish: score >= PUBLISH_MIN_SCORE,
  };
}

function slugContainsFocus(slug: string, focus: string): boolean {
  const normalizedSlug = slug.toLowerCase();
  const tokens = focus
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
  if (!tokens.length) return normalizedSlug.includes(focus.replace(/\s+/g, "-"));
  return tokens.some((token) => normalizedSlug.includes(token));
}

/** Lightweight live scoring from raw form strings (client-safe). */
export function scoreSeoFromForm(values: {
  title: string;
  description: string;
  slug: string;
  excerpt: string;
  focusKeyword: string;
  tagsCsv: string;
  keywordsCsv: string;
  bodyMarkdown: string;
  faqCount: number;
}): SeoScoreResult {
  return scoreSeo({
    title: values.title,
    description: values.description,
    slug: values.slug,
    excerpt: values.excerpt,
    focusKeyword: values.focusKeyword,
    tags: splitCsv(values.tagsCsv),
    keywords: splitCsv(values.keywordsCsv),
    bodyMarkdown: values.bodyMarkdown,
    faqCount: values.faqCount,
  });
}

export function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function hasInternalCta(blocks: ContentBlock[]): boolean {
  return blocks.some((block) => block.type === "cta");
}
