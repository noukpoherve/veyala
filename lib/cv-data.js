// Données de base du CV — source de vérité que Claude adapte à chaque offre.
// Toutes les infos sont réelles : l'IA réorganise et reformule, elle n'invente rien.

export const BASE_INFO = {
  nom: "Noukpo Hervé",
  nomFamille: "HOUNDJETODÉ",
  telephone: "06 36 38 60 23",
  email: "noukpoherve@hotmail.com",
  adresse: "1 pl. Nelson Mandela, 77700 Chessy",
  linkedinDisplay: "in/noukpohervehoundjetode",
  linkedinUrl: "https://www.linkedin.com/in/noukpohervehoundjetode",
  githubDisplay: "github.com/noukpoherve",
  githubUrl: "https://github.com/noukpoherve",
  portfolioDisplay: "noukpoherve.github.io/portfolio",
  portfolioUrl: "https://noukpoherve.github.io/portfolio",
  permis: "B",
  prime: "Éligible à la prime alternance de 6 000 €",
  rythme: "Rythme : 3 semaines en entreprise / 1 semaine en formation",
};

export const COMPETENCES = [
  { cat: "Langages & Frameworks Web", items: ["Python","Flask","Django","FastAPI","Ruby on Rails","Next.js","React.js","TypeScript","JavaScript","StimulusJs","Hotwire"] },
  { cat: "Intelligence Artificielle & LLM", items: ["OpenAI API","Claude AI API","LangGraph","Multi-agents","spaCy","GitHub Copilot","Cursor"] },
  { cat: "Bases de données & Requêtes", items: ["PostgreSQL","Supabase","MongoDB","Qdrant","SQL (JOIN, CTE)","Indexation","Optimisation N+1"] },
  { cat: "Templates & Interfaces", items: ["HTML / CSS","Bootstrap","Tailwind CSS","Figma","WordPress"] },
  { cat: "DevOps & Versioning", items: ["Git","GitHub","GitLab","Bitbucket","Docker","Heroku","AWS","Render","Vercel"] },
  { cat: "Recherche & Outils métier", items: ["Elasticsearch","Algolia","Microsoft 365","Azure Face API","Jira","Slack","Discord"] },
  { cat: "Soft Skills", items: ["Travail en équipe","Autonomie","Adaptabilité","Rigueur","Communication"] },
];

