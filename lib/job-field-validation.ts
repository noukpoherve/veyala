/**
 * Sanity checks for free-text job options (title / language).
 * Blocks keyboard smash like "lkfdnlkgnfdlkrnlak" while allowing real titles.
 */

const KNOWN_LANGUAGES = [
  "français",
  "francais",
  "french",
  "fr",
  "anglais",
  "english",
  "en",
  "espagnol",
  "spanish",
  "es",
  "allemand",
  "german",
  "de",
  "italien",
  "italian",
  "it",
  "portugais",
  "portuguese",
  "pt",
  "néerlandais",
  "neerlandais",
  "dutch",
  "nl",
  "arabe",
  "arabic",
  "ar",
  "chinois",
  "chinese",
  "zh",
  "japonais",
  "japanese",
  "ja",
  "coréen",
  "coreen",
  "korean",
  "ko",
  "russe",
  "russian",
  "ru",
  "polonais",
  "polish",
  "pl",
  "roumain",
  "romanian",
  "ro",
  "turc",
  "turkish",
  "tr",
  "suédois",
  "suedois",
  "swedish",
  "sv",
  "catalan",
  "ca",
] as const;

/** Languages offered in the generate UI select (value → label). */
export const CV_LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Français (défaut)" },
  { value: "français", label: "Français" },
  { value: "anglais", label: "Anglais" },
  { value: "espagnol", label: "Espagnol" },
  { value: "allemand", label: "Allemand" },
  { value: "italien", label: "Italien" },
  { value: "portugais", label: "Portugais" },
  { value: "néerlandais", label: "Néerlandais" },
  { value: "arabe", label: "Arabe" },
];

function normalizeLoose(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const KNOWN_SET = new Set(KNOWN_LANGUAGES.map(normalizeLoose));

/** Empty / whitespace → OK (optional). Otherwise must be a known language name. */
export function validateCvLanguage(raw: string | undefined | null): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (value.length > 40) return "Langue trop longue.";
  if (!KNOWN_SET.has(normalizeLoose(value))) {
    return "Langue non reconnue. Choisissez une langue de la liste (ex. français, anglais).";
  }
  return null;
}

function letterRatio(value: string): number {
  const letters = value.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿĀ-ž]/g, "");
  return value.length === 0 ? 0 : letters.length / value.length;
}

/** Shared smash detector for free-text fields (title, instructions…). */
export function looksLikeGibberish(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/(.)\1{4,}/.test(trimmed)) return true;
  if (letterRatio(trimmed) < 0.45) return true;

  const folded = normalizeLoose(trimmed).replace(/[^a-z]/g, "");
  if (folded.length >= 6) {
    const vowels = (folded.match(/[aeiouy]/g) ?? []).length;
    if (vowels / folded.length < 0.18) return true;
  }

  const words = trimmed.split(/[\s/\-–—]+/).filter(Boolean);
  if (trimmed.length >= 16 && words.length === 1 && !/[aeiouyàâäéèêëïîôùûü]/i.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Empty → OK (optional). Otherwise require enough letters, some vowels (latin),
 * and reject smash patterns without word shape.
 */
export function validateJobTitle(raw: string | undefined | null): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (value.length < 3) return "L'intitulé du poste est trop court.";
  if (value.length > 120) return "L'intitulé du poste est trop long.";
  if (looksLikeGibberish(value)) {
    return "L'intitulé du poste semble invalide (texte incompréhensible).";
  }
  return null;
}

/** Optional free-form notes sent to the LLM — block keyboard smash. */
export function validateInstructions(raw: string | undefined | null): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (value.length < 3) return "Les consignes sont trop courtes.";
  if (value.length > 1000) return "Les consignes sont trop longues (1000 caractères max).";
  if (looksLikeGibberish(value)) {
    return "Les consignes semblent invalides (texte incompréhensible).";
  }
  return null;
}

/** Job offer paste must look like real content, not a few random characters. */
export function validateJobText(raw: string | undefined | null): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (value.length < 40) {
    return "Le texte de l'offre est trop court pour être analysé.";
  }
  const words = value.split(/\s+/).filter((w) => w.length >= 2);
  if (words.length < 8) {
    return "Collez une offre plus complète (au moins quelques phrases).";
  }
  if (letterRatio(value) < 0.35) {
    return "Le texte de l'offre ne semble pas lisible.";
  }
  return null;
}
