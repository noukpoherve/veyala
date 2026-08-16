import "server-only";
import { chat } from "@/lib/llm";
import { cvForLLM, type CVData } from "@/lib/cv-schema";
import { GENERATED_COPY_TYPOGRAPHY, stripEmDashes } from "@/lib/typography";

const MAX_JOB_TEXT_PROMPT_CHARS = 6000;

const SYSTEM_PROMPT = `Tu es un expert en candidatures et en recrutement.
On te donne le CV d'un candidat (JSON) et le texte d'une offre d'emploi.
Rédige la lettre de motivation en français.

Règles STRICTES :
- N'invente AUCUN fait : uniquement les expériences, compétences et formations présentes dans le CV.
- 4 paragraphes, 250 à 350 mots au total : accroche liée au poste et à la situation actuelle du candidat ; expériences les plus pertinentes pour l'offre (avec exemples concrets du CV) ; qualités et méthode de travail visibles dans le CV ; disponibilité et proposition d'entretien.
- Ton professionnel, direct, sans flagornerie ni formules creuses.
- Commence par « Madame, Monsieur, » et termine par une formule de politesse sobre (ex. « Cordialement, ») SANS répéter le nom du candidat après.
- Réponds UNIQUEMENT avec le corps de la lettre (pas d'en-tête, pas de coordonnées, pas d'objet, pas de signature).
- ${GENERATED_COPY_TYPOGRAPHY}`;

export interface CoverLetterParams {
  cv: CVData;
  jobText: string;
  jobTitle: string;
  instructions?: string;
  language?: string;
}

/** Writes the cover letter body from the tailored CV and the job posting. */
export async function writeCoverLetter(params: CoverLetterParams): Promise<string> {
  const user = [
    `CV DU CANDIDAT (JSON) :\n${JSON.stringify(cvForLLM(params.cv))}`,
    `OFFRE D'EMPLOI :\n${params.jobText.slice(0, MAX_JOB_TEXT_PROMPT_CHARS)}`,
    `INTITULÉ DU POSTE : ${params.jobTitle}`,
    params.instructions && `CONSIGNES DU CANDIDAT : ${params.instructions}`,
    params.language && `LANGUE DE LA LETTRE : ${params.language}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const raw = await chat({ system: SYSTEM_PROMPT, user, maxTokens: 1200, temperature: 0.5 });
  const body = raw.replace(/```/g, "").trim();
  if (body.length < 200) {
    throw new Error("La lettre générée est trop courte. Réessayez.");
  }
  return stripEmDashes(body);
}
