import "server-only";
import { ZodError } from "zod";
import { chatJSON, LLMError } from "@/lib/llm";
import { cvSchema, CV_JSON_SHAPE, type CVData } from "@/lib/cv-schema";

const SYSTEM_PROMPT = `Tu es un expert en analyse de CV.
On te donne le texte brut extrait d'un CV (PDF ou Word). Ta mission : le convertir en JSON structuré.

Règles STRICTES :
- N'invente RIEN : aucune expérience, compétence, date, chiffre ou coordonnée qui n'apparaît pas dans le texte. Les champs absents restent des chaînes vides "" ou des tableaux vides [].
- Conserve la langue d'origine du CV.
- "identity.photoUrl" : toujours "" (les photos ne sont pas extractibles du texte).
- "bullets" : une entrée par réalisation/mission telle qu'écrite (reformulation minimale autorisée pour corriger la ponctuation).
- "stack" : uniquement les technos explicitement citées pour cette expérience.
- "skills" : regroupe les compétences par catégories si le CV en a, sinon une seule catégorie "Compétences".
- "certifications" : diplômes professionnels, certifications cloud, badges (AWS, Scrum…) cités explicitement.
- "links" : uniquement les entrées avec une URL réelle (http/https). Ignore les libellés sans URL (ex. "LinkedIn" seul).
- Réponds UNIQUEMENT avec un objet JSON valide, sans backticks ni texte autour, conforme exactement à ce format :
${CV_JSON_SHAPE}`;

type LooseLink = { label?: unknown; url?: unknown };
type LooseExp = {
  title?: unknown;
  company?: unknown;
  companyUrl?: unknown;
  place?: unknown;
  dates?: unknown;
  bullets?: unknown;
  stack?: unknown;
  links?: unknown;
};

/** Drops LLM noise that would fail Zod (remote photoUrl, empty links, nulls). */
export function coerceImportedCV(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const data = { ...(raw as Record<string, unknown>) };

  const identity =
    data.identity && typeof data.identity === "object"
      ? { ...(data.identity as Record<string, unknown>) }
      : {};
  // Text import never carries a portrait — strip anything the model invents.
  identity.photoUrl = "";
  if (typeof identity.fullName !== "string") identity.fullName = String(identity.fullName ?? "");
  if (typeof identity.headline !== "string") identity.headline = String(identity.headline ?? "");
  data.identity = identity;

  const contact =
    data.contact && typeof data.contact === "object"
      ? { ...(data.contact as Record<string, unknown>) }
      : {};
  contact.links = filterLinks(contact.links);
  contact.details = filterDetails(contact.details);
  for (const key of ["email", "phone", "location"] as const) {
    if (contact[key] == null) contact[key] = "";
    else if (typeof contact[key] !== "string") contact[key] = String(contact[key]);
  }
  data.contact = contact;

  if (Array.isArray(data.experiences)) {
    data.experiences = data.experiences
      .filter((e): e is LooseExp => !!e && typeof e === "object")
      .map((e) => ({
        ...e,
        title: typeof e.title === "string" ? e.title : String(e.title ?? ""),
        company: e.company == null ? "" : String(e.company),
        companyUrl: e.companyUrl == null ? "" : String(e.companyUrl),
        place: e.place == null ? "" : String(e.place),
        dates: e.dates == null ? "" : String(e.dates),
        bullets: Array.isArray(e.bullets) ? e.bullets.map(String) : [],
        stack: Array.isArray(e.stack) ? e.stack.map(String) : [],
        links: filterLinks(e.links),
      }))
      .filter((e) => e.title.trim().length > 0);
  }

  if (Array.isArray(data.education)) {
    data.education = data.education
      .filter((e): e is Record<string, unknown> => !!e && typeof e === "object")
      .map((e) => ({
        ...e,
        degree: typeof e.degree === "string" ? e.degree : String(e.degree ?? ""),
        school: e.school == null ? "" : String(e.school),
        place: e.place == null ? "" : String(e.place),
        dates: e.dates == null ? "" : String(e.dates),
        details: e.details == null ? "" : String(e.details),
      }))
      .filter((e) => String(e.degree).trim().length > 0);
  }

  if (Array.isArray(data.skills)) {
    data.skills = data.skills
      .filter((g): g is Record<string, unknown> => !!g && typeof g === "object")
      .map((g) => ({
        category: typeof g.category === "string" ? g.category : String(g.category ?? "Compétences"),
        items: Array.isArray(g.items) ? g.items.map(String).filter(Boolean) : [],
      }))
      .filter((g) => g.category.trim().length > 0);
  }

  if (Array.isArray(data.languages)) {
    data.languages = data.languages
      .filter((l): l is Record<string, unknown> => !!l && typeof l === "object")
      .map((l) => ({
        name: typeof l.name === "string" ? l.name : String(l.name ?? ""),
        level: l.level == null ? "" : String(l.level),
      }))
      .filter((l) => l.name.trim().length > 0);
  }

  if (Array.isArray(data.certifications)) {
    data.certifications = data.certifications
      .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
      .map((c) => {
        const urlRaw = c.url == null ? "" : String(c.url).trim();
        return {
          name: typeof c.name === "string" ? c.name : String(c.name ?? ""),
          issuer: c.issuer == null ? "" : String(c.issuer),
          dates: c.dates == null ? "" : String(c.dates),
          url: /^https?:\/\//i.test(urlRaw) ? urlRaw : "",
          credentialId: c.credentialId == null ? "" : String(c.credentialId),
        };
      })
      .filter((c) => c.name.trim().length > 0);
  } else {
    data.certifications = [];
  }

  if (Array.isArray(data.softSkills)) data.softSkills = data.softSkills.map(String);
  if (Array.isArray(data.interests)) data.interests = data.interests.map(String);
  if (data.summary == null) data.summary = "";
  else if (typeof data.summary !== "string") data.summary = String(data.summary);

  return data;
}

