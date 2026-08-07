/**
 * Human-readable French labels for ActivityLog / AdminAuditLog action keys.
 * Unknown keys fall back to a lightly prettified version of the raw action.
 */

const ACTION_LABELS: Record<string, { title: string; description: string }> = {
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
};

const META_LABELS: Record<string, string> = {
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
};

function euros(cents: unknown): string | null {
  const n = typeof cents === "number" ? cents : Number(cents);
  if (!Number.isFinite(n)) return null;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n / 100);
}

function formatMetaValue(key: string, value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "oui" : "non";
  if (key.endsWith("Cents") || key === "amountCents" || key === "discountCents") {
    return euros(value) ?? String(value);
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Title + short description for an activity action key. */
export function describeActivity(action: string): { title: string; description: string } {
  const known = ACTION_LABELS[action];
  if (known) return known;
  return {
    title: action.replace(/\./g, " · "),
    description: "Événement enregistré.",
  };
}

/** Turns JSON meta into short French “label: value” chips for the admin table. */
export function formatActivityMeta(meta: unknown): { label: string; value: string }[] {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return [];
  return Object.entries(meta as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .map(([key, value]) => ({
      label: META_LABELS[key] ?? key,
      value: formatMetaValue(key, value),
    }));
}
