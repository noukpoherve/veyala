import "server-only";
import { chatJSON } from "@/lib/llm";
import { cvSchema, cvForLLM, CV_JSON_SHAPE, type CVData } from "@/lib/cv-schema";
import {
  GENERATED_COPY_TYPOGRAPHY,
  GENERATED_COPY_TYPOGRAPHY_EN,
  stripEmDashes,
  stripEmDashesDeep,
} from "@/lib/typography";
import { isEnglishGeneration } from "@/lib/generation-locale";

export { fetchJobText } from "@/lib/fetch-job-text";

/** Keeps prompts within free-tier TPM budgets (Groq: 12k tokens/min). */
const MAX_JOB_TEXT_PROMPT_CHARS = 8000;

export interface TailorParams {
  baseCV: CVData;
  jobText: string;
  targetTitle?: string;
  instructions?: string;
  language?: string;
  /** Checklist to maximize coverage for (terms already in the CV only). */
  mustHave?: string[];
  niceHave?: string[];
  tools?: string[];
}

export interface TailorResult {
  cv: CVData;
  detectedTitle: string;
}

const SYSTEM_PROMPT = `Tu es un expert en recrutement et en optimisation ATS.
On te donne (1) le CV de base d'un candidat au format JSON, (2) le texte d'une offre, et éventuellement (3) une checklist d'exigences.
Ta mission : maximiser le matching ATS du CV avec l'offre SANS RIEN INVENTER.

Objectif business : le CV optimisé doit clairement mieux scorer que le CV de base sur les mots-clés de l'offre.

Règles STRICTES :
- N'invente aucune expérience, techno, formation, chiffre ou responsabilité absente du CV de base.
- Si un critère de la checklist (ou de l'offre) apparaît DÉJÀ quelque part dans le CV (skills, stack, puces, summary…), tu DOIS le faire remonter explicitement : skills, headline, summary et puces d'expérience, avec le vocabulaire EXACT de l'offre.
- Tu peux AJOUTER dans "skills" un terme de l'offre uniquement s'il est déjà présent ailleurs dans le CV (y compris sous un synonyme clair : JS→JavaScript, k8s→Kubernetes). Interdit d'ajouter un terme absent de tout le CV.
- "identity.headline" : intitulé proche de l'offre + 2-3 technos de l'offre que le candidat possède vraiment. Max 70 caractères.
- "summary" : 3-4 phrases (max 480 caractères) qui citent explicitement les must-have / tools que le candidat possède.
- "skills" : réordonne pour placer d'abord les items utiles à l'offre ; ajoute les termes de l'offre déjà prouvés dans le CV.
- "experiences" : mêmes expériences (mêmes title/company/companyUrl/dates/place/links). Reformule les puces avec le vocabulaire de l'offre et les mots-clés couvrables ; réordonne les puces (plus pertinentes en premier). Même nombre de puces (±1). Puces 110–220 caractères. Conserve les liens markdown [texte](url) déjà présents dans les puces. Enrichis "stack" avec les technos de l'expérience déjà présentes dans les puces / le CV.
- "education", "languages", "interests", "contact" : recopiés à l'identique (sauf languages si l'offre demande une langue déjà listée : garde-la en premier).
- Ajoute "detectedTitle" : intitulé du poste dans l'offre.
- ${GENERATED_COPY_TYPOGRAPHY}
- Réponds UNIQUEMENT avec un objet JSON valide, sans backticks ni texte autour, conforme à ce format (+ detectedTitle) :
${CV_JSON_SHAPE}`;

const SYSTEM_PROMPT_EN = `You are an expert recruiter and ATS optimizer.
You receive (1) a candidate's base resume as JSON, (2) a job posting, and optionally (3) a requirements checklist.
Your job: maximize ATS keyword match WITHOUT INVENTING ANYTHING.

Business goal: the tailored resume must score clearly higher than the base resume on the posting's keywords.

STRICT rules:
- Invent no experience, tech, degree, metric, or responsibility that is not already in the base resume.
- If a checklist or posting criterion ALREADY appears somewhere in the resume (skills, stack, bullets, summary), you MUST surface it explicitly in skills, headline, summary, and experience bullets, using the posting's EXACT wording.
- You may ADD a posting term to "skills" only if it already appears elsewhere in the resume (including a clear synonym: JS→JavaScript, k8s→Kubernetes). Never add a term absent from the resume.
- "identity.headline": title close to the posting + 2-3 posting technologies the candidate actually has. Max 70 characters.
- "summary": 3-4 sentences (max 480 characters) that explicitly cite must-have / tools the candidate has.
- "skills": reorder so posting-relevant items come first; add posting terms already evidenced in the resume.
- "experiences": same jobs (same title/company/companyUrl/dates/place/links). Rewrite bullets in natural US English with the posting's vocabulary; most relevant bullets first. Same bullet count (±1). Bullets 110–220 characters. Keep existing markdown links [text](url). Enrich "stack" with technologies already in those bullets / the resume.
- "education", "languages", "interests", "contact": copy as-is (except reorder a required language already listed to first).
- Do not translate the candidate's proper nouns, company names, or school names.
- Write all generated prose (headline, summary, bullets) in English.
- Add "detectedTitle": the job title from the posting.
- ${GENERATED_COPY_TYPOGRAPHY_EN}
- Reply ONLY with valid JSON, no backticks or surrounding text, matching this shape (+ detectedTitle):
${CV_JSON_SHAPE}`;