function filterLinks(value: unknown): LooseLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((l): l is LooseLink => !!l && typeof l === "object")
    .map((l) => ({
      label: l.label == null ? "" : String(l.label).trim(),
      url: l.url == null ? "" : String(l.url).trim(),
    }))
    .filter((l) => l.url.length > 0 && /^https?:\/\//i.test(l.url))
    .map((l) => ({
      label: l.label || l.url!,
      url: l.url!,
    }));
}

function filterDetails(value: unknown): { label: string; value: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((d): d is Record<string, unknown> => !!d && typeof d === "object")
    .map((d) => ({
      label: d.label == null ? "" : String(d.label).trim(),
      value: d.value == null ? "" : String(d.value),
    }))
    .filter((d) => d.label.length > 0);
}

function parseStructured(raw: unknown): CVData {
  return cvSchema.parse(coerceImportedCV(raw));
}

/** Structures raw resume text into schema-compliant JSON. Zero invention. */
export async function structureCV(rawText: string): Promise<CVData> {
  // The JSON output is roughly the size of the source text (~3 chars/token).
  const maxTokens = Math.min(Math.max(Math.ceil(rawText.length / 3) + 800, 2000), 5000);
  try {
    const raw = await chatJSON({
      system: SYSTEM_PROMPT,
      user: `TEXTE DU CV :\n${rawText}`,
      maxTokens,
      temperature: 0.1,
    });

    const parsed = cvSchema.safeParse(coerceImportedCV(raw));
    if (parsed.success) return parsed.data;

    // One retry: feed the validation error back to the model for correction.
    const fixed = await chatJSON({
      system: SYSTEM_PROMPT,
      user: `TEXTE DU CV :\n${rawText}\n\nTa précédente réponse était invalide : ${parsed.error.message.slice(0, 800)}\nCorrige et renvoie uniquement le JSON. photoUrl doit être "".`,
      maxTokens,
      temperature: 0.1,
    });
    return parseStructured(fixed);
  } catch (e) {
    if (e instanceof LLMError) throw e;
    if (e instanceof ZodError) {
      throw new LLMError(
        "Le CV a été lu mais n'a pas pu être structuré correctement. Réessayez ou éditez-le manuellement."
      );
    }
    throw e;
  }
}
