export const errors = {
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
  insufficientCredits: "Solde de crédits insuffisant. Rechargez dans « Crédits » pour continuer.",
  forbidden: "Action non autorisée.",
  notFound: "Élément introuvable.",
  needBaseCv: "Importez d'abord votre CV de base dans « Mon CV de base ».",
  fileTooLarge: "Fichier trop volumineux.",
  unsupportedFormat: "Format de fichier non supporté.",
  invalidData: "Les données fournies sont invalides ou illisibles.",
  unavailable: "Le service est momentanément indisponible. Réessayez dans quelques instants.",
  authRequired: "Authentification requise.",
  pageNotFoundTitle: "Cette page est introuvable",
  pageNotFoundBody:
    "Le lien est peut-être incorrect, ou la page a été déplacée. Revenez à l'accueil ou contactez le support si vous avez besoin d'aide.",
  serverTitle: "Un incident technique est survenu",
  serverBody:
    "Notre équipe a été notifiée. Réessayez dans un instant, ou contactez le support si le problème continue. Nous vous aiderons rapidement.",
  unavailableTitle: "Service momentanément indisponible",
  unavailableBody:
    "Nous effectuons une maintenance ou subissons une surcharge. Réessayez dans quelques minutes, ou écrivez au support si c'est urgent.",
  genericTitle: "Impossible de poursuivre",
  genericBody:
    "Une erreur inattendue a interrompu cette action. Réessayez, ou contactez le support avec le contexte de ce que vous faisiez.",
  ref: "Réf.",
  errorKind: "Erreur",
  orPrefix: "Ou",
  backToAdmin: "Retour admin",
  appNotFoundTitle: "Ressource introuvable",
  appNotFoundBody:
    "Ce CV ou cette page n'existe pas, ou vous n'y avez pas accès. Revenez au tableau de bord, ou contactez le support si besoin.",
  reasons: {
    regenerate: {
      title: "La régénération n'a pas abouti",
      body: "Votre crédit a été remboursé si un débit avait eu lieu. Réessayez depuis votre CV, ou contactez le support si cela se reproduit.",
      back: "Retour au CV",
    },
    analyze: {
      title: "L'analyse n'a pas abouti",
      body: "Le service est peut-être momentanément indisponible. Réessayez dans un instant, ou contactez le support si le problème continue.",
      back: "Retour à la génération",
    },
    generate: {
      title: "La génération n'a pas abouti",
      body: "Votre crédit a été remboursé si un débit avait eu lieu. Vous pouvez relancer une génération, ou écrire au support.",
      back: "Retour à la génération",
    },
    payment: {
      title: "Paiement indisponible",
      body: "Nous n'avons pas pu ouvrir la session de paiement. Réessayez plus tard, ou contactez le support pour être accompagné.",
      back: "Retour aux crédits",
    },
  },
} as const;

export const emails = {
  tagline: "Veyala : votre candidature, augmentée par l'IA.",
  buttonFallback: "Si le bouton ne s'affiche pas, copiez ce lien :",
  terms: "CGU",
  privacy: "Confidentialité",
  confirmation: {
    subject: "Confirmez votre email | Veyala",
    preheader: "Un clic pour activer votre compte et vos 2 crédits offerts.",
    title: "Bienvenue sur Veyala",
    intro:
      "Merci d'avoir créé votre compte. Confirmez votre adresse email pour l'activer et recevoir vos 2 crédits offerts, sans carte bancaire.",
    cta: "Confirmer mon adresse email",
    note: "Ce lien expire dans une heure. Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.",
  },
  recovery: {
    subject: "Réinitialisez votre mot de passe | Veyala",
    preheader: "Un lien sécurisé pour choisir un nouveau mot de passe.",
    title: "Réinitialisation du mot de passe",
    intro:
      "Nous avons reçu une demande de réinitialisation pour le compte associé à cette adresse. Choisissez un nouveau mot de passe pour retrouver l'accès à votre espace.",
    cta: "Choisir un nouveau mot de passe",
    note: "Ce lien expire dans une heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe actuel reste inchangé.",
  },
  invite: {
    subject: "Invitation à rejoindre Veyala",
    preheader: "Un administrateur vous ouvre un accès à l'espace Veyala.",
    title: "Vous êtes invité sur Veyala",
    intro:
      "Un administrateur vous ouvre un accès à l'espace Veyala. Définissez votre mot de passe pour activer votre compte et rejoindre l'équipe.",
    cta: "Activer mon compte",
    note: "Ce lien expire dans une heure. Si vous n'attendiez pas cette invitation, ignorez cet email.",
  },
  emailChange: {
    subject: "Confirmez votre nouvelle adresse | Veyala",
    preheader: "Validez ce changement d'email pour sécuriser votre compte.",
    title: "Confirmez votre nouvelle adresse",
    intro:
      "Une demande de changement d'adresse email a été faite sur votre compte Veyala. Confirmez {{ .NewEmail }} pour finaliser la modification.",
    cta: "Confirmer cette adresse",
    note: "Ce lien expire dans une heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre adresse actuelle reste inchangée.",
  },
  passwordChanged: {
    subject: "Votre mot de passe a été modifié | Veyala",
    preheader: "Notification de sécurité : le mot de passe de votre compte a changé.",
    title: "Votre mot de passe a été modifié",
    intro:
      "Le mot de passe de votre compte Veyala vient d'être mis à jour. Si c'est bien vous, aucune action n'est nécessaire.\n\nSi vous n'êtes pas à l'origine de ce changement, reconnectez-vous dès que possible et contactez le support depuis votre espace.",
    cta: "Ouvrir Veyala",
    note: "Cet email est envoyé automatiquement pour la sécurité de votre compte.",
  },
  supportNotifyTitle: "Nouveau message support",
  supportNotifyPreheader: (email: string) => `Nouveau message de ${email}`,
  supportNotifyIntro: (email: string, subject: string) =>
    `${email} vient d'écrire depuis l'espace Veyala, à propos de « ${subject} ». Répondez depuis la boîte de réception admin.`,
  supportNotifyCta: "Ouvrir la boîte de réception",
  supportReplyTitle: "L'équipe Veyala vous a répondu",
  supportReplyPreheader: "L'équipe Veyala vous a répondu.",
  supportReplyIntro: (subject: string) =>
    `À propos de votre demande « ${subject} ». Vous pouvez poursuivre la conversation depuis votre espace, page Support.`,
  supportReplyCta: "Voir la conversation",
  supportReplyNote:
    "Cet email est une copie : la réponse est aussi disponible dans votre espace Veyala.",
} as const;

export const cv = {
  contact: "Contact",
  summary: "Profil",
  experience: "Expériences professionnelles",
  experienceShort: "Expériences",
  education: "Formation",
  educationShort: "Formations",
  certifications: "Certifications",
  skills: "Compétences",
  languages: "Langues",
  interests: "Centres d'intérêt",
  information: "Informations",
  stack: "Stack",
  documentTitle: (name: string) => `CV — ${name}`,
  letterDocumentTitle: (name: string) => `Lettre de motivation — ${name}`,
  letterDate: (date: string) => `Le ${date}`,
  letterSubject: (jobTitle: string) => `Objet : candidature au poste de ${jobTitle}`,
  photoAlt: (name: string) => `Photo de ${name}`,
} as const;
