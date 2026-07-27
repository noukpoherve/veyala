/**
 * User-facing error copy: keep messages French, actionable, and free of
 * provider/stack leakage (Stripe English, Prisma, raw LLM bodies…).
 */

export const USER_ERRORS = {
  network: "Connexion impossible. Vérifiez votre réseau puis réessayez.",
  unknown: "Une erreur est survenue. Réessayez dans un instant.",
  session: "Votre session a expiré. Reconnectez-vous pour continuer.",
  rateLimited: "Trop de tentatives rapprochées. Patientez quelques minutes puis réessayez.",
  analyze: "L'analyse de l'offre a échoué. Vérifiez le texte ou l'URL, puis réessayez.",
  generate:
    "La génération a échoué. Si un crédit avait été débité, il a été remboursé automatiquement.",
  reproject: "Impossible de recalculer le score pour le moment. Vos sélections sont conservées.",
  import: "L'import du CV a échoué. Utilisez un PDF ou DOCX lisible (8 Mo max) et réessayez.",
  payment: "Le paiement n'a pas pu démarrer. Réessayez dans un instant ou contactez le support.",
  template: "La soumission du template a échoué. Vérifiez l'image (PNG/JPEG/WebP, 5 Mo max).",
  profile: "Enregistrement impossible. Vérifiez les champs obligatoires puis réessayez.",
  saveCv: "Enregistrement du CV impossible. Réessayez dans un instant.",
} as const;

const TECHNICAL =
  /stripe|ECONNREFUSED|ECONNRESET|ETIMEDOUT|prisma|postgres|at Object\.|TypeError:|ENOENT|stack|Traceback|^\s*\{|Request failed|invalid_request_error|api_key|sk_live|sk_test/i;

/** True when a server message is safe to show as-is to end users. */
export function isUserSafeMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 280) return false;
  if (TECHNICAL.test(trimmed)) return false;
  // Reject obvious English infra dumps while keeping our French API copy.
  if (
    /^(Error|Failed|Unable|Cannot|Exception)\b/i.test(trimmed) &&
    !/[àâäéèêëïîôùûüç]/i.test(trimmed)
  ) {
    return false;
  }
  return true;
}

export function messageForHttpStatus(status: number): string | null {
  switch (status) {
    case 401:
      return USER_ERRORS.session;
    case 402:
      return "Solde de crédits insuffisant. Rechargez dans « Crédits » pour continuer.";
    case 403:
      return "Action non autorisée.";
    case 404:
      return "Élément introuvable.";
    case 412:
      return "Importez d'abord votre CV de base dans « Mon CV de base ».";
    case 413:
      return "Fichier trop volumineux.";
    case 415:
      return "Format de fichier non supporté.";
    case 422:
      return "Les données fournies sont invalides ou illisibles.";
    case 429:
      return USER_ERRORS.rateLimited;
    case 502:
    case 503:
    case 504:
      return "Le service est momentanément indisponible. Réessayez dans quelques instants.";
    default:
      return null;
  }
}

type ErrorBody = { error?: string; message?: string } | null;

/** Prefer a safe API `error` string, else map HTTP status, else fallback. */
export function resolveApiError(status: number, body: ErrorBody, fallback: string): string {
  const raw = body?.error?.trim() || body?.message?.trim();
  if (raw && isUserSafeMessage(raw)) return raw;
  return messageForHttpStatus(status) ?? fallback;
}

/** Parse JSON error body from a failed fetch Response. */
export async function readApiError(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => null)) as ErrorBody;
  return resolveApiError(res.status, body, fallback);
}

/** Normalize thrown client errors (network, Error, unknown). */
export function toUserMessage(error: unknown, fallback: string): string {
  if (error instanceof TypeError) {
    // fetch() network failures typically surface as TypeError in browsers.
    return USER_ERRORS.network;
  }
  if (error instanceof Error && isUserSafeMessage(error.message)) {
    return error.message;
  }
  return fallback;
}
