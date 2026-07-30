import type { BlogPost } from "@/lib/blog/types";

const AUTHOR = {
  name: "Équipe Veyala",
  role: "Experts CV, ATS & candidature",
} as const;

/**
 * Seed catalog for BlogPost rows — French, SEO-focused for CV / ATS / emploi / lettre.
 * Runtime reads come from Postgres via lib/blog/queries.ts.
 */
export const SEED_BLOG_POSTS: BlogPost[] = [
  {
    slug: "passer-filtres-ats-mots-cles-cv",
    title: "Comment passer les filtres ATS : mots-clés CV et score de matching",
    description:
      "Guide complet pour optimiser votre CV ATS : mots-clés de l'offre d'emploi, format compatible, score de matching et erreurs qui font rejeter votre candidature avant un recruteur.",
    excerpt:
      "80 % des CV sont filtrés par un ATS avant d'être lus. Voici comment formuler vos expériences pour maximiser votre score de matching.",
    category: "ats",
    tags: ["ATS", "mots-clés CV", "recrutement", "candidature"],
    keywords: [
      "ATS",
      "filtre ATS",
      "CV ATS",
      "mots-clés CV",
      "optimiser CV ATS",
      "score matching CV",
      "candidature emploi",
      "logiciel recrutement",
      "CV compatible ATS",
      "passer filtre ATS",
    ],
    publishedAt: "2026-06-12",
    updatedAt: "2026-07-20",
    readingTimeMin: 9,
    featured: true,
    author: AUTHOR,
    accent: "#2563EB",
    body: [
      {
        type: "p",
        text: "Un Applicant Tracking System (ATS) est le logiciel que la plupart des entreprises utilisent pour réceptionner, parser et classer les candidatures. Si votre CV n'est pas lisible par la machine — ou s'il ne contient pas les mots-clés de l'offre — il peut être écarté avant qu'un recruteur ne le voie.",
      },
      {
        type: "callout",
        title: "En bref",
        text: "Un CV ATS-friendly combine un format simple (Word ou PDF texte), des intitulés de postes alignés sur l'offre, et les compétences exactes demandées dans la fiche de poste — sans keyword stuffing.",
      },
      {
        type: "h2",
        text: "Comment fonctionne un filtre ATS ?",
      },
      {
        type: "p",
        text: "L'ATS extrait le texte de votre fichier, identifie sections (expérience, formation, compétences), puis calcule un score de matching entre votre profil et l'offre d'emploi. Les candidats sous un seuil défini sont souvent exclus automatiquement.",
      },
      {
        type: "ol",
        items: [
          "Parsing : extraction du texte (tableaux, colonnes et images nuisent souvent au parsing).",
          "Normalisation : le système standardise titres, dates et compétences.",
          "Matching : comparaison aux mots-clés et critères de l'offre (hard skills, outils, diplômes).",
          "Classement : score + filtres (années d'expérience, localisation, langues).",
        ],
      },
      {
        type: "h2",
        text: "Les mots-clés CV qui font vraiment la différence",
      },
      {
        type: "p",
        text: "Les meilleurs mots-clés ne sont pas génériques (« dynamique », « motivé ») : ce sont les termes techniques et métier repris dans l'annonce. Exemple : si l'offre demande « React », « TypeScript » et « CI/CD », ces termes doivent apparaître naturellement dans vos expériences pertinentes.",
      },
      {
        type: "ul",
        items: [
          "Reprendre les intitulés exacts des compétences (ex. « gestion de projet Agile » vs seulement « Agile »).",
          "Inclure outils, frameworks et certifications cités dans l'offre.",
          "Aligner le titre du poste visé (ou un titre proche) avec celui de l'annonce.",
          "Éviter les acronymes seuls si l'offre utilise la forme développée — ou mettre les deux.",
        ],
      },
      {
        type: "h2",
        text: "Format CV compatible ATS : ce qu'il faut éviter",
      },
      {
        type: "ul",
        items: [
          "CV en image, scan ou PDF non sélectionnable",
          "Colonnes multiples, tableaux complexes, encadrés décoratifs",
          "Icônes à la place du texte pour les compétences",
          "En-têtes / pieds de page contenant des infos critiques (certains ATS les ignorent)",
          "Polices fantaisie et barres de compétences graphiques non textuelles",
        ],
      },
      {
        type: "h2",
        text: "Méthode en 4 étapes pour adapter votre CV à chaque offre",
      },
      {
        type: "ol",
        items: [
          "Surlignez dans l'offre les compétences obligatoires et souhaitées.",
          "Mappez chaque exigence à une preuve concrète dans votre parcours.",
          "Reformulez vos puces d'expérience avec les verbes et termes de l'annonce.",
          "Vérifiez le format (DOCX/PDF texte) et la cohérence des dates.",
        ],
      },
      {
        type: "quote",
        text: "Un bon CV ATS n'est pas un CV « bourré » de mots-clés : c'est un CV lisible par la machine et convaincant pour l'humain qui le lira ensuite.",
      },
      {
        type: "h2",
        text: "Comment Veyala optimise votre score ATS",
      },
      {
        type: "p",
        text: "Veyala analyse l'offre d'emploi et reformule votre profil pour intégrer les mots-clés pertinents, tout en gardant un format export Word & PDF compatible ATS. En quelques secondes, vous obtenez un CV sur mesure pour cette candidature précise.",
      },
      {
        type: "cta",
        text: "Collez une offre et générez un CV optimisé ATS en 30 secondes.",
        href: "/register",
        label: "Générer mon CV ATS",
      },
    ],
    faq: [
      {
        question: "Qu'est-ce qu'un ATS en recrutement ?",
        answer:
          "Un ATS (Applicant Tracking System) est un logiciel de suivi des candidatures utilisé par les entreprises pour recevoir, filtrer et classer les CV avant le tri humain.",
      },
      {
        question: "Le PDF est-il compatible ATS ?",
        answer:
          "Oui, si le PDF contient du texte sélectionnable. Évitez les PDF scannés ou purement graphiques. Le format Word (.docx) reste souvent le plus sûr pour le parsing.",
      },
      {
        question: "Faut-il un CV différent pour chaque offre ?",
        answer:
          "Oui, idéalement. Adapter les mots-clés et les expériences mises en avant augmente fortement votre score de matching et vos chances d'entretien.",
      },
    ],
  },
  {
    slug: "adapter-cv-offre-emploi",
    title: "Adapter son CV à une offre d'emploi : méthode concrète (exemples)",
    description:
      "Comment adapter votre CV à chaque offre d'emploi : analyse de la fiche de poste, reformulation des expériences, compétences ciblées et checklist avant d'envoyer votre candidature.",
    excerpt:
      "Un CV générique perd face à un CV ciblé. Voici une méthode simple pour matcher chaque offre sans tout réécrire à la main.",
    category: "cv",
    tags: ["CV", "offre d'emploi", "candidature", "personnalisation"],
    keywords: [
      "adapter CV offre emploi",
      "CV personnalisé",
      "CV ciblé",
      "fiche de poste",
      "candidature emploi",
      "reformuler expériences CV",
      "CV sur mesure",
      "répondre à une offre",
      "matching CV offre",
    ],
    publishedAt: "2026-06-18",
    updatedAt: "2026-07-18",
    readingTimeMin: 8,
    featured: true,
    author: AUTHOR,
    accent: "#1D4ED8",
    body: [
      {
        type: "p",
        text: "Envoyer le même CV à 50 offres est la stratégie la plus courante… et la moins efficace. Les recruteurs (et les ATS) cherchent la preuve que vous comprenez le poste. Adapter son CV, ce n'est pas mentir : c'est hiérarchiser et reformuler.",
      },
      {
        type: "h2",
        text: "1. Décoder la fiche de poste",
      },
      {
        type: "p",
        text: "Séparez clairement ce qui est indispensable (must-have) de ce qui est un plus (nice-to-have). Notez les verbes d'action, les outils nommés, le niveau d'expérience et le contexte (startup, grand groupe, remote, etc.).",
      },
      {
        type: "ul",
        items: [
          "Missions principales vs tâches secondaires",
          "Compétences techniques et soft skills explicites",
          "Indicateurs de succès (chiffres, résultats, KPIs)",
          "Mots répétés dans l'annonce = priorité haute",
        ],
      },
      {
        type: "h2",
        text: "2. Réécrire le pitch / accroche du CV",
      },
      {
        type: "p",
        text: "Votre accroche doit répondre à l'offre en 2–3 lignes : qui vous êtes pour ce poste, votre valeur principale, et un résultat concret. Remplacez « profil polyvalent » par une promesse liée au besoin.",
      },
      {
        type: "h2",
        text: "3. Sélectionner et reformuler les expériences",
      },
      {
        type: "p",
        text: "Gardez 3 à 5 expériences max sur un CV ciblé. Pour chaque puce, utilisez le schéma : action + contexte + résultat. Intégrez le vocabulaire de l'offre sans forcer.",
      },
      {
        type: "callout",
        title: "Exemple",
        text: "Avant : « Gestion de projets marketing ». Après (offre growth) : « Piloté 4 campagnes acquisition B2B (SEO, LinkedIn Ads) : +38 % de leads qualifiés en 6 mois ».",
      },
      {
        type: "h2",
        text: "4. Compétences : ordre stratégique",
      },
      {
        type: "p",
        text: "Placez en premier les compétences présentes dans l'annonce. Retirez ou reléguez celles qui diluent le message. Un CV lisible en 6 secondes gagne face à une liste encyclopédique.",
      },
      {
        type: "h2",
        text: "Checklist avant envoi",
      },
      {
        type: "ol",
        items: [
          "Le titre ou l'accroche évoque le poste visé",
          "Au moins 70 % des must-have apparaissent clairement",
          "Chaque expérience clé a un résultat mesurable",
          "Orthographe, dates et export ATS vérifiés",
          "Lettre de motivation cohérente avec le même angle",
        ],
      },
      {
        type: "cta",
        text: "Collez l'offre : Veyala adapte automatiquement votre CV et votre lettre.",
        href: "/register",
        label: "Adapter mon CV maintenant",
      },
    ],
    faq: [
      {
        question: "Combien de temps pour adapter un CV à une offre ?",
        answer:
          "Manuellement : 30 à 90 minutes. Avec un outil comme Veyala, l'adaptation ciblée (CV + lettre) peut prendre moins d'une minute.",
      },
      {
        question: "Faut-il inventer des compétences pour matcher l'offre ?",
        answer:
          "Non. Adaptez uniquement ce que vous pouvez défendre en entretien. Le matching se fait par reformulation et priorisation, pas par invention.",
      },
    ],
  },
  {
    slug: "lettre-motivation-structure-efficace",
    title: "Lettre de motivation : structure efficace qui convertit en 2026",
    description:
      "Structure d'une lettre de motivation percutante : accroche, preuves, motivation entreprise, conclusion CTA. Exemples et erreurs à éviter pour décrocher un entretien.",
    excerpt:
      "Une lettre utile n'est pas un résumé du CV. Voici la structure en 4 blocs qui fonctionne encore auprès des recruteurs.",
    category: "lettre",
    tags: ["lettre de motivation", "candidature", "entretien"],
    keywords: [
      "lettre de motivation",
      "structure lettre motivation",
      "exemple lettre motivation",
      "écrire lettre motivation",
      "lettre motivation emploi",
      "candidature",
      "décrocher entretien",
      "lettre motivation efficace",
    ],
    publishedAt: "2026-06-25",
    updatedAt: "2026-07-15",
    readingTimeMin: 7,
    featured: true,
    author: AUTHOR,
    accent: "#0284C7",
    body: [
      {
        type: "p",
        text: "La lettre de motivation reste demandée pour de nombreuses candidatures en France — entreprises, administrations, écoles. Son rôle : montrer pourquoi vous et pourquoi eux, pas répéter le CV ligne à ligne.",
      },
      {
        type: "h2",
        text: "La structure en 4 blocs",
      },
      {
        type: "h3",
        text: "1. Accroche (pourquoi ce poste, maintenant)",
      },
      {
        type: "p",
        text: "Ouvrez sur le besoin de l'entreprise ou une réalisation liée au poste. Évitez « Je me permets de vous contacter… ».",
      },
      {
        type: "h3",
        text: "2. Preuves (2–3 arguments issus de votre parcours)",
      },
      {
        type: "p",
        text: "Sélectionnez des expériences qui répondent aux missions de l'offre. Chiffres, responsabilités, impact.",
      },
      {
        type: "h3",
        text: "3. Motivation entreprise (pourquoi eux)",
      },
      {
        type: "p",
        text: "Citez un projet, une valeur, un marché ou une actualité concrète. Montrez que vous avez lu l'annonce et l'entreprise.",
      },
      {
        type: "h3",
        text: "4. Conclusion + appel à l'action",
      },
      {
        type: "p",
        text: "Proposez un échange. Restez court, confiant, sans formules creuses.",
      },
      {
        type: "h2",
        text: "Longueur et ton",
      },
      {
        type: "ul",
        items: [
          "Ideal : 250–400 mots (une page max)",
          "Ton professionnel, actif, précis",
          "Même vocabulaire métier que l'offre (sans copier-coller)",
          "Cohérence totale avec le CV joint",
        ],
      },
      {
        type: "h2",
        text: "Erreurs qui tuent une lettre",
      },
      {
        type: "ul",
        items: [
          "Lettre générique recyclée pour 20 entreprises",
          "Orthographe et prénom du recruteur approximatifs",
          "Focus sur ce que vous voulez gagner, pas sur ce que vous apportez",
          "Trop long, trop vague, trop humble ou trop arrogant",
        ],
      },
      {
        type: "cta",
        text: "Générez une lettre alignée sur votre CV et sur l'offre en quelques secondes.",
        href: "/register",
        label: "Créer ma lettre de motivation",
      },
    ],
    faq: [
      {
        question: "La lettre de motivation est-elle encore utile ?",
        answer:
          "Oui, surtout en France et pour les postes en tension qualitative (cadres, stages sélectifs, écoles). Elle différencie deux CV techniques proches.",
      },
      {
        question: "Faut-il une lettre si l'ATS ne la lit pas ?",
        answer:
          "Souvent le recruteur la lit après le filtre CV. Une lettre ciblée reste un avantage dès que votre dossier passe l'ATS.",
      },
    ],
  },
  {
    slug: "erreurs-cv-qui-font-rejeter",
    title: "12 erreurs CV qui font rejeter votre candidature (et comment les corriger)",
    description:
      "Les erreurs CV les plus fréquentes : mise en page non ATS, fautes, expériences vagues, photo, longueur. Checklist pour un CV professionnel qui passe le tri.",
    excerpt:
      "Avant de blâmer le marché de l'emploi, vérifiez ces 12 points qui font sortir un CV du process en quelques secondes.",
    category: "cv",
    tags: ["CV", "erreurs", "recrutement", "conseils"],
    keywords: [
      "erreurs CV",
      "CV rejeté",
      "fautes CV",
      "CV professionnel",
      "améliorer CV",
      "conseils CV",
      "mise en page CV",
      "CV trop long",
      "candidature refusée",
    ],
    publishedAt: "2026-07-02",
    updatedAt: "2026-07-22",
    readingTimeMin: 6,
    author: AUTHOR,
    accent: "#0369A1",
    body: [
      {
        type: "p",
        text: "Un recruteur passe en moyenne moins de 10 secondes sur un CV au premier passage. Les erreurs ci-dessous sont des signaux d'alerte immédiats — pour l'humain comme pour l'ATS.",
      },
      {
        type: "ol",
        items: [
          "CV générique non adapté à l'offre",
          "Fautes d'orthographe et incohérences de dates",
          "Expériences sans résultats mesurables",
          "Mise en page à colonnes illisibles par ATS",
          "Titre de CV vague (« À la recherche d'un emploi »)",
          "Coordonnées incomplètes ou email non professionnel",
          "Trop de jargon interne incompréhensible hors de votre boîte",
          "Liste de compétences sans preuve d'usage",
          "Longueur excessive (3+ pages sans seniorité justifiée)",
          "Photo ou éléments graphiques qui cassent le parsing",
          "Trous non expliqués et intitulés trompeurs",
          "Mauvais format d'export (image, .pages, .odt fragile)",
        ],
      },
      {
        type: "h2",
        text: "Priorité absolue : clarté + preuves",
      },
      {
        type: "p",
        text: "Corrigez d'abord le fond : chaque ligne doit répondre à « et alors ? ». Puis le format : un document propre, exporté en Word ou PDF texte, avec les mots-clés de l'offre.",
      },
      {
        type: "callout",
        title: "Astuce Veyala",
        text: "Générez une version ciblée par offre : vous réduisez automatiquement le risque de CV générique et de mismatch ATS.",
      },
      {
        type: "cta",
        text: "Corrigez structure, mots-clés et formulation avec une génération guidée par l'offre.",
        href: "/register",
        label: "Optimiser mon CV",
      },
    ],
  },
  {
    slug: "cv-ia-avantages-limites-bonnes-pratiques",
    title: "CV généré par IA : avantages, limites et bonnes pratiques",
    description:
      "Utiliser l'IA pour rédiger un CV : gains de temps, personnalisation ATS, risques d'hallucination et règles d'éthique. Comment Veyala reformule sans inventer votre parcours.",
    excerpt:
      "L'IA accélère la rédaction de CV — à condition de rester maître des faits. Voici le bon usage pour candidater plus vite, sans se tirer une balle dans le pied.",
    category: "ia",
    tags: ["IA", "CV", "ATS", "productivité"],
    keywords: [
      "CV IA",
      "générateur CV IA",
      "rédiger CV intelligence artificielle",
      "CV ChatGPT",
      "optimiser CV IA",
      "candidature IA",
      "Veyala",
      "CV automatique",
      "lettre motivation IA",
    ],
    publishedAt: "2026-07-08",
    updatedAt: "2026-07-25",
    readingTimeMin: 8,
    author: AUTHOR,
    accent: "#4F46E5",
    body: [
      {
        type: "p",
        text: "Les générateurs de CV par IA explosent parce que le vrai goulot d'étranglement n'est plus « avoir un CV », c'est « avoir le bon CV pour cette offre ». Bien utilisée, l'IA devient un accélérateur de matching.",
      },
      {
        type: "h2",
        text: "Ce que l'IA fait très bien",
      },
      {
        type: "ul",
        items: [
          "Reformuler des expériences avec le vocabulaire de l'offre",
          "Proposer une structure claire et ATS-friendly",
          "Générer une lettre cohérente avec le CV",
          "Gagner du temps sur les candidatures multiples",
        ],
      },
      {
        type: "h2",
        text: "Les limites à connaître",
      },
      {
        type: "ul",
        items: [
          "Risque d'ajouter des compétences non maîtrisées si le prompt est flou",
          "Ton trop générique si l'outil ne lit pas l'offre",
          "Incohérences factuelles si la source profil est incomplète",
          "Relecture humaine indispensable avant envoi",
        ],
      },
      {
        type: "h2",
        text: "Bonnes pratiques",
      },
      {
        type: "ol",
        items: [
          "Partir d'un profil véridique (dates, postes, résultats).",
          "Toujours coller l'offre d'emploi pour un ciblage réel.",
          "Vérifier chaque affirmation défendable en entretien.",
          "Exporter un format compatible ATS (Word / PDF texte).",
          "Itérer : 1 offre = 1 version ciblée.",
        ],
      },
      {
        type: "quote",
        text: "Chez Veyala, l'IA reformule exclusivement vos informations : elle n'invente pas un parcours. Vous restez responsable du contenu envoyé.",
        cite: "Équipe produit Veyala",
      },
      {
        type: "cta",
        text: "Importez votre profil, collez une offre, exportez CV + lettre.",
        href: "/register",
        label: "Essayer Veyala",
      },
    ],
    faq: [
      {
        question: "Un recruteur détecte-t-il un CV écrit par IA ?",
        answer:
          "Ce qui compte, c'est la précision et la crédibilité. Un texte IA générique se repère ; un texte factuel, ciblé et relu passe comme n'importe quelle bonne rédaction.",
      },
      {
        question: "ChatGPT suffit-il pour un CV ATS ?",
        answer:
          "Un chat généraliste aide à rédiger, mais un outil spécialisé qui parse l'offre et exporte un format ATS (comme Veyala) réduit les allers-retours et les erreurs de matching.",
      },
    ],
  },
  {
    slug: "cv-etudiant-stage-alternance-campus-france",
    title: "CV étudiant : stage, alternance, Parcoursup et Campus France",
    description:
      "Réussir son CV étudiant pour stage, alternance, Parcoursup ou Campus France : projets, soft skills, formations et lettre de motivation adaptée aux dossiers scolaires.",
    excerpt:
      "Peu d'expérience pro ? Votre CV étudiant peut quand même convaincre — si vous valorisez projets, associations et résultats académiques.",
    category: "etudes",
    tags: ["étudiant", "stage", "Campus France", "Parcoursup"],
    keywords: [
      "CV étudiant",
      "CV stage",
      "CV alternance",
      "Campus France CV",
      "Parcoursup",
      "lettre motivation étudiant",
      "candidature stage",
      "CV première expérience",
      "dossier candidature formation",
    ],
    publishedAt: "2026-07-14",
    updatedAt: "2026-07-28",
    readingTimeMin: 7,
    author: AUTHOR,
    accent: "#0EA5E9",
    body: [
      {
        type: "p",
        text: "Pour un stage, une alternance ou un dossier Campus France / formation sélective, le jury ne cherche pas 10 ans d'expérience : il cherche du potentiel, de la cohérence et des preuves d'engagement.",
      },
      {
        type: "h2",
        text: "Ce qui compte sur un CV étudiant",
      },
      {
        type: "ul",
        items: [
          "Projets académiques avec livrable et rôle clair",
          "Associations, jobs étudiants, bénévolat (responsabilités)",
          "Compétences outils (Excel, Python, Figma, langues…)",
          "Résultats : classement, prix, KPIs d'un projet, volume géré",
        ],
      },
      {
        type: "h2",
        text: "Stage & alternance : cibler l'entreprise",
      },
      {
        type: "p",
        text: "Même logique que pour un emploi : adaptez le CV à l'offre. Mettez en avant les cours et projets proches des missions. Ajoutez une lettre courte qui explique votre motivation pour ce métier / cette boîte.",
      },
      {
        type: "h2",
        text: "Campus France & dossiers formation",
      },
      {
        type: "p",
        text: "Les dossiers études valorisent la cohérence du projet pédagogique. Votre CV et votre lettre doivent raconter la même histoire : pourquoi cette formation, pourquoi maintenant, quelles preuves de capacité de travail.",
      },
      {
        type: "callout",
        title: "Veyala Étudiants",
        text: "Collez une fiche de formation ou une offre de stage : Veyala génère un CV et une lettre adaptés au contexte études ou emploi.",
      },
      {
        type: "cta",
        text: "Préparez un dossier clair pour stage, alternance ou formation.",
        href: "/register",
        label: "Créer mon CV étudiant",
      },
    ],
  },
  {
    slug: "mots-cles-cv-par-metier",
    title: "Mots-clés CV par métier : exemples pour matcher les offres",
    description:
      "Exemples de mots-clés CV par métier (marketing, tech, finance, RH, commercial) pour améliorer votre matching ATS et parler le langage des recruteurs.",
    excerpt:
      "Les bons mots-clés sont ceux de votre fiche de poste. Voici des exemples par famille de métiers pour démarrer votre adaptation.",
    category: "ats",
    tags: ["mots-clés", "ATS", "métiers", "CV"],
    keywords: [
      "mots-clés CV",
      "mots clés métier",
      "CV marketing",
      "CV développeur",
      "CV commercial",
      "CV finance",
      "compétences CV",
      "matching offre emploi",
      "lexique recrutement",
    ],
    publishedAt: "2026-07-20",
    updatedAt: "2026-07-29",
    readingTimeMin: 6,
    author: AUTHOR,
    accent: "#2563EB",
    body: [
      {
        type: "p",
        text: "Cette liste n'est pas à copier telle quelle : elle illustre le niveau de précision attendu. Toujours partir de l'offre réelle.",
      },
      {
        type: "h2",
        text: "Tech / développement",
      },
      {
        type: "p",
        text: "Exemples : TypeScript, React, Node.js, API REST, tests unitaires, CI/CD, Docker, Agile/Scrum, revue de code, performance, accessibilité.",
      },
      {
        type: "h2",
        text: "Marketing / growth",
      },
      {
        type: "p",
        text: "Exemples : SEO, SEA, CRM, automation, taux de conversion, funnel, content marketing, A/B testing, analytics, lead generation.",
      },
      {
        type: "h2",
        text: "Commercial / sales",
      },
      {
        type: "p",
        text: "Exemples : prospection, closing, CRM (Salesforce, HubSpot), pipeline, quota, account management, négociation, cycle de vente B2B.",
      },
      {
        type: "h2",
        text: "Finance / contrôle de gestion",
      },
      {
        type: "p",
        text: "Exemples : reporting, budget, forecast, IFRS, Excel avancé, Power BI, analyse d'écarts, clôture comptable, trésorerie.",
      },
      {
        type: "h2",
        text: "RH / recrutement",
      },
      {
        type: "p",
        text: "Exemples : sourcing, ATS, entretien structuré, marque employeur, onboarding, GPEC, droit social, relations sociales.",
      },
      {
        type: "callout",
        title: "Règle d'or",
        text: "Si un terme est dans l'offre et vrai pour vous, il doit apparaître dans votre CV — idéalement près d'une preuve d'usage.",
      },
      {
        type: "cta",
        text: "Extrainez automatiquement les mots-clés de n'importe quelle offre.",
        href: "/register",
        label: "Matcher mon CV à une offre",
      },
    ],
  },
  {
    slug: "job-hunting-strategie-candidatures",
    title: "Stratégie job hunting : candidater mieux (pas seulement plus)",
    description:
      "Stratégie de recherche d'emploi efficace : ciblage des offres, CV ATS par candidature, suivi, networking LinkedIn et préparation aux entretiens.",
    excerpt:
      "Postuler en masse fatigue. Une stratégie job hunting mise sur la qualité du matching CV–offre et un suivi rigoureux.",
    category: "emploi",
    tags: ["emploi", "job hunting", "recrutement", "LinkedIn"],
    keywords: [
      "job hunting",
      "recherche emploi",
      "stratégie candidature",
      "trouver un job",
      "candidature efficace",
      "LinkedIn emploi",
      "entretien embauche",
      "marché de l'emploi",
      "CV et lettre",
    ],
    publishedAt: "2026-07-24",
    updatedAt: "2026-07-30",
    readingTimeMin: 7,
    author: AUTHOR,
    accent: "#1E40AF",
    body: [
      {
        type: "p",
        text: "Le volume de candidatures compte — mais le taux de réponse dépend surtout de la pertinence. Voici un cadre simple pour chercher un emploi sans s'épuiser.",
      },
      {
        type: "h2",
        text: "1. Définir 2–3 cibles nettes",
      },
      {
        type: "p",
        text: "Métier, niveau, type d'entreprise, remote/hybride. Trop large = CV dilué et message confus.",
      },
      {
        type: "h2",
        text: "2. Qualifier chaque offre avant de postuler",
      },
      {
        type: "ul",
        items: [
          "Match ≥ 60–70 % des must-have",
          "Salaire / localisation acceptables",
          "Annonce claire (pas de red flags extrêmes)",
        ],
      },
      {
        type: "h2",
        text: "3. Un dossier par candidature",
      },
      {
        type: "p",
        text: "CV adapté + lettre courte + profil LinkedIn cohérent. Stockez version et date dans un tableau de suivi.",
      },
      {
        type: "h2",
        text: "4. Activer le réseau (sans spam)",
      },
      {
        type: "p",
        text: "Message LinkedIn personnalisé, demande d'avis sur le rôle, pas de « je cherche un job » générique.",
      },
      {
        type: "h2",
        text: "5. Mesurer et itérer",
      },
      {
        type: "p",
        text: "Si 20 candidatures ciblées = 0 réponse, le problème est le matching ou le positionnement — pas seulement « le marché ».",
      },
      {
        type: "cta",
        text: "Accélérez chaque candidature avec un CV + lettre générés à partir de l'offre.",
        href: "/register",
        label: "Candidater plus vite avec Veyala",
      },
    ],
  },
];
