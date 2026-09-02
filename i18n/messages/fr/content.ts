/** Copy for blog, legal and contact pages. */
export const content = {
  blog: {
    metaTitle: "Blog CV, ATS et emploi : guides pour candidater mieux",
    metaDescription:
      "Guides Veyala sur le CV ATS, les mots-clés recrutement, la lettre de motivation, le job hunting et les candidatures étudiants. Conseils concrets pour passer les filtres et décrocher des entretiens.",
    keywords: [
      "blog CV",
      "ATS",
      "mots-clés CV",
      "lettre de motivation",
      "offre d'emploi",
      "job hunting",
      "CV étudiant",
      "Campus France",
      "générateur CV IA",
      "candidature",
      "recrutement",
      "Veyala",
    ],
    eyebrow: "Blog Veyala",
    heading: "CV, ATS, emploi\u00A0: candidater avec méthode",
    intro:
      "Des guides actionnables pour adapter votre CV à chaque offre, passer les filtres ATS, écrire une lettre de motivation convaincante et accélérer votre recherche d'emploi.",
    rss: "Flux RSS",
    featured: "À la une",
    empty: "Aucun article publié pour le moment.",
    allPosts: "Tous les articles",
    guidesCount: (n: number) => `${n} guides`,
    practiceTitle: "Passez à la pratique",
    practiceText:
      "Collez une offre d'emploi : Veyala génère un CV optimisé ATS et une lettre de motivation adaptés en moins de 30 secondes.",
    notFoundTitle: "Article introuvable",
    breadcrumb: "Fil d'Ariane",
    home: "Accueil",
    publishedOn: (date: string) => `Publié le ${date}`,
    updatedOn: (date: string) => `Mis à jour le ${date}`,
    minutesShort: (n: number) => `${n} min`,
    faqTitle: "FAQ",
    backToBlog: "Retour au blog",
    shareOn: (network: string) => `Partager sur ${network}`,
    copyLink: "Copier le lien",
    copyLinkShort: "Lien",
    feedTitle: "Blog Veyala : CV, ATS et emploi",
    feedDescription:
      "Guides pratiques pour optimiser votre CV ATS, adapter votre candidature et rédiger des lettres de motivation efficaces.",
    feedLanguage: "fr-fr",
  },

  cgu: {
    purposeTitle: "1. Objet",
    purposeBody:
      "Les présentes CGU encadrent l'utilisation de Veyala, service de génération de CV assistée par intelligence artificielle. La création d'un compte vaut acceptation des présentes conditions.",
    accountTitle: "2. Compte et crédits",
    accountItems: [
      "Le compte est personnel ; vous êtes responsable de sa confidentialité.",
      "1 crédit permet 1 génération de CV (fichiers Word et PDF inclus).",
      "2 crédits sont offerts à l'inscription ; les crédits achetés n'expirent pas.",
      "Une génération échouée est automatiquement remboursée en crédits.",
      "Les crédits ne sont ni remboursables en euros, ni transférables.",
    ],
    generatedTitle: "3. Contenu généré",
    generatedBody:
      "L'IA reformule exclusivement les informations que vous fournissez : vous demeurez seul responsable de l'exactitude de votre CV de base et des CV générés que vous transmettez à des tiers.",
    acceptableUseTitle: "4. Usage acceptable",
    acceptableUseBody:
      "Sont notamment interdits : l'usurpation d'identité, la soumission de contenus illicites, la revente du service et toute tentative de contournement des mécanismes de crédits ou de sécurité.",
    paymentsTitle: "5. Paiements",
    paymentsBody:
      "Les paiements sont traités par Stripe. Les prix affichés sont en euros TTC. Le crédit du compte intervient à la confirmation du paiement par Stripe.",
    terminationTitle: "6. Résiliation",
    terminationBody:
      "Vous pouvez supprimer votre compte et vos données à tout moment depuis la page Confidentialité ou en nous contactant. Veyala peut suspendre un compte en cas de violation des présentes CGU.",
  },

  privacy: {
    collectedTitle: "Données collectées",
    collectedItems: [
      "Compte : email, nom, photo de profil (si connexion Google).",
      "CV : le fichier importé et sa version structurée, éditable par vous.",
      "Générations : offres d'emploi soumises et CV produits.",
      "Paiements : traités par Stripe ; nous ne stockons aucune donnée bancaire.",
      "Mesure d'audience (Google Analytics) : pages consultées, type d'appareil, langue.",
    ],
    purposesTitle: "Finalités et bases légales",
    purposesBody:
      "Vos données servent à fournir le service (exécution du contrat) : adapter votre CV aux offres, générer les exports et gérer vos crédits. La mesure d'audience sert à améliorer le site. Aucune revente de données, aucune publicité.",
    processorsTitle: "Sous-traitants",
    processorsBody:
      "Le texte de votre CV et des offres est transmis au fournisseur d'IA configuré uniquement pour la génération. Les paiements passent par Stripe ; l'envoi d'emails de connexion par notre prestataire SMTP. La mesure d'audience est réalisée par Google Ireland Limited (Google Analytics 4).",
    cookiesTitle: "Cookies de mesure d'audience",
    cookiesBody:
      "Un cookie Google Analytics est déposé pour des statistiques de fréquentation. Durée maximale : 13 mois.",
    retentionTitle: "Durées de conservation",
    retentionBody:
      "Vos données sont conservées tant que votre compte est actif, puis supprimées dans les 30 jours suivant la suppression du compte.",
    rightsTitle: "Vos droits (RGPD)",
    rightsBody:
      "Vous disposez des droits d'accès, de rectification, de portabilité, d'opposition et d'effacement. La suppression de compte et de toutes les données associées est disponible sur demande à contact@cvgen.example et depuis votre espace. Vous pouvez saisir la CNIL pour toute réclamation.",
  },

  legalNotice: {
    publisherTitle: "Éditeur du site",
    publisherBody:
      "Veyala est édité par [Raison sociale à compléter], [forme juridique], immatriculée sous le numéro [SIREN], dont le siège social est situé [adresse]. Directeur de la publication : [nom]. Contact : contact@cvgen.example.",
    hostingTitle: "Hébergement",
    hostingBody:
      "Le site est hébergé par [hébergeur, ex. Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA]. La base de données est hébergée par [Neon / Supabase].",
    ipTitle: "Propriété intellectuelle",
    ipBody:
      "L'ensemble des éléments du site (design, textes, logos, code) est protégé par le droit de la propriété intellectuelle. Les CV générés appartiennent à leurs utilisateurs.",
  },

  contact: {
    body: "Une question, un problème de génération ou une demande liée à vos données ? Écrivez-nous, nous répondons sous 48 h ouvrées.",
  },

  demo: {
    sectionAria: "Démo produit Veyala",
    close: "Fermer la démo",
    start: (duration: string) => `Lancer la démo · ${duration}`,
    replay: "Relancer",
    pause: "Pause",
    play: "Lecture",
    restart: "Recommencer",
    searchQuery: "optimiser CV ATS pour une offre d'emploi",
    resultsCount: "Environ 2\u00A0840\u00A0000 résultats (0,38\u00A0s)",
    pipeline: [
      "Lecture de l'offre",
      "Analyse des exigences",
      "Matching initial",
      "Adaptation ATS du CV",
      "Lettre de motivation",
      "Exports PDF / Word",
      "Matching optimisé",
    ],
    gaps: [
      { term: "Design System", kind: "Indispensable" },
      { term: "Figma", kind: "Outil / stack" },
      { term: "Recherche utilisateur", kind: "Indispensable" },
      { term: "Agile", kind: "Atout" },
    ],
    scenes: [
      {
        label: "Le besoin",
        caption: "Léa veut un CV vraiment adapté à une offre, pas un modèle générique.",
      },
      {
        label: "Recherche Google",
        caption: "Elle cherche comment optimiser un CV pour les filtres ATS.",
      },
      {
        label: "Découverte",
        caption:
          "Parmi les outils CV / ATS, elle repère Veyala : adapté à chaque offre, en français.",
      },
      {
        label: "Landing",
        caption: "Sur veyala.fr, elle clique sur « Générer mon CV gratuitement ».",
      },
      {
        label: "Compte",
        caption: "Création de compte : 2 crédits offerts, sans carte bancaire.",
      },
      {
        label: "CV de base",
        caption:
          "Étape clé : importer son CV de base (PDF/DOCX). L'IA reformule, elle n'invente rien.",
      },
      {
        label: "L'offre",
        caption: "Sur Générer un CV : elle colle l'offre, choisit un template, puis analyse.",
      },
      {
        label: "Matching",
        caption: "Analyse gratuite : score actuel vs projeté. Elle coche ce qu'elle assume.",
      },
      {
        label: "Génération",
        caption: "1 crédit : adaptation ATS du CV, lettre, exports Word/PDF, matching après.",
      },
      {
        label: "Résultat",
        caption: "Matching 58 % → 91 %. CV + lettre prêts à télécharger ou modifier.",
      },
      {
        label: "À vous",
        caption: "Même parcours produit : importer → analyser → générer → exporter.",
      },
    ],
    serp: [
      {
        title: "Veyala : CV adapté à chaque offre, compatible ATS",
        snippet:
          "Importez votre CV, collez une offre : analyse de matching gratuite, puis CV + lettre optimisés ATS. Export Word & PDF.",
      },
      {
        title: "Kickresume : créateur de CV et lettre par IA",
        snippet:
          "Plus de 40 modèles, génération IA et vérificateur ATS. Idéal pour étudiants et profils créatifs.",
      },
      {
        title: "Rezi : optimiseur de CV ATS avec score en temps réel",
        snippet:
          "Analysez votre CV pour les ATS, extrayez les mots-clés d'une offre et améliorez votre score Rezi.",
      },
      {
        title: "Teal : CV builder et suivi de candidatures",
        snippet:
          "Créez votre CV, suivez vos candidatures et gérez votre recherche d'emploi depuis un seul tableau de bord.",
      },
      {
        title: "Resume.io : modèles de CV professionnels en ligne",
        snippet:
          "Construisez un CV en quelques minutes avec des templates prêts à l'emploi et un export PDF.",
      },
      {
        title: "CVpass : scanner ATS et suite carrière (France)",
        snippet:
          "Score ATS calibré sur le marché français, lettre, LinkedIn et suivi de candidatures.",
      },
    ],
    hook: {
      eyebrow: "Parcours réel Veyala",
      titleBefore: "Un CV parfait pour ",
      titleHighlight: "cette",
      titleAfter: " offre",
      text: "Pas un template générique : un dossier aligné sur les mots-clés ATS de l'annonce.",
    },
    landing: {
      subtitle: "Collez une offre : Veyala génère un CV et une lettre parfaitement adaptés.",
    },
    register: {
      subtitle: "2 crédits offerts à l'inscription, sans carte bancaire.",
    },
    profile: {
      subtitle: "Source de vérité : l'IA reformule, elle n'invente pas.",
      importTitle: "Import automatique",
      importHint: "PDF ou DOCX · 8 Mo max",
      importDone: "CV analysé, profil rempli",
      importLoading: "Analyse du CV en cours…",
      importCta: "Importer mon CV (PDF ou DOCX)",
      identity: "Identité & contact",
      role: "Product Designer",
      skills: ["Figma", "UX Research", "Prototypage"],
      save: "Enregistrer mon CV de base",
    },
    compose: {
      title: "Générer un CV adapté",
      steps:
        "1. Analysez gratuitement le matching. 2. Cochez les compétences manquantes. 3. Générez (1 crédit).",
      jobTitle: "1. L'offre d'emploi",
      pasted: "Texte collé (recommandé)",
      offer: `Product Designer, Startup SaaS · Paris / Hybride
Missions : Design System, recherche utilisateur, prototypage Figma.
Must-have : Figma, Design System, UX Research. Nice : Agile, Framer.`,
      templateTitle: "2. Template",
      templates: ["Classique", "Épuré", "Modern"],
      analyzeCta: "Analyser le matching (gratuit)",
    },
    review: {
      title: "Analyse de matching",
      subtitle: "Aucun crédit débité. Cochez les compétences que vous assumez.",
      currentScore: "Score actuel",
      projectedScore: "Score projeté",
      maxScore: "Max si tout coché",
      gapsTitle: "Compétences manquantes",
      checkAll: "Tout cocher",
      generateCta: "Générer mon CV (1 crédit)",
    },
    generating: {
      title: "Génération en cours",
      subtitle: "Les étapes restent synchronisées même si la connexion est interrompue un instant.",
      matchBefore: "Matching avant",
      matchAfter: "Matching après",
    },
    result: {
      backToDashboard: "← Retour au tableau de bord",
      jobTitle: "Product Designer",
      templateMeta: "Template « Classique » · texte collé",
      source: "Source : texte collé",
      matchDelta: "Matching 58% → 91% (+33)",
      editCta: "Modifier dans l'éditeur",
      cvTitle: "CV optimisé",
      letterTitle: "Lettre de motivation",
      word: "Word (.docx)",
      pdf: "PDF",
      letterExcerpt:
        "Madame, Monsieur, forte d'une expérience en Design System et recherche utilisateur…",
      cvSkills: ["Figma", "Design System", "UX Research"],
    },
    outro: {
      eyebrow: "Workflow Veyala",
      title: "Le vrai parcours, en 4 étapes",
      steps: [
        "Importer mon CV de base",
        "Analyser le matching (gratuit)",
        "Générer mon CV (1 crédit)",
        "Exporter Word & PDF",
      ],
    },
  },
} as const;
