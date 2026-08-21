import "server-only";
import { chat } from "@/lib/llm";
import { cvForLLM, type CVData } from "@/lib/cv-schema";
import {
  GENERATED_COPY_TYPOGRAPHY,
  GENERATED_COPY_TYPOGRAPHY_EN,
  stripEmDashes,
} from "@/lib/typography";
import { isEnglishGeneration } from "@/lib/generation-locale";
import type { Locale } from "@/i18n/config";

const MAX_JOB_TEXT_PROMPT_CHARS = 6000;

const SYSTEM_PROMPT_FR = `Tu es un expert en candidatures et en recrutement.
On te donne le CV d'un candidat (JSON) et le texte d'une offre d'emploi.
Rédige la lettre de motivation en français.

Règles STRICTES :
- N'invente AUCUN fait : uniquement les expériences, compétences et formations présentes dans le CV.
- 4 paragraphes, 250 à 350 mots au total : accroche liée au poste et à la situation actuelle du candidat ; expériences les plus pertinentes pour l'offre (avec exemples concrets du CV) ; qualités et méthode de travail visibles dans le CV ; disponibilité et proposition d'entretien.
- Ton professionnel, direct, sans flagornerie ni formules creuses.
- Commence par « Madame, Monsieur, » et termine par une formule de politesse sobre (ex. « Cordialement, ») SANS répéter le nom du candidat après.
- Réponds UNIQUEMENT avec le corps de la lettre (pas d'en-tête, pas de coordonnées, pas d'objet, pas de signature).
- ${GENERATED_COPY_TYPOGRAPHY}`;

const SYSTEM_PROMPT_EN = `You are an expert recruiter and hiring-manager-facing writer.
You receive a candidate resume as JSON and a job posting.
Write a genuine English cover letter.

STRICT rules:
- Invent nothing. Use only experience, skills, and education already in the resume.
- 3 short paragraphs, 250 to 320 words: a specific hook tied to the role; 2-3 evidence-based achievements from the resume that match the posting; a confident close offering to talk, without flattery or empty adjectives.
- Professional, concise, natural US business English. No "Madame, Monsieur". No French closing formulas.
- Open with "Dear Hiring Manager," and close with "Sincerely," without repeating the candidate's name.
- Return ONLY the letter body (no header, no address block, no subject line, no signature block).
- ${GENERATED_COPY_TYPOGRAPHY_EN}`;

export interface CoverLetterParams {
  cv: CVData;
  jobText: string;
  jobTitle: string;
  instructions?: string;
  language?: string;
  uiLocale?: Locale;
}

/** Writes the cover letter body from the tailored CV and the job posting. */
export async function writeCoverLetter(params: CoverLetterParams): Promise<string> {
  const english = isEnglishGeneration(params.language, params.uiLocale);
  const user = english
    ? [
        `CANDIDATE RESUME (JSON):\n${JSON.stringify(cvForLLM(params.cv))}`,
        `JOB POSTING:\n${params.jobText.slice(0, MAX_JOB_TEXT_PROMPT_CHARS)}`,
        `ROLE TITLE: ${params.jobTitle}`,
        params.instructions && `CANDIDATE NOTES: ${params.instructions}`,
        `LETTER LANGUAGE: English`,
      ]
    : [
        `CV DU CANDIDAT (JSON) :\n${JSON.stringify(cvForLLM(params.cv))}`,
        `OFFRE D'EMPLOI :\n${params.jobText.slice(0, MAX_JOB_TEXT_PROMPT_CHARS)}`,
        `INTITULÉ DU POSTE : ${params.jobTitle}`,
        params.instructions && `CONSIGNES DU CANDIDAT : ${params.instructions}`,
        params.language && `LANGUE DE LA LETTRE : ${params.language}`,
      ];

  const raw = await chat({
    system: english ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_FR,
    user: user.filter(Boolean).join("\n\n"),
    maxTokens: 1200,
    temperature: 0.5,
  });
  const body = raw.replace(/```/g, "").trim();
  if (body.length < 200) {
    throw new Error("La lettre générée est trop courte. Réessayez.");
  }
  return stripEmDashes(body);
}