export const EXPERIENCES = {
  tama: {
    title: "Développeur Full Stack — Tama",
    dates: "07/2024 – 08/2025",
    place: "Télétravail, France",
    bullets: [
      "Développement et maintenance d'une plateforme e-commerce SaaS avec Next.js, React et TypeScript, incluant rendu serveur (SSR/SSG) pour l'optimisation des performances et du SEO.",
      "Développement de fonctionnalités métier avec architecture modulaire, composants réutilisables et gestion avancée des états applicatifs.",
      "Conception du modèle de données et optimisation des requêtes avec Supabase / PostgreSQL : indexation, relations et optimisation des accès.",
      "Conception d'API backend via API Routes et services serverless : implémentation de logique métier, validation des données et sécurisation des endpoints.",
      "Analyse et correction des anomalies, refactorisation orientée maintenabilité et amélioration de la couverture fonctionnelle et technique.",
    ],
    stack: "Next.js, ReactJs, TypeScript, REST API, Tailwind CSS, Supabase, PostgreSQL, Git/GitHub, Vercel, Figma.",
  },
  bridgeness: {
    title: "Lead Développeur / DevOps — Bridgeness (LegalTech)",
    dates: "07/2024 – 08/2025",
    place: "Paris, France",
    bullets: [
      "Pilotage complet du volet technique de la startup (sans CTO opérationnel) : architecture, développement, CI/CD et encadrement de l'équipe de développement.",
      "Conception et développement d'une plateforme SaaS accompagnant les entrepreneurs étrangers dans la création d'entreprise en France : automatisation des démarches, génération de documents validés, tableau de bord de suivi.",
      "Développement full stack avec Next.js, React et TypeScript : architecture modulaire, composants réutilisables et gestion avancée des états applicatifs.",
      "Conception du modèle de données et optimisation des requêtes PostgreSQL : indexation, relations et optimisation des accès.",
      "Mise en place des pipelines CI/CD avec GitHub Actions, déploiement continu via Vercel et supervision des serveurs.",
      "Conception d'APIs backend sécurisées : logique métier, validation des données et sécurisation des endpoints.",
    ],
    stack: "Next.js, ReactJs, TypeScript, REST API, Tailwind CSS, PostgreSQL, GitHub Actions, CI/CD, Docker, Git/GitHub, Vercel, Figma.",
  },
  procurement: {
    title: "Développeur Full Stack — Procurement Freelancers",
    dates: "09/2022 – 07/2024",
    place: "Télétravail, Bruxelles",
    bullets: [
      "Création d'APIs REST performantes et scalables avec Ruby on Rails pour la gestion des profils freelances et des projets clients.",
      "Mise en place de systèmes de recherche avancée avec Elasticsearch et Algolia : indexation, recherche full-text et filtrage multicritères.",
      "Intégration de fonctionnalités IA via OpenAI : scoring de profils, analyse automatique de projets et matching intelligent.",
      "Optimisation avancée de la base de données PostgreSQL : requêtes complexes, CTE, indexation et réduction des N+1.",
      "Refactorisation de modules critiques pour le renforcement de la stabilité et la réduction de la dette technique.",
      "Administration et optimisation du site WordPress du projet.",
    ],
    stack: "RubyOnRails, OpenAI Integration, ElasticSearch, Algolia, Figma, JavaScript, Docker, PostgreSQL, Bootstrap, StimulusJs, Bitbucket, WordPress.",
  },
  confidentialai: {
    title: "Projet Personnel — Extension Google Chrome (SaaS ConfidentialAI)",
    dates: "02/2026 – En cours",
    place: "ConfidentialAI, France (Remote)",
    bullets: [
      "Conception et développement d'une plateforme SaaS de protection des données confidentielles dans les LLMs (ChatGPT, Claude, Gemini) et de modération de contenu sur les réseaux sociaux.",
      "Architecture multi-agents avec LangGraph : orchestration de 5 agents spécialisés (AFE, AVS, LLM Classifier, Toxicity Analyzer, AC) avec transitions conditionnelles et état partagé.",
      "Développement d'une API backend avec FastAPI (Python) : gestion des routes, validation des données et sécurisation des endpoints.",
      "Conception et optimisation du modèle de données NoSQL avec MongoDB et vectorisation avec Qdrant pour la recherche sémantique.",
      "Développement d'une extension Chrome Manifest V3 avec interception temps réel des requêtes vers les LLMs.",
      "Déploiement et containerisation via Docker et Vercel.",
    ],
    stack: "Python (FastAPI), LangGraph, MongoDB, Next.js, TypeScript, spaCy, NudeNet, Qdrant, Docker, Vercel, Chrome Extension (Manifest V3).",
  },
};

export const FORMATIONS = [
  {
    title: "Master (Bac+4) – Expert Architecture des Logiciels — IMIE Paris",
    dates: "11/2025 – En cours",
    place: "École Supérieure d'Informatique, Paris",
    bullet: "Formation en alternance axée sur l'architecture logicielle avancée, les design patterns, les microservices et la conception de systèmes distribués.",
  },
  {
    title: "Licence – Architecture Logiciel — ESGIS",
    dates: "09/2019 – 08/2022",
    place: "Cotonou, Bénin",
    bullet: "Formation en génie logiciel couvrant les bases du développement web, les algorithmes, les bases de données et l'architecture applicative.",
  },
];

export const PROFIL_DEFAUT =
  "Étudiant en Master Expert Architecture des Logiciels (Bac+4) à l'IMIE Paris, immédiatement disponible. Expérience concrète en développement full stack avec Python (Django, FastAPI), Ruby on Rails et Next.js sur des projets en production. Maîtrise de PostgreSQL, des API REST et des outils de versioning Git. Curiosité technique marquée, capacité à s'approprier rapidement un code existant et à travailler en équipe pluridisciplinaire.";

export const HEADLINE_DEFAUT = "Développeur Web — Python / Flask / PostgreSQL";
