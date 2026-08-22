/**
 * Human-readable labels for ActivityLog / AdminAuditLog action keys.
 * Unknown keys fall back to a lightly prettified version of the raw action.
 */

import type { Locale } from "@/i18n/config";
import { formatCurrency } from "@/i18n/format";

type ActionCopy = { title: string; description: string };

const ACTION_LABELS: Record<Locale, Record<string, ActionCopy>> = {
  fr: {
    "analyze.run": {
      title: "Analyse d'offre d'emploi",
      description: "L'utilisateur a lancé une analyse d'offre.",
    },
    "generate.enqueue": {
      title: "Génération de CV lancée",
      description: "Une génération de CV + lettre a été mise en file.",
    },
    "profile.update": {
      title: "CV de base mis à jour",
      description: "Le profil / CV de base a été modifié.",
    },
    "account.archive_self": {
      title: "Compte archivé par l'utilisateur",
      description: "L'utilisateur a demandé l'archivage de son compte.",
    },
    "user.archive": {
      title: "Compte archivé (admin)",
      description: "Un administrateur a archivé ce compte.",
    },
    "user.restore": {
      title: "Compte restauré",
      description: "Un administrateur a restauré un compte archivé.",
    },
    "user.hard_delete": {
      title: "Suppression définitive",
      description: "Un administrateur a supprimé définitivement un compte.",
    },
    "credits.adjust": {
      title: "Ajustement de crédits",
      description: "Un administrateur a modifié le solde de crédits.",
    },
    "user.set_role": {
      title: "Changement de rôle",
      description: "Le rôle de l'utilisateur a été modifié.",
    },
    "user.invite_admin": {
      title: "Invitation administrateur",
      description: "Une invitation admin a été envoyée.",
    },
    "llm.create": {
      title: "Fournisseur IA créé",
      description: "Un nouveau fournisseur LLM a été ajouté.",
    },
    "llm.update": {
      title: "Fournisseur IA modifié",
      description: "La configuration d'un fournisseur LLM a été mise à jour.",
    },
    "llm.set_default": {
      title: "Fournisseur IA par défaut",
      description: "Le fournisseur LLM par défaut a changé.",
    },
    "llm.toggle_active": {
      title: "Activation fournisseur IA",
      description: "Un fournisseur LLM a été activé ou désactivé.",
    },
    "llm.delete": {
      title: "Fournisseur IA supprimé",
      description: "Un fournisseur LLM a été supprimé.",
    },
    "payment.paid": {
      title: "Paiement réussi",
      description: "Un achat de crédits a été confirmé et crédité.",
    },
    "payment.failed": {
      title: "Paiement échoué / expiré",
      description: "Une session de paiement a échoué ou a expiré sans encaissement.",
    },
    "payment.checkout_started": {
      title: "Checkout démarré",
      description: "L'utilisateur a ouvert une session de paiement Stripe.",
    },
    "promo.create": {
      title: "Code promo créé",
      description: "Un code promotionnel a été créé.",
    },
    "promo.update": {
      title: "Code promo modifié",
      description: "Un code promotionnel a été mis à jour.",
    },
    "promo.toggle": {
      title: "Code promo activé / désactivé",
      description: "Le statut actif d'un code promo a changé.",
    },
  },
  en: {
    "analyze.run": {
      title: "Job posting analysis",
      description: "The user ran a job posting analysis.",
    },
    "generate.enqueue": {
      title: "Resume generation started",
      description: "A resume and cover letter generation was queued.",
    },
    "profile.update": {
      title: "Base resume updated",
      description: "The profile / base resume was edited.",
    },
    "account.archive_self": {
      title: "Account archived by the user",
      description: "The user asked to archive their account.",
    },
    "user.archive": {
      title: "Account archived (admin)",
      description: "An administrator archived this account.",
    },
    "user.restore": {
      title: "Account restored",
      description: "An administrator restored an archived account.",
    },
    "user.hard_delete": {
      title: "Permanent deletion",
      description: "An administrator permanently deleted an account.",
    },
    "credits.adjust": {
      title: "Credit adjustment",
      description: "An administrator changed the credit balance.",
    },
    "user.set_role": {
      title: "Role change",
      description: "The user's role was updated.",
    },
    "user.invite_admin": {
      title: "Admin invitation",
      description: "An admin invitation was sent.",
    },
    "llm.create": {
      title: "AI provider created",
      description: "A new LLM provider was added.",
    },
    "llm.update": {
      title: "AI provider updated",
      description: "An LLM provider configuration was updated.",
    },
    "llm.set_default": {
      title: "Default AI provider",
      description: "The default LLM provider changed.",
    },
    "llm.toggle_active": {
      title: "AI provider toggled",
      description: "An LLM provider was enabled or disabled.",
    },
    "llm.delete": {
      title: "AI provider deleted",
      description: "An LLM provider was deleted.",
    },
    "payment.paid": {
      title: "Payment succeeded",
      description: "A credit purchase was confirmed and credited.",
    },
    "payment.failed": {
      title: "Payment failed / expired",
      description: "A checkout session failed or expired without a charge.",
    },
    "payment.checkout_started": {
      title: "Checkout started",
      description: "The user opened a Stripe checkout session.",
    },
    "promo.create": {
      title: "Promo code created",
      description: "A promotional code was created.",
    },
    "promo.update": {
      title: "Promo code updated",
      description: "A promotional code was updated.",
    },
    "promo.toggle": {
      title: "Promo code toggled",
      description: "A promo code's active status changed.",
    },
  },
};

