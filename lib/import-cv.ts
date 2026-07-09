import "server-only";
import { chatJSON } from "@/lib/llm";
import { cvSchema, CV_JSON_SHAPE, type CVData } from "@/lib/cv-schema";

const SYSTEM_PROMPT = `Tu es un expert en analyse de CV.
On te donne le texte brut extrait d'un CV (PDF ou Word). Ta mission : le convertir en JSON structuré.

Règles STRICTES :
- N'invente RIEN : aucune expérience, compétence, date, chiffre ou coordonnée qui n'apparaît pas dans le texte. Les champs absents restent des chaînes vides "" ou des tableaux vides [].
- Conserve la langue d'origine du CV.
- "bullets" : une entrée par réalisation/mission telle qu'écrite (reformulation minimale autorisée pour corriger la ponctuation).
- "stack" : uniquement les technos explicitement citées pour cette expérience.
- "skills" : regroupe les compétences par catégories si le CV en a, sinon une seule catégorie "Compétences".
- "links" : URLs trouvées dans le CV (LinkedIn, GitHub, portfolio…), label court.
- Réponds UNIQUEMENT avec un objet JSON valide, sans backticks ni texte autour, conforme exactement à ce format :
${CV_JSON_SHAPE}`;

/** Structures raw resume text into schema-compliant JSON. Zero invention. */
export async function structureCV(rawText: string): Promise<CVData> {
  const raw = await chatJSON({
    system: SYSTEM_PROMPT,
    user: `TEXTE DU CV :\n${rawText}`,
    maxTokens: 6000,
    temperature: 0.1,
  });

  const parsed = cvSchema.safeParse(raw);
  if (parsed.success) return parsed.data;

  // One retry: feed the validation error back to the model for correction.
  const fixed = await chatJSON({
    system: SYSTEM_PROMPT,
    user: `TEXTE DU CV :\n${rawText}\n\nTa précédente réponse était invalide : ${parsed.error.message.slice(0, 800)}\nCorrige et renvoie uniquement le JSON.`,
    maxTokens: 6000,
    temperature: 0.1,
  });
  return cvSchema.parse(fixed);
}
