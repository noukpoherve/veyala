/**
 * User-facing error copy: actionable, free of provider/stack leakage.
 * Prefer catalog messages via locale; `USER_ERRORS` stays FR for legacy call sites.
 */

import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

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

export type UserErrorKey = keyof typeof USER_ERRORS;

export function userErrors(locale: Locale = DEFAULT_LOCALE) {
  const e = getMessages(locale).errors;
  return {
    network: e.network,
    unknown: e.unknown,
    session: e.session,
    rateLimited: e.rateLimited,
    analyze: e.analyze,
    generate: e.generate,
    reproject: e.reproject,
    import: e.import,
    payment: e.payment,
    template: e.template,
    profile: e.profile,
    saveCv: e.saveCv,
  } as const;
}

const TECHNICAL =
  /stripe|ECONNREFUSED|ECONNRESET|ETIMEDOUT|prisma|postgres|at Object\.|TypeError:|ENOENT|stack|Traceback|^\s*\{|Request failed|invalid_request_error|api_key|sk_live|sk_test/i;

/** True when a server message is safe to show as-is to end users. */
export function isUserSafeMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 280) return false;
  if (TECHNICAL.test(trimmed)) return false;
  // Reject obvious English infra dumps while keeping French (and EN catalog) API copy.
  if (
    /^(Error|Failed|Unable|Cannot|Exception)\b/i.test(trimmed) &&
    !/[àâäéèêëïîôùûüç]/i.test(trimmed)
  ) {
    return false;
  }
  return true;
}

export function messageForHttpStatus(
  status: number,
  locale: Locale = DEFAULT_LOCALE
): string | null {
  const e = getMessages(locale).errors;
  switch (status) {
    case 401:
      return e.session;
    case 402:
      return e.insufficientCredits;
    case 403:
      return e.forbidden;
    case 404:
      return e.notFound;
    case 412:
      return e.needBaseCv;
    case 413:
      return e.fileTooLarge;
    case 415:
      return e.unsupportedFormat;
    case 422:
      return e.invalidData;
    case 429:
      return e.rateLimited;
    case 502:
    case 503:
    case 504:
      return e.unavailable;
    default:
      return null;
  }
}

/**
 * Map a known FR server error (or status) onto the visitor's locale catalog.
 * Prefer a safe raw message for FR; for EN map known French phrases then status.
 */
export function localizeServerError(
  message: string | null | undefined,
  status: number | null | undefined,
  locale: Locale,
  fallback?: string
): string {
  const e = getMessages(locale).errors;
  const raw = (message ?? "").trim();

  if (locale === "fr") {
    if (raw && isUserSafeMessage(raw)) return raw;
    if (status != null) {
      const byStatus = messageForHttpStatus(status, locale);
      if (byStatus) return byStatus;
    }
    return fallback ?? e.unknown;
  }

  if (raw) {
    const mapped = mapKnownFrenchError(raw, locale);
    if (mapped) return mapped;
    if (isUserSafeMessage(raw) && !/[àâäéèêëïîôùûüç]/i.test(raw)) return raw;
  }

  if (status != null) {
    const byStatus = messageForHttpStatus(status, locale);
    if (byStatus) return byStatus;
  }

  return fallback ?? e.unknown;
}

function mapKnownFrenchError(raw: string, locale: Locale): string | null {
  const e = getMessages(locale).errors;
  const api = getMessages(locale).api;
  const table: Array<[RegExp, string]> = [
    [/Importez d'abord votre CV/i, e.needBaseCv],
    [/Solde de crédits insuffisant/i, e.insufficientCredits],
    [/Template introuvable|Template non autorisé/i, api.cvEditor.templateNotAllowed],
    [/Aucun template disponible/i, api.cvEditor.templateNotAllowed],
    [/offre est trop courte|offre trop courte|Contenu trop court ou bloqué/i, e.invalidData],
    [/Offre illisible/i, e.invalidData],
    [/Job (de génération|Campus France) introuvable/i, api.generate.jobNotFound],
    [/Paramètres de génération invalides/i, api.invalidRequest],
    [/génération a échoué|La génération a échoué/i, api.generate.failed],
    [/projets d'études et professionnel/i, api.invalidRequest],
    [/Fournissez l'URL de l'offre/i, api.analyze.jobSourceRequired],
    [/analyse a échoué|L'analyse a échoué/i, api.analyze.failed],
  ];
  for (const [re, msg] of table) {
    if (re.test(raw)) return msg;
  }
  return null;
}

type ErrorBody = { error?: string; message?: string; errorStatus?: number } | null;

/** Prefer a safe API `error` string, else map HTTP status, else fallback. */
export function resolveApiError(
  status: number,
  body: ErrorBody,
  fallback: string,
  locale: Locale = DEFAULT_LOCALE
): string {
  const raw = body?.error?.trim() || body?.message?.trim();
  if (raw) {
    const localized = localizeServerError(raw, body?.errorStatus ?? status, locale, fallback);
    if (localized) return localized;
  }
  return messageForHttpStatus(status, locale) ?? fallback;
}

/** Parse JSON error body from a failed fetch Response. */
export async function readApiError(
  res: Response,
  fallback: string,
  locale: Locale = DEFAULT_LOCALE
): Promise<string> {
  const body = (await res.json().catch(() => null)) as ErrorBody;
  return resolveApiError(res.status, body, fallback, locale);
}

/** Normalize thrown client errors (network, Error, unknown). */
export function toUserMessage(
  error: unknown,
  fallback: string,
  locale: Locale = DEFAULT_LOCALE
): string {
  if (error instanceof TypeError) {
    return userErrors(locale).network;
  }
  if (error instanceof Error) {
    return localizeServerError(error.message, null, locale, fallback);
  }
  return fallback;
}
