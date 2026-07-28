import "server-only";
import * as cheerio from "cheerio";
import { chatJSON } from "@/lib/llm";
import { cvSchema, cvForLLM, CV_JSON_SHAPE, type CVData } from "@/lib/cv-schema";
import { assertSafePublicUrl } from "@/lib/job-url";

/** Keeps prompts within free-tier TPM budgets (Groq: 12k tokens/min). */
const MAX_JOB_TEXT_PROMPT_CHARS = 8000;

const FETCH_TIMEOUT_MS = 12_000;

/** Fetches and cleans a job posting's text from its URL (SSRF-safe). */
export async function fetchJobText(rawUrl: string): Promise<string> {
  const url = await assertSafePublicUrl(rawUrl);
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  // Re-check the final URL after redirects.
  if (res.url && res.url !== url.href) {
    await assertSafePublicUrl(res.url);
  }
  if (!res.ok) {
    throw new Error(`Le site a répondu ${res.status}. Collez plutôt le texte de l'offre.`);
  }
  const html = await res.text();
  if (html.length > 2_000_000) {
    throw new Error("Page trop volumineuse. Collez plutôt le texte de l'offre.");
  }
  const $ = cheerio.load(html);
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
- "education", "languages", "interests", "contact" : recopiés à l'identique (sauf languages si l'offre demande une langue déjà listée — garde-la en premier).
- Ajoute "detectedTitle" : intitulé du poste dans l'offre.
- Réponds UNIQUEMENT avec un objet JSON valide, sans backticks ni texte autour, conforme à ce format (+ detectedTitle) :
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

  const user = [
    `CV DE BASE (JSON) :\n${cvJson}`,
    `OFFRE D'EMPLOI :\n${jobText.slice(0, MAX_JOB_TEXT_PROMPT_CHARS)}`,
    checklist && `CHECKLIST MATCHING (maximiser la couverture, sans inventer) :\n${checklist}`,
    targetTitle && `POSTE VISÉ (indiqué par le candidat) : ${targetTitle}`,
    instructions && `CONSIGNES SUPPLÉMENTAIRES DU CANDIDAT : ${instructions}`,
    language && `LANGUE DU CV GÉNÉRÉ : ${language}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  // The reply mirrors the input CV: size the output budget on it (~3 chars/token).
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
    languages: baseCV.languages,
    interests: baseCV.interests,
    softSkills: baseCV.softSkills ?? [],
    experiences:
      parsed.data.experiences.length === baseCV.experiences.length
        ? parsed.data.experiences
        : baseCV.experiences,
    skills: parsed.data.skills.length > 0 ? parsed.data.skills : baseCV.skills,
  };

  return { cv, detectedTitle };
}
