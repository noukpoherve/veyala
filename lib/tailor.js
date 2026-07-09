// Adaptation du CV à une offre d'emploi via le LLM configuré (n'importe quel fournisseur).
import * as cheerio from "cheerio";
import { BASE_INFO, COMPETENCES, EXPERIENCES, FORMATIONS, PROFIL_DEFAUT, HEADLINE_DEFAUT } from "./cv-data.js";
import { chat } from "./llm.js";

/** Récupère et nettoie le texte d'une offre depuis son URL. */
export async function fetchJobText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Le site a répondu ${res.status}. Collez plutôt le texte de l'offre.`);
  const html = await res.text();
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, noscript, svg, iframe").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();
  if (text.length < 200) throw new Error("Contenu trop court ou bloqué par le site. Collez plutôt le texte de l'offre.");
  return text.slice(0, 12000);
}

/**
 * Adapte le CV à l'offre.
 * Retourne { info, headline, profil, competences, experiences, formations, posteDetecte }.
 */
export async function tailorCv({ jobText, variant = "tama", targetTitle = "", criteria = "" }) {
  const mainExp = variant === "bridgeness" ? EXPERIENCES.bridgeness : EXPERIENCES.tama;
  const baseExperiences = [mainExp, EXPERIENCES.procurement, EXPERIENCES.confidentialai];

  const baseCv = {
    headline: HEADLINE_DEFAUT,
    profil: PROFIL_DEFAUT,
    competences: COMPETENCES,
    experiences: baseExperiences,
  };

  const system = `Tu es un expert en recrutement tech et en optimisation ATS.
On te donne (1) le CV de base d'un candidat au format JSON et (2) le texte d'une offre d'emploi.
Ta mission : adapter le CV à l'offre SANS RIEN INVENTER.

Règles STRICTES :
- N'invente aucune expérience, techno, chiffre ou responsabilité. Tu peux uniquement reformuler, réordonner et mettre en avant ce qui existe déjà dans le CV de base.
- Reprends le vocabulaire et les mots-clés exacts de l'offre quand le candidat possède réellement la compétence correspondante.
- "headline" : intitulé du poste tel que formulé dans l'offre (ou proche), suivi des 2-3 technos clés que le candidat maîtrise et que l'offre demande. Max 70 caractères.
- "profil" : 3-4 phrases (max 480 caractères), reprenant les priorités de l'offre. Garder la mention Master IMIE Paris et la disponibilité immédiate.
- "competences" : mêmes catégories et mêmes items que le CV de base, mais réordonnés pour placer d'abord les catégories et items les plus pertinents pour l'offre. Ne rien ajouter, ne rien retirer.
- "experiences" : mêmes expériences dans le même ordre, mêmes "title", "dates", "place", "stack". Tu peux reformuler chaque puce pour coller au vocabulaire de l'offre et réordonner les puces (les plus pertinentes en premier). Chaque expérience garde le même nombre de puces (ou une de moins si vraiment hors sujet). Puces de 110 à 220 caractères.
- Réponds UNIQUEMENT avec un objet JSON valide, sans backticks ni texte autour, avec exactement les clés : headline, profil, competences, experiences, posteDetecte (l'intitulé du poste trouvé dans l'offre).`;

  const user = `CV DE BASE (JSON) :
${JSON.stringify(baseCv, null, 1)}

OFFRE D'EMPLOI :
${jobText}

${targetTitle ? "POSTE VISÉ (indiqué par le candidat) : " + targetTitle : ""}
${criteria ? "CONSIGNES SUPPLÉMENTAIRES DU CANDIDAT : " + criteria : ""}`;

  const raw = await chat({ system, user, maxTokens: 4000, temperature: 0.4 });
  const clean = raw.replace(/```json|```/g, "").trim();

  let tailored;
  try {
    tailored = JSON.parse(clean);
  } catch {
    const m = clean.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Réponse IA non parsable. Réessayez ou changez de modèle.");
    tailored = JSON.parse(m[0]);
  }

  return {
    info: BASE_INFO,
    headline: tailored.headline || HEADLINE_DEFAUT,
    profil: tailored.profil || PROFIL_DEFAUT,
    competences: Array.isArray(tailored.competences) && tailored.competences.length ? tailored.competences : COMPETENCES,
    experiences: Array.isArray(tailored.experiences) && tailored.experiences.length ? tailored.experiences : baseExperiences,
    formations: FORMATIONS,
    posteDetecte: tailored.posteDetecte || targetTitle || "offre",
  };
}
