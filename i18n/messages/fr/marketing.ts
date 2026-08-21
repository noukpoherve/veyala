export const marketing = {
  badge: "Votre candidature, augmentée par l'IA",
  heroTitleBefore: "Votre CV, ",
  heroTitleHighlight: "adapté à chaque offre",
  heroTitleAfter: "en 30 secondes.",
  heroSubtitle:
    "Collez une offre d'emploi ou une fiche de formation : Veyala génère un CV et une lettre de motivation parfaitement adaptés. Export Word & PDF. Compatible ATS.",
  heroCta: "Générer mon CV gratuitement",
  atsScore: "ATS Score",
  jobChip: "Emploi",
  optimizedChip: "Optimisé",
  aiInProgress: "IA en cours",
  generating: "Génération...",
  atsCompatible: "Compatible ATS · Score 94/100",
  jsonLdDescription:
    "Générez un CV et une lettre de motivation adaptés à chaque offre, optimisés ATS, export Word & PDF.",
  stats: [
    { label: "CV & lettres générés", sub: "et ça augmente chaque jour" },
    { label: "établissements couverts", sub: "Campus France, Parcoursup, universités" },
    { label: "de taux de réponse moyen", sub: "déclaré par nos utilisateurs actifs" },
  ],
  howEyebrow: "Moins de 60 secondes",
  howTitle: "Comment ça marche ?",
  howSubtitle: "Trois étapes simples. Un résultat taillé sur mesure à chaque candidature.",
  steps: [
    {
      title: "J'importe mon profil",
      text: "Collez votre CV existant ou remplissez votre profil. Veyala analyse vos compétences, formations et expériences en quelques secondes.",
    },
    {
      title: "Je colle l'offre ou la formation",
      text: "Collez l'offre d'emploi, la fiche Campus France ou le vœu Parcoursup. L'IA extrait les critères clés en temps réel.",
    },
    {
      title: "Je télécharge mon CV + lettre",
      text: "En moins de 30 secondes : CV optimisé ATS et lettre de motivation cohérente, exportables en Word ou PDF premium.",
    },
  ],
  universesTitleBefore: "Deux univers, ",
  universesTitleHighlight: "une solution",
  universesSubtitle:
    "Emploi ou études : Veyala s'adapte à votre projet et aux codes de chaque système.",
  universeTablist: "Choisir un univers",
  universeJobTab: "Pour l'emploi",
  universeStudyTab: "Pour les études",
  universeJob: {
    badge: "Emploi",
    title: "Candidature à un emploi",
    text: "Collez l'offre, Veyala analyse les mots-clés, restructure votre parcours et génère un CV et une lettre qui parlent le langage du recruteur.",
    bullets: [
      "Analyse automatique des mots-clés de l'offre",
      "Reformulation ATS-optimisée de vos expériences",
      "Lettre de motivation ciblée et professionnelle",
      "20+ templates recruteurs premium",
      "Export Word natif & PDF haute qualité",
    ],
    chips: ["ATS ✓", "Word", "PDF", "LinkedIn"],
    cta: "Générer un CV emploi",
  },
  universeStudy: {
    badge: "Études",
    title: "Dossier d'études & mobilité",
    text: "Collez la fiche de formation ou le vœu, Veyala construit un dossier académique dans les codes de chaque plateforme (Campus France, Parcoursup ou universités canadiennes).",
    bullets: [
      "Dossier Campus France structuré selon les attentes officielles",
      "CV académique valorisant formations et projets",
      "Lettre de motivation adaptée à chaque vœu Parcoursup",
      "Formats Canada/Québec respectés à la lettre",
      "Export Word natif & PDF haute qualité",
    ],
    chips: ["Campus France", "Parcoursup", "Canada/Québec", "PDF"],
    cta: "Préparer un dossier études",
  },
  featuresEyebrow: "Fonctionnalités",
  featuresTitleBefore: "Tout ce qu'il vous faut, ",
  featuresTitleHighlight: "rien de superflu",
  featuresSubtitle:
    "Conçu pour être efficace dès la première utilisation, sans apprentissage, sans friction.",
  features: [
    {
      title: "Adaptation ATS intelligente",
      text: "Notre IA reformule vos expériences avec les mots-clés exacts de l'offre pour passer tous les filtres automatiques.",
    },
    {
      title: "Multi-templates premium",
      text: "Choisissez parmi 20+ templates conçus par des designers : modernes, classiques ou académiques.",
    },
    {
      title: "Export Word & PDF",
      text: "Fichiers natifs haute définition, directement exploitables sur tous les portails de candidature.",
    },
    {
      title: "Orchestration multi-IA",
      text: "Plusieurs modèles d'IA travaillent ensemble pour vous garantir la meilleure rédaction à chaque génération.",
    },
    {
      title: "Zéro invention",
      text: "Veyala valorise vos vraies expériences, sans jamais inventer de poste, de diplôme ou de compétence.",
    },
    {
      title: "Lettre de motivation cohérente",
      text: "Construite autour de votre CV et de l'offre : tonalité professionnelle, personnalisée, convaincante.",
    },
  ],
  templatesEyebrow: "Templates",
  templatesTitleBefore: "Designs ",
  templatesTitleHighlight: "premium",
  templatesSubtitle:
    "Chaque template est conçu pour impressionner recruteurs et commissions académiques.",
  pricingEyebrow: "Tarifs",
  pricingTitleBefore: "Payez ",
  pricingTitleHighlight: "ce que vous utilisez",
  pricingSubtitle: "Packs de crédits sans abonnement. Achetez quand vous en avez besoin.",
  popular: "Populaire",
  forCredits: (n: number) => `pour ${n} CV`,
  perCv: (price: string) => `${price} / CV`,
  pricingFoot: "Les crédits n'expirent jamais · Paiement sécurisé par Stripe · Pas d'abonnement",
  plans: [
    {
      name: "Starter",
      cta: "Commencer",
      features: (credits: number) => [
        `${credits} générations de CV`,
        `${credits} lettres de motivation`,
        "Export Word & PDF",
        "Templates standard",
        "Support e-mail",
      ],
    },
    {
      name: "Pro",
      cta: "Choisir Pro",
      features: (credits: number) => [
        `${credits} générations de CV`,
        `${credits} lettres de motivation`,
        "Export Word & PDF",
        "Tous les templates premium",
        "Génération prioritaire",
        "Accès multi-IA",
      ],
    },
    {
      name: "Expert",
      cta: "Choisir Expert",
      features: (credits: number) => [
        `${credits} générations de CV`,
        `${credits} lettres de motivation`,
        "Export Word & PDF",
        "Tous les templates premium",
        "Génération prioritaire",
        "Accès premium IA",
        "Templates exclusifs",
      ],
    },
  ],
  testimonialsTitleBefore: "Ils ont décroché ",
  testimonialsTitleHighlight: "leur entretien",
  testimonialsSubtitle: "Étudiants et jeunes actifs qui font confiance à Veyala.",
  starsAria: "5 étoiles sur 5",
  testimonials: [
    {
      quote:
        "J'ai généré mon CV Campus France en 2 minutes. L'IA a parfaitement adapté mon parcours aux critères de l'université cible. Lettre impeccable.",
      initials: "LM",
      name: "Léa Martin",
      role: "Master Marketing, Sciences Po Paris",
    },
    {
      quote:
        "J'envoie une candidature sur 3 offres, et j'ai décroché 2 entretiens la même semaine. Le score ATS à 94% sur ma dernière candidature parle de lui-même.",
      initials: "TD",
      name: "Thomas Dubois",
      role: "Ingénieur junior, Paris",
    },
    {
      quote:
        "Mon dossier pour l'Université de Montréal était pile dans les codes locaux. Veyala a su adapter le format sans que j'aie rien à reformuler.",
      initials: "AB",
      name: "Aïcha Benali",
      role: "Étudiante Campus France, Canada",
    },
    {
      quote:
        "Après 10 ans en comptabilité, je me reconvertis dans le dev. Veyala a mis en valeur mes compétences transversales d'une façon que je n'aurais jamais écrite.",
      initials: "HM",
      name: "Hugo Moreau",
      role: "Reconversion professionnelle, Lyon",
    },
  ],
  faqTitle: "Questions fréquentes",
  faqSubtitle: "Tout ce que vous voulez savoir avant de commencer.",
  faq: [
    {
      question: "La génération est-elle vraiment instantanée ?",
      answer:
        "Oui. En moyenne, la génération complète (CV optimisé et lettre de motivation) prend moins de 30 secondes. L'analyse de l'offre se fait en temps réel dès que vous la collez.",
    },
    {
      question: "Mes données personnelles sont-elles protégées ?",
      answer:
        "Oui. Vos données sont chiffrées et ne sont jamais revendues ni utilisées pour entraîner des modèles d'IA. Vous pouvez modifier ou supprimer votre profil et vos documents à tout moment.",
    },
    {
      question: "Quels formats puis-je exporter ?",
      answer:
        "Chaque génération produit un fichier Word (.docx) natif et un PDF haute définition au design identique, avec texte sélectionnable et liens cliquables, directement exploitables sur tous les portails de candidature.",
    },
    {
      question: "Quelle IA est utilisée par Veyala ?",
      answer:
        "Veyala orchestre plusieurs modèles d'IA de pointe et sélectionne le plus pertinent pour chaque étape : analyse de l'offre, reformulation ATS, rédaction de la lettre. Vous bénéficiez toujours de la meilleure qualité disponible.",
    },
    {
      question: "Mon CV sera-t-il vraiment unique à chaque offre ?",
      answer:
        "Oui. Chaque génération part de votre profil et de l'offre précise que vous collez : les mots-clés, l'ordre des rubriques et les formulations sont adaptés à cette candidature, sans jamais rien inventer.",
    },
    {
      question: "Comment fonctionnent les crédits ?",
      answer:
        "1 crédit = 1 génération complète (CV + lettre, Word + PDF). Vous achetez des packs sans abonnement, à partir de 1,99 € pour 5 CV, et vos crédits n'expirent jamais. Une génération échouée est automatiquement remboursée.",
    },
  ],
  ctaEyebrow: "Commencez dès aujourd'hui, gratuitement",
  ctaTitleBefore: "Votre prochaine candidature",
  ctaTitleHighlight: "mérite le meilleur CV.",
  ctaSubtitle:
    "Rejoignez 48 000+ candidats qui ont déjà confié leur candidature à Veyala. Premier CV gratuit, sans carte bancaire.",
  ctaTemplates: "Voir tous les templates",
  ctaFoot: "Aucun abonnement requis · Premier CV offert · Données protégées",
  footerTagline:
    "Votre candidature, augmentée par l'IA. CV et lettres de motivation en 30 secondes.",
  footerProduct: "Produit",
  footerResources: "Ressources",
  footerLegal: "Légal",
  footerGuideCv: "Guide CV",
  footerGuideLetter: "Guide lettre",
  footerApi: "API",
  footerCookies: "Cookies",
  footerRights: "Tous droits réservés.",
  footerCgu: "CGU",
  footerPrivacy: "Confidentialité",
  footerMentions: "Mentions légales",
  demoCta: "Voir la démo",
  watchDemo: "Regarder la démo",
} as const;
