import "server-only";
import { chat } from "@/lib/llm";
import { cvForLLM, type CVData } from "@/lib/cv-schema";
import type { FormationRequirements } from "@/lib/campus-france/program-analysis";
import { GENERATED_COPY_TYPOGRAPHY, stripEmDashes } from "@/lib/typography";

const MAX_PROMPT_CHARS = 6000;

const SYSTEM_PROMPT = `Tu es un expert des dossiers Campus France et des lettres de motivation pour formations sélectives.
On te donne le CV d'un candidat (JSON), sa fiche de formation, son projet d'études et son projet professionnel.
Rédige la lettre de motivation destinée au jury de sélection.

Règles STRICTES :
- N'invente AUCUN fait : uniquement le parcours du CV et ce qui est écrit dans les projets fournis.
- Objectif : convaincre le jury que le candidat a le profil pour être sélectionné.
- Structure en 4 à 5 paragraphes (280 à 420 mots) :
  1) Accroche : formation ciblée + situation actuelle du candidat.
  2) Cohérence académique : lien entre parcours (formations / expériences du CV) et la formation.
  3) Projet d'études : pourquoi CETTE formation, ce qu'il compte y apprendre (d'après son projet).
  4) Projet professionnel : débouchés / ambition et comment la formation y mène.
  5) Clôture sobre (disponibilité pour le dossier, sans demander un entretien d'embauche).
- Ton sérieux, clair, sans flagornerie ni formules creuses.
- Commence par « Madame, Monsieur, » et termine par une formule de politesse sobre (ex. « Cordialement, ») SANS répéter le nom du candidat après.
- Réponds UNIQUEMENT avec le corps de la lettre (pas d'en-tête, pas de coordonnées, pas d'objet, pas de signature).
- ${GENERATED_COPY_TYPOGRAPHY}`;

export interface MotivationLetterParams {
  cv: CVData;
  programText: string;
  programTitle: string;
  studyProject: string;
  professionalProject: string;
  requirements?: FormationRequirements;
  instructions?: string;
  language?: string;
}

/** Writes a Campus France selection-focused motivation letter. */
export async function writeCampusFranceMotivationLetter(
  params: MotivationLetterParams
): Promise<string> {
  const criteria = params.requirements
    ? [
        params.requirements.prerequisites.length
          ? `Prérequis : ${params.requirements.prerequisites.join(", ")}`
          : "",
        params.requirements.objectives.length
          ? `Objectifs : ${params.requirements.objectives.join(", ")}`
          : "",
        params.requirements.targetSkills.length
          ? `Compétences visées : ${params.requirements.targetSkills.join(", ")}`
          : "",
        params.requirements.outcomes.length
          ? `Débouchés : ${params.requirements.outcomes.join(", ")}`
          : "",
        params.requirements.selectionCriteria.length
          ? `Critères de sélection : ${params.requirements.selectionCriteria.join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const user = [
    `CV DU CANDIDAT (JSON) :\n${JSON.stringify(cvForLLM(params.cv))}`,
    `FICHE DE FORMATION :\n${params.programText.slice(0, MAX_PROMPT_CHARS)}`,
    `INTITULÉ DE LA FORMATION : ${params.programTitle}`,
    `PROJET D'ÉTUDES DU CANDIDAT :\n${params.studyProject.slice(0, 3500)}`,
    `PROJET PROFESSIONNEL DU CANDIDAT :\n${params.professionalProject.slice(0, 3500)}`,
    criteria && `CRITÈRES EXTRAITS DE LA FICHE :\n${criteria}`,
    params.instructions && `CONSIGNES DU CANDIDAT : ${params.instructions}`,
    params.language && `LANGUE DE LA LETTRE : ${params.language}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const raw = await chat({ system: SYSTEM_PROMPT, user, maxTokens: 1400, temperature: 0.45 });
  const body = raw.replace(/```/g, "").trim();
  if (body.length < 220) {
    throw new Error("La lettre générée est trop courte. Réessayez.");
  }
  return stripEmDashes(body);
}
