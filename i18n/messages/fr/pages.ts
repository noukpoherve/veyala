/** Copy for the authenticated app pages (dashboard, generate, billing, …). */
export const pages = {
  /** Shown instead of a metric that cannot be computed yet. */
  noValue: "·",

  dashboard: {
    description: "Votre activité et l'historique de vos CV générés.",
    historyTitle: "Historique des CV",
    historyEmpty: "Aucun CV pour le moment.",
    historyCount: (total: number) => `${total} CV${total > 1 ? "s" : ""} au total.`,
    importCta: "Importer mon CV",
  },

  scores: {
    coherence: "Cohérence",
    matching: "Matching",
  },

  activity: {
    title: "Bilan d'activité",
    subtitle: "Vue des 30 derniers jours et tendance hebdo.",
    topUp: "Recharger des crédits",
    cvsLabel: "CVs (30 j)",
    cvsHint: (total: number) => `${total} au total`,
    gainLabel: "Gain matching moyen",
    gainValue: (points: number) => `${points >= 0 ? "+" : ""}${points} pts`,
    gainHint: "avant → après",
    bestLabel: "Meilleur score",
    bestHint: "matching après génération",
    creditsLabel: "Crédits restants",
    creditsHint: (used: number) => `${used} utilisés (30 j)`,
    chartTitle: "CVs générés par semaine",
    chartAria: (series: string) => `Activité sur 8 semaines : ${series}`,
  },

  baseCvAlert: {
    title: "CV de base manquant",
    cta: "Importer mon CV de base",
    generateBody:
      "C'est la source de vérité de toutes les générations : aucune invention par l'IA.",
    campusBody: "C'est la source de vérité du dossier : aucune invention par l'IA.",
  },

  profile: {
    importTitle: "Import automatique",
    importBody:
      "Importez votre CV existant (PDF ou DOCX, 8 Mo max) : il est analysé puis converti en données structurées éditables ci-dessous.",
    structuredAria: "Données structurées du CV",
    noCv: "Aucun CV importé pour le moment. Importez un fichier ci-dessus ou remplissez le formulaire après un premier import.",
    dangerTitle: "Zone dangereuse",
    dangerBody:
      "Désactive votre compte (archivage). Vos données sont conservées. Pour retrouver l'accès, contactez un administrateur. La suppression définitive (RGPD) est réservée à l'équipe support.",
  },

  cvUpload: {
    analyzing: "Analyse du CV en cours…",
    reimport: "Réimporter un CV (remplace les données)",
    import: "Importer mon CV (PDF ou DOCX)",
    errorTitle: "Import impossible",
  },

  profileForm: {
    invalid: "Certains champs sont invalides. Le nom complet est obligatoire.",
    errorTitle: "Enregistrement impossible",
    submit: "Enregistrer mon CV de base",
  },

  archiveAccount: {
    trigger: "Désactiver mon compte",
    dialogTitle: "Désactiver votre compte ?",
    dialogBody:
      "Votre compte sera archivé : vous ne pourrez plus vous connecter. Vos données sont conservées. Pour réactiver l'accès, contactez un administrateur.",
    confirmLabel: (word: string) => `Tapez ${word} pour confirmer`,
    pending: "Désactivation…",
    submit: "Confirmer la désactivation",
  },

  templates: {
    galleryTitle: "Galerie publique",
    ownTitle: "Mes templates",
    proposeTitle: "Proposer un template",
    proposeBody:
      "Les doublons sont détectés automatiquement ; les nouveaux templates passent en validation avant d'être publics, mais restent utilisables par vous immédiatement.",
    status: {
      PENDING: "En validation",
      APPROVED: "Approuvé",
      REJECTED: "Rejeté",
    },
    layoutSidebar: "Colonne latérale",
    layoutSingle: "Une colonne",
    originCommunity: "communautaire",
    originOfficial: "officiel",
  },

  templateImport: {
    nameLabel: "Nom du template",
    namePlaceholder: "Élégance corail",
    imageLabel: "Image de référence (PNG, JPEG ou WebP, 5 Mo max)",
    chooseImage: "Choisir une image",
    imageHint:
      "Une capture ou photo du design de CV à reproduire : l'IA en extrait les couleurs, la mise en page et les sections.",
    submitted: "Template soumis.",
    errorTitle: "Soumission impossible",
    duplicateTitle: "Template déjà connu",
    successTitle: "Template soumis",
    analyzing: "Analyse en cours…",
    submit: "Soumettre le template",
  },

  billing: {
    cancelledTitle: "Paiement annulé",
    cancelledBody: "Aucun montant n'a été débité. Vous pouvez réessayer quand vous voulez.",
    pendingTitle: "Un paiement récent est encore en cours de traitement",
    pendingBodyBefore:
      "Un achat est resté « En attente » (souvent une page de paiement ouverte puis fermée sans aller au bout). La synchronisation met le statut à jour ;",
    pendingBodyStrong: "elle ne re-crédite jamais",
    pendingBodyAfter: "un achat déjà marqué « Payé ».",
    packsTitle: "Recharger mon compte",
    paymentsTitle: "Historique des paiements",
    paymentsEmpty: "Aucun paiement pour le moment.",
    ledgerTitle: "Mouvements de crédits",
    ledgerEmpty: "Aucun mouvement pour le moment.",
    colAmount: "Montant",
    colPromo: "Promo",
    colReason: "Motif",
    reasons: {
      PURCHASE: "Achat de pack",
      GENERATION: "Génération de CV",
      ADMIN_ADJUST: "Ajustement admin",
      SIGNUP_BONUS: "Bonus d'inscription",
      REFUND: "Remboursement (échec)",
    },
    paymentStatus: {
      PAID: "Payé",
      PENDING: "En attente",
      FAILED: "Échoué",
    },
  },

  checkout: {
    promoLabel: "Code promo",
    promoPlaceholder: "Ex. BIENVENUE20",
    apply: "Appliquer",
    invalidCode: "Code promo invalide.",
    checkFailed: "Impossible de vérifier le code pour le moment.",
    promoAppliedPrefix: "Code",
    promoAppliedSuffix: (label: string) =>
      `(${label}) : le prix / crédits seront ajustés au paiement selon le pack choisi.`,
    tip: "Astuce : appliquez le code puis choisissez un pack. La remise est recalculée pour le pack acheté.",
    popular: "Le plus populaire",
    packDescription: (generations: number, unitPrice: string) =>
      `${generations} génération${generations > 1 ? "s" : ""}, ${unitPrice}/CV`,
    recalculate: "Recalculer le code pour ce pack",
    buy: "Acheter",
  },

  paymentSync: {
    refresh: "Actualiser mon solde",
    syncFailed: "Synchronisation impossible. Réessayez.",
    creditsAdded: "De nouveaux crédits ont été ajoutés à votre solde.",
    alreadyUpToDate:
      "Aucun nouveau crédit à ajouter. Votre solde est déjà à jour (un paiement « Payé » ne sera jamais re-crédité).",
    connectionFailed: "Connexion impossible. Réessayez.",
    checkingTitle: "Vérification en cours…",
    checkingBody: "Synchronisation avec Stripe…",
    errorTitle: "Synchronisation impossible",
    addedTitle: "Crédits ajoutés",
    upToDateTitle: "Solde déjà à jour",
  },

  support: {
    description: "Une question, un problème ? Écrivez-nous : la réponse arrive ici et par email.",
    statusSent: "Message envoyé. Notre équipe vous répondra par email et ici même.",
    statusInvalid:
      "Message invalide : sujet de 3 caractères minimum, message de 10 caractères minimum.",
    statusRateLimited: "Trop de messages envoyés. Réessayez dans quelques minutes.",
    sentTitle: "Message envoyé",
    failedTitle: "Envoi impossible",
    newMessage: "Nouveau message",
    subject: "Sujet",
    subjectPlaceholder: "Ex. : problème d'export PDF",
    message: "Message",
    messagePlaceholder: "Décrivez votre demande le plus précisément possible…",
    threadsTitle: "Vos conversations",
    statusOpen: "En cours",
    statusClosed: "Clôturé",
    fromTeam: "Équipe Veyala",
    fromYou: "Vous",
    replyPlaceholder: "Répondre…",
    replyAria: (subject: string) => `Répondre à « ${subject} »`,
    sendReply: "Envoyer la réponse",
  },

  cvDetail: {
    breadcrumbAria: "Fil d'Ariane",
    backToDashboard: "Retour au tableau de bord",
    templateMeta: (template: string, date: string) => `Template « ${template} » · ${date}`,
    source: (source: string) => `Source : ${source}`,
    pastedText: "texte collé",
    editInEditor: "Modifier dans l'éditeur",
    campusReportTitle: "Bilan de cohérence Campus France",
    atsReportTitle: "Bilan matching ATS",
    academicCv: "CV académique",
    optimizedCv: "CV optimisé",
    previewTitle: (jobTitle: string) => `Aperçu du CV : ${jobTitle}`,
    letterPreviewTitle: (jobTitle: string) => `Lettre de motivation : ${jobTitle}`,
    noLetterBody:
      "Ce CV a été généré avant l'ajout des lettres de motivation. Régénérez-le pour en obtenir une, ou rédigez-la dans l'éditeur.",
  },

  regenerate: {
    pending: "Régénération…",
    cta: "Régénérer (1 crédit)",
  },

  exportButtons: {
    dirtyHint: "Enregistrez pour télécharger votre dernière version.",
    word: "Word (.docx)",
    pdf: "PDF",
  },

  userMenu: {
    contactUs: "Nous contacter",
  },

  sidebar: {
    navAria: "Navigation",
    menuAria: "Menu",
    hide: "Masquer la navigation",
    show: "Afficher la navigation",
  },
} as const;
