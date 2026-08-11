import "server-only";
import { z } from "zod";
import { chatJSON } from "@/lib/llm";
import { cvForLLM, type CVData } from "@/lib/cv-schema";
import type { FormationRequirements } from "@/lib/campus-france/program-analysis";
import { PROJECT_MAX, PROJECT_MIN } from "@/lib/campus-france/schema";

const proposedSchema = z.object({
  studyProject: z.string().min(1),
  professionalProject: z.string().min(1),
});

export interface ProposedProjects {
  studyProject: string;
  professionalProject: string;
}

const SYSTEM_PROMPT = `Tu aides un candidat Campus France à rédiger un projet d'études et un projet professionnel COHÉRENTS avec une formation cible et son parcours réel.
Réponds UNIQUEMENT avec un JSON valide :
{"studyProject":"…","professionalProject":"…"}

Règles STRICTES :
- Ancre-toi UNIQUEMENT sur le CV fourni (formations, expériences, compétences, langues) et sur les critères de la formation.
- N'invente AUCUN diplôme, stage, entreprise, compétence ou résultat absent du CV.
- Tu peux formuler des ambitions réalistes alignées sur les débouchés de la formation, sans inventer un passé.
- studyProject (120–220 mots) : pourquoi CETTE formation, ce qu'il compte y apprendre, lien avec son parcours.
- professionalProject (100–180 mots) : métier / secteur visé cohérent avec les débouchés ; comment la formation y mène.
- Ton sérieux, concret, à la 1ère personne (« Je… »).
- Pas de titres, pas de listes à puces, pas de markdown : deux blocs de prose.`;

function clampProject(text: string): string {
  return text.replace(/```/g, "").trim().slice(0, PROJECT_MAX);
}

/** Deterministic draft when the LLM is unavailable — still editable by the user. */
export function proposeProjectsHeuristic(
  cv: CVData,
  requirements: FormationRequirements
): ProposedProjects {
  const title = requirements.title || "cette formation";
  const domain = requirements.domain || title;
  const level = requirements.level ? ` (${requirements.level})` : "";
  const education = cv.education[0];
  const experience = cv.experiences[0];
  const skills = cv.skills
    .flatMap((g) => g.items)
    .slice(0, 6)
    .join(", ");
  const outcomes = requirements.outcomes.slice(0, 3).join(", ");
  const objectives = requirements.objectives.slice(0, 4).join(", ");

  const pastBits = [
    education
      ? `mon parcours en ${education.degree}${education.school ? ` (${education.school})` : ""}`
      : null,
    experience
      ? `mon expérience en tant que ${experience.title}${experience.company ? ` chez ${experience.company}` : ""}`
      : null,
    skills ? `mes compétences en ${skills}` : null,
  ].filter(Boolean);

  const studyProject = clampProject(
    [
      `Je souhaite intégrer ${title}${level} afin de renforcer mon expertise dans le domaine ${domain}.`,
      pastBits.length
        ? `Cette orientation s'inscrit dans la continuité de ${pastBits.join(" et de ")}.`
        : `Cette orientation s'inscrit dans la continuité de mon parcours académique et professionnel.`,
      objectives
        ? `Au sein de la formation, je vise particulièrement : ${objectives}.`
        : `Je compte y approfondir les compétences techniques et méthodologiques attendues par le cursus.`,
      `Mon objectif est de relier concrètement les enseignements à mon projet, en m'appuyant sur ce que j'ai déjà construit, sans prétendre à des acquis que je n'ai pas encore.`,
      `Cette formation me paraît le cadre le plus adapté pour structurer la suite de mon parcours et répondre aux exigences du dossier.`,
    ].join(" ")
  );

  const professionalProject = clampProject(
    [
      outcomes
        ? `À l'issue de ${title}, je vise un métier en lien avec : ${outcomes}.`
        : `À l'issue de ${title}, je vise un poste aligné avec le domaine ${domain}.`,
      pastBits.length
        ? `Mon expérience et ma formation actuelles (${pastBits.join(" ; ")}) me donnent une base crédible pour cette trajectoire.`
        : `Mon parcours actuel me donne une base pour progresser vers cet objectif.`,
      `La formation doit me permettre d'acquérir le niveau attendu, de consolider ma pratique et de rendre mon projet professionnel réaliste et défendable.`,
      `Je souhaite ainsi construire une progression claire : formation ciblée, montée en compétences, puis insertion dans le secteur visé.`,
    ].join(" ")
  );

  // Pad if somehow under minimum (very sparse CV).
  const pad = (s: string, label: string) => {
    if (s.length >= PROJECT_MIN) return s;
    return clampProject(
      `${s} Je reste ouvert(e) à préciser ${label} en fonction des échanges avec l'établissement et des modules réellement suivis.`
    );
  };

  return {
    studyProject: pad(studyProject, "ce projet d'études"),
    professionalProject: pad(professionalProject, "ce projet professionnel"),
  };
}

/**
 * Proposes Campus France study + professional projects from CV + formation criteria.
 * Falls back to a heuristic draft if the LLM fails (still free for the user).
 */
export async function proposeCampusFranceProjects(params: {
  cv: CVData;
  programText: string;
  requirements: FormationRequirements;
  language?: string;
}): Promise<ProposedProjects> {
  const { cv, programText, requirements, language } = params;

  try {
    const criteria = [
      requirements.title && `Formation : ${requirements.title}`,
      requirements.domain && `Domaine : ${requirements.domain}`,
      requirements.level && `Niveau : ${requirements.level}`,
      requirements.prerequisites.length
        ? `Prérequis : ${requirements.prerequisites.join(", ")}`
        : "",
      requirements.objectives.length ? `Objectifs : ${requirements.objectives.join(", ")}` : "",
      requirements.targetSkills.length
        ? `Compétences visées : ${requirements.targetSkills.join(", ")}`
        : "",
      requirements.outcomes.length ? `Débouchés : ${requirements.outcomes.join(", ")}` : "",
      requirements.selectionCriteria.length
        ? `Critères de sélection : ${requirements.selectionCriteria.join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const raw = await chatJSON<unknown>({
      system: SYSTEM_PROMPT,
      user: [
        `CV DU CANDIDAT (JSON) :\n${JSON.stringify(cvForLLM(cv))}`,
        `FICHE DE FORMATION (extrait) :\n${programText.slice(0, 4500)}`,
        `CRITÈRES STRUCTURÉS :\n${criteria}`,
        language && `LANGUE DES PROJETS : ${language}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      maxTokens: 2800,
      temperature: 0.35,
    });

    const parsed = proposedSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error("Proposition de projets invalide.");
    }

    const studyProject = clampProject(parsed.data.studyProject);
    const professionalProject = clampProject(parsed.data.professionalProject);

    if (studyProject.length < PROJECT_MIN || professionalProject.length < PROJECT_MIN) {
      throw new Error("Les projets proposés sont trop courts.");
    }

    return { studyProject, professionalProject };
  } catch (error) {
    console.error("[campus-france] propose LLM failed, using heuristic", error);
    return proposeProjectsHeuristic(cv, requirements);
  }
}
