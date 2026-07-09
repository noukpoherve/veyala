import "server-only";
import * as cheerio from "cheerio";
import { chatJSON } from "@/lib/llm";
import { cvSchema, CV_JSON_SHAPE, type CVData } from "@/lib/cv-schema";

/** Fetches and cleans a job posting's text from its URL. */
export async function fetchJobText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Le site a répondu ${res.status}. Collez plutôt le texte de l'offre.`);
  }
  const $ = cheerio.load(await res.text());
  $("script, style, nav, footer, header, noscript, svg, iframe").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();
  if (text.length < 200) {
    throw new Error("Contenu trop court ou bloqué par le site. Collez plutôt le texte de l'offre.");
  }
  return text.slice(0, 12000);
}

export interface TailorParams {
  baseCV: CVData;
  jobText: string;
  targetTitle?: string;
  instructions?: string;
  language?: string;
}

export interface TailorResult {
  cv: CVData;
  detectedTitle: string;
}

const SYSTEM_PROMPT = `Tu es un expert en recrutement et en optimisation ATS.
On te donne (1) le CV de base d'un candidat au format JSON et (2) le texte d'une offre d'emploi.
Ta mission : adapter le CV à l'offre SANS RIEN INVENTER.

Règles STRICTES :
- N'invente aucune expérience, techno, formation, chiffre ou responsabilité. Tu peux uniquement reformuler, réordonner et mettre en avant ce qui existe déjà dans le CV de base.
- Reprends le vocabulaire et les mots-clés exacts de l'offre quand le candidat possède réellement la compétence correspondante.
- "identity.headline" : intitulé du poste tel que formulé dans l'offre (ou proche), suivi des 2-3 technos clés que le candidat maîtrise et que l'offre demande. Max 70 caractères.
- "summary" : 3-4 phrases (max 480 caractères) reprenant les priorités de l'offre, uniquement à partir d'éléments présents dans le CV de base.
- "skills" : mêmes catégories et mêmes items que le CV de base, réordonnés pour placer d'abord les plus pertinents pour l'offre. Ne rien ajouter, ne rien retirer.
- "experiences" : mêmes expériences dans le même ordre, mêmes "title", "company", "dates", "place", "stack". Reformule les puces pour coller au vocabulaire de l'offre et réordonne-les (les plus pertinentes en premier). Chaque expérience garde le même nombre de puces (ou une de moins si vraiment hors sujet). Puces de 110 à 220 caractères.
- "education", "languages", "interests", "contact" : recopiés à l'identique.
- Ajoute une clé supplémentaire "detectedTitle" : l'intitulé du poste trouvé dans l'offre.
- Réponds UNIQUEMENT avec un objet JSON valide, sans backticks ni texte autour, conforme à ce format (+ la clé detectedTitle) :
${CV_JSON_SHAPE}`;

/** Tailors the base CV to a job posting. ATS rules, zero invention. */
export async function tailorCV(params: TailorParams): Promise<TailorResult> {
  const { baseCV, jobText, targetTitle, instructions, language } = params;

  const user = [
    `CV DE BASE (JSON) :\n${JSON.stringify(baseCV, null, 1)}`,
    `OFFRE D'EMPLOI :\n${jobText}`,
    targetTitle && `POSTE VISÉ (indiqué par le candidat) : ${targetTitle}`,
    instructions && `CONSIGNES SUPPLÉMENTAIRES DU CANDIDAT : ${instructions}`,
    language && `LANGUE DU CV GÉNÉRÉ : ${language}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const raw = await chatJSON<Record<string, unknown>>({
    system: SYSTEM_PROMPT,
    user,
    maxTokens: 6000,
    temperature: 0.4,
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

  // Safety net: never let the model drop or invent structural data.
  const cv: CVData = {
    ...parsed.data,
    identity: { ...parsed.data.identity, fullName: baseCV.identity.fullName, photoUrl: baseCV.identity.photoUrl },
    contact: baseCV.contact,
    education: baseCV.education,
    languages: baseCV.languages,
    interests: baseCV.interests,
    experiences: parsed.data.experiences.length === baseCV.experiences.length
      ? parsed.data.experiences
      : baseCV.experiences,
    skills: parsed.data.skills.length === baseCV.skills.length ? parsed.data.skills : baseCV.skills,
  };

  return { cv, detectedTitle };
}