const META_LABELS: Record<Locale, Record<string, string>> = {
  fr: {
    delta: "Variation crédits",
    credits: "Crédits",
    creditsPurchased: "Crédits achetés",
    amountCents: "Montant",
    discountCents: "Remise",
    paymentId: "Paiement",
    packId: "Pack",
    packLabel: "Pack",
    promoCode: "Code promo",
    promoCodeId: "Code promo",
    role: "Rôle",
    reason: "Motif",
    email: "Email",
    name: "Nom",
    model: "Modèle",
    active: "Actif",
    keyRotated: "Clé API renouvelée",
    jobId: "Job",
    attemptId: "Tentative",
    templateId: "Template",
    targetId: "Cible",
  },
  en: {
    delta: "Credit change",
    credits: "Credits",
    creditsPurchased: "Credits purchased",
    amountCents: "Amount",
    discountCents: "Discount",
    paymentId: "Payment",
    packId: "Pack",
    packLabel: "Pack",
    promoCode: "Promo code",
    promoCodeId: "Promo code",
    role: "Role",
    reason: "Reason",
    email: "Email",
    name: "Name",
    model: "Model",
    active: "Active",
    keyRotated: "API key rotated",
    jobId: "Job",
    attemptId: "Attempt",
    templateId: "Template",
    targetId: "Target",
  },
};

function formatMetaValue(key: string, value: unknown, locale: Locale): string {
  if (value == null) return "—";
  if (typeof value === "boolean") {
    if (locale === "en") return value ? "yes" : "no";
    return value ? "oui" : "non";
  }
  if (key.endsWith("Cents") || key === "amountCents" || key === "discountCents") {
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? formatCurrency(n, locale) : String(value);
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Title + short description for an activity action key. */
export function describeActivity(
  action: string,
  locale: Locale = "fr"
): { title: string; description: string } {
  const known = ACTION_LABELS[locale][action];
  if (known) return known;
  return {
    title: action.replace(/\./g, " · "),
    description: locale === "en" ? "Event recorded." : "Événement enregistré.",
  };
}

/** Turns JSON meta into short “label: value” chips for the admin table. */
export function formatActivityMeta(
  meta: unknown,
  locale: Locale = "fr"
): { label: string; value: string }[] {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return [];
  const labels = META_LABELS[locale];
  return Object.entries(meta as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .map(([key, value]) => ({
      label: labels[key] ?? key,
      value: formatMetaValue(key, value, locale),
    }));
}
