import "server-only";
import { chatJSON } from "@/lib/llm";
import { cvSchema, cvForLLM, CV_JSON_SHAPE, type CVData } from "@/lib/cv-schema";
import type { FormationRequirements } from "@/lib/campus-france/program-analysis";
import { sanitizeSkillsAgainstBase } from "@/lib/match-score";

const MAX_PROGRAM_PROMPT_CHARS = 8000;

const SYSTEM_PROMPT = `Tu es un expert des CV académiques pour dossiers Campus France.
On te donne (1) le CV de base d'un candidat au format JSON, (2) une fiche de formation, (3) des critères de cohérence.
Ta mission : produire un CV qui MET EN AVANT la cohérence du parcours avec la formation, SANS RIEN INVENTER.

Objectif : le jury doit voir immédiatement pourquoi ce parcours prépare à cette formation.
Ce n'est PAS un CV ATS emploi : tu hiérarchises et reformules pour la cohérence académique.

Règles STRICTES :
- N'invente aucune expérience, techno, formation, chiffre ou responsabilité absente du CV de base.
- "identity.headline" : positionnement académique aligné sur le domaine de la formation (max 70 caractères), uniquement avec des éléments déjà dans le CV.
- "summary" : 3-4 phrases (max 480 caractères) qui relient parcours → formation cible → ambition, sans inventer.
- "education" : mêmes entrées ; tu peux enrichir "details" uniquement avec des éléments déjà présents ailleurs dans le CV ; place les formations les plus pertinentes en premier.
- "experiences" : mêmes expériences (mêmes title/company/companyUrl/dates/place/links). Reformule les puces pour souligner le lien avec la formation ; réordonne les puces (plus pertinentes en premier). Même nombre de puces (±1). Conserve les liens markdown déjà présents.
- "skills" : réordonne pour placer d'abord les compétences utiles à la formation ; n'ajoute un terme que s'il est déjà prouvé dans le CV.
- "languages", "certifications", "interests", "contact" : recopiés (sauf réordonner une langue exigée déjà listée en premier).
- Ajoute "detectedTitle" : intitulé de la formation.
- Réponds UNIQUEMENT avec un objet JSON valide, sans backticks ni texte autour, conforme à ce format (+ detectedTitle) :
${CV_JSON_SHAPE}`;

export interface TailorAcademicCvParams {
  baseCV: CVData;
  programText: string;
  studyProject: string;
  professionalProject: string;
  requirements: FormationRequirements;
  instructions?: string;
  language?: string;
}

export interface TailorAcademicCvResult {
  cv: CVData;
  detectedTitle: string;
}

/** Tailors the base CV for Campus France formation coherence (no invention). */
export async function tailorAcademicCv(
  params: TailorAcademicCvParams
): Promise<TailorAcademicCvResult> {
  const { baseCV, programText, studyProject, professionalProject, requirements } = params;

  const cvJson = JSON.stringify(cvForLLM(baseCV));
  const checklist = [
    requirements.prerequisites.length
      ? `Prérequis à refléter s'ils sont déjà dans le CV : ${requirements.prerequisites.join(", ")}`
      : "",
    requirements.targetSkills.length
      ? `Compétences visées à remonter si présentes : ${requirements.targetSkills.join(", ")}`
      : "",
    requirements.objectives.length
      ? `Objectifs à aligner si présents : ${requirements.objectives.join(", ")}`
      : "",
    requirements.outcomes.length
      ? `Débouchés à relier si présents : ${requirements.outcomes.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const user = [
    `CV DE BASE (JSON) :\n${cvJson}`,
    `FICHE DE FORMATION :\n${programText.slice(0, MAX_PROGRAM_PROMPT_CHARS)}`,
    checklist && `CRITÈRES DE COHÉRENCE :\n${checklist}`,
    `PROJET D'ÉTUDES (contexte, ne pas inventer au-delà) :\n${studyProject.slice(0, 2000)}`,
    `PROJET PROFESSIONNEL (contexte) :\n${professionalProject.slice(0, 2000)}`,
    params.instructions && `CONSIGNES SUPPLÉMENTAIRES : ${params.instructions}`,
    params.language && `LANGUE DU CV GÉNÉRÉ : ${params.language}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const maxTokens = Math.min(Math.max(Math.ceil(cvJson.length / 3) + 800, 2000), 6000);

  const raw = await chatJSON<Record<string, unknown>>({
    system: SYSTEM_PROMPT,
    user,
    maxTokens,
    temperature: 0.35,
  });

  const detectedTitle =
    typeof raw.detectedTitle === "string" && raw.detectedTitle.trim()
      ? raw.detectedTitle.trim()
      : requirements.title || "Formation";
  delete raw.detectedTitle;

  const parsed = cvSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("L'IA a renvoyé un CV invalide. Réessayez ou changez de modèle.");
  }

  const merged: CVData = {
    ...parsed.data,
    identity: {
      ...parsed.data.identity,
      fullName: baseCV.identity.fullName,
      photoUrl: baseCV.identity.photoUrl,
    },
    contact: baseCV.contact,
    education:
      parsed.data.education.length === baseCV.education.length
        ? parsed.data.education
        : baseCV.education,
    certifications: baseCV.certifications ?? [],
    languages: parsed.data.languages.length ? parsed.data.languages : baseCV.languages,
    interests: baseCV.interests,
    softSkills: baseCV.softSkills ?? [],
    experiences:
      parsed.data.experiences.length === baseCV.experiences.length
        ? parsed.data.experiences
        : baseCV.experiences,
    skills: parsed.data.skills.length > 0 ? parsed.data.skills : baseCV.skills,
  };

  return {
    cv: sanitizeSkillsAgainstBase(merged, baseCV),
    detectedTitle,
  };
}
