/** User-facing messages returned by route handlers and server actions. */
export const api = {
  invalidRequest: "Requête invalide.",
  analyze: {
    rateLimited: "Trop d'analyses rapprochées. Réessayez dans quelques minutes.",
    jobSourceRequired: "Fournissez l'URL de l'offre ou collez son texte.",
    failed: "L'analyse a échoué.",
  },
  generate: {
    rateLimited: "Trop de générations rapprochées. Réessayez dans quelques minutes.",
    enqueueFailed: "Impossible de démarrer la génération.",
    jobNotFound: "Job introuvable.",
    failed: "La génération a échoué.",
  },
  campusFrance: {
    analyzeFailed:
      "L'analyse a échoué. Réessayez, ou collez le texte de la fiche si l'URL est bloquée.",
  },
  importCv: {
    rateLimited: "Trop d'imports rapprochés. Réessayez dans quelques minutes.",
    noFile: "Aucun fichier reçu.",
    fileTooLarge: "Fichier trop volumineux (8 Mo max).",
    unsupportedFormat: "Format non supporté : PDF ou DOCX uniquement.",
    structureFailed: "Le service IA n'a pas pu structurer votre CV. Réessayez dans un instant.",
    noTextExtracted:
      "Impossible d'extraire le texte de ce fichier. Utilisez un PDF ou DOCX texte (pas un scan image) de 8 Mo max.",
    failed:
      "L'import a échoué après lecture du fichier. Réessayez dans un instant ; si le problème continue, utilisez le DOCX exporté.",
  },
  templates: {
    rateLimited: "Trop de soumissions rapprochées. Réessayez dans quelques minutes.",
    nameRequired: "Nom du template requis (3 à 60 caractères).",
    imageRequired: "Image de référence requise.",
    unsupportedImage: "Format d'image non supporté : PNG, JPEG ou WebP.",
    imageTooLarge: "Image trop volumineuse (5 Mo max).",
    duplicate: (name: string) =>
      `Ce template existe déjà sous le nom « ${name} » : vous pouvez l'utiliser directement.`,
    submitted:
      "Template soumis ! Vous pouvez l'utiliser dès maintenant ; il sera proposé aux autres utilisateurs après validation.",
    analyzeFailed: "L'analyse du template a échoué.",
  },
  stripe: {
    invalidPack: "Pack invalide.",
    packUnavailable: "Ce pack n'est plus disponible.",
    checkoutFailed:
      "Le paiement n'a pas pu démarrer. Vérifiez la configuration Stripe ou réessayez plus tard.",
    syncRateLimited: "Trop de tentatives. Réessayez dans un instant.",
    syncFailed: "Impossible de synchroniser le paiement pour le moment.",
    productName: (packLabel: string, _credits: number) => `Veyala : pack ${packLabel}`,
    lineItemDescription: (credits: number, promoLabel?: string) =>
      `${credits} générations de CV${promoLabel ? ` · code ${promoLabel}` : ""}`,
  },
  promo: {
    invalidData: "Données invalides.",
    invalidCode: "Code promo invalide.",
  },
  files: {
    forbidden: "Accès refusé.",
    notFound: "Fichier introuvable.",
  },
  llmTest: {
    adminOnly: "Accès réservé aux administrateurs.",
    invalidBody: "Corps de requête invalide.",
    failed: "Erreur inconnue.",
  },
  profile: {
    invalidData: "Données invalides : vérifiez les champs obligatoires.",
  },
  cvEditor: {
    invalidData: "Données invalides : le nom complet est obligatoire.",
    notFound: "CV introuvable.",
    templateNotAllowed: "Template non autorisé.",
    saveFailed: "L'enregistrement a échoué.",
  },
  blog: {
    invalidForm: "Formulaire invalide.",
    postNotFound: "Article introuvable.",
    slugTaken: "Ce slug est déjà utilisé.",
    slugTakenShort: "Slug déjà pris",
    seoTooLow: (score: number, min: number) =>
      `Score SEO ${score}/100 (minimum ${min} pour publier).`,
    published: (score: number) => `Publié (SEO ${score}/100).`,
    draftSaved: (score: number) => `Brouillon enregistré (SEO ${score}/100).`,
  },
  settings: {
    providerNotFound: "Fournisseur introuvable.",
    providerTestFailed: "Échec du test fournisseur.",
  },
} as const;