/** Tailors the base CV to a job posting. ATS rules, zero invention. */
export async function tailorCV(params: TailorParams): Promise<TailorResult> {
  const { baseCV, jobText, targetTitle, instructions, language, mustHave, niceHave, tools } =
    params;

  // Compact JSON without the photo: the payload counts against the provider's
  // token-per-minute quota, and Groq also counts max_tokens as "requested".
  const cvJson = JSON.stringify(cvForLLM(baseCV));
  const checklist = [
    mustHave?.length ? `MUST-HAVE à couvrir si présents dans le CV : ${mustHave.join(", ")}` : "",
    tools?.length ? `OUTILS / STACK à couvrir si présents dans le CV : ${tools.join(", ")}` : "",
    niceHave?.length
      ? `NICE-TO-HAVE à couvrir si présents dans le CV : ${niceHave.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const english = isEnglishGeneration(language);
  const user = [
    `CV DE BASE (JSON) :\n${cvJson}`,
    `OFFRE D'EMPLOI :\n${jobText.slice(0, MAX_JOB_TEXT_PROMPT_CHARS)}`,
    checklist && `CHECKLIST MATCHING (maximiser la couverture, sans inventer) :\n${checklist}`,
    targetTitle && `POSTE VISÉ (indiqué par le candidat) : ${targetTitle}`,
    instructions && `CONSIGNES SUPPLÉMENTAIRES DU CANDIDAT : ${instructions}`,
    language && `LANGUE DU CV GÉNÉRÉ : ${language}`,
    english &&
      `OUTPUT LANGUAGE: English. Rewrite generated prose in English. Do not translate proper nouns.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  // The reply mirrors the input CV: size the output budget on it (~3 chars/token).
  const maxTokens = Math.min(Math.max(Math.ceil(cvJson.length / 3) + 800, 2000), 6000);

  const raw = await chatJSON<Record<string, unknown>>({
    system: english ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT,
    user,
    maxTokens,
    temperature: 0.35,
  });

  const detectedTitle =
    typeof raw.detectedTitle === "string" && raw.detectedTitle.trim()
      ? raw.detectedTitle.trim()
      : (targetTitle ?? "Offre");
  delete raw.detectedTitle;

  const parsed = cvSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("L'IA a renvoyé un CV invalide. Réessayez ou changez de modèle.");
  }

  // Safety net: never let the model drop identity / contact / education.
  // Skills may grow when offer terms already evidenced in the base CV are promoted.
  const cv: CVData = {
    ...parsed.data,
    identity: {
      ...parsed.data.identity,
      fullName: baseCV.identity.fullName,
      photoUrl: baseCV.identity.photoUrl,
    },
    contact: baseCV.contact,
    education: baseCV.education,
    certifications: baseCV.certifications ?? [],
    // Personal projects are never sent to the LLM (see cvForLLM) and never rewritten.
    projects: baseCV.projects ?? [],
    languages: baseCV.languages,
    interests: baseCV.interests,
    softSkills: baseCV.softSkills ?? [],
    experiences:
      parsed.data.experiences.length === baseCV.experiences.length
        ? // The LLM's output shape doesn't carry "included" (it's not in CV_JSON_SHAPE),
          // so it always comes back at its zod default (true). Re-apply the candidate's
          // show/hide choice from the base CV instead of letting tailoring silently reset it.
          parsed.data.experiences.map((exp, i) => ({
            ...exp,
            included: baseCV.experiences[i]!.included,
          }))
        : baseCV.experiences,
    skills: parsed.data.skills.length > 0 ? parsed.data.skills : baseCV.skills,
  };

  return { cv: stripEmDashesDeep(cv), detectedTitle: stripEmDashes(detectedTitle) };
}
