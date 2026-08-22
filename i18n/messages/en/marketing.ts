export const marketing = {
  badge: "Your application, amplified by AI",
  heroTitleBefore: "A resume ",
  heroTitleHighlight: "tailored to every job",
  heroTitleAfter: "in 30 seconds.",
  heroSubtitle:
    "Paste a job posting or a program brief. Veyala writes an ATS-friendly resume and cover letter, ready to export as Word or PDF.",
  heroCta: "Create my resume for free",
  atsScore: "ATS score",
  jobChip: "Jobs",
  optimizedChip: "Optimized",
  aiInProgress: "AI at work",
  generating: "Generating…",
  atsCompatible: "ATS-friendly · Score 94/100",
  jsonLdDescription:
    "Generate an ATS-friendly resume and cover letter for every job posting. Export to Word and PDF.",
  stats: [
    { label: "resumes & letters generated", sub: "and growing every day" },
    { label: "institutions covered", sub: "Campus France, Parcoursup, universities" },
    { label: "average response rate", sub: "reported by active users" },
  ],
  howEyebrow: "Under 60 seconds",
  howTitle: "How it works",
  howSubtitle: "Three steps. A resume built for that specific application.",
  steps: [
    {
      title: "Import your profile",
      text: "Paste an existing resume or fill in your profile. Veyala reads your skills, education, and work experience in seconds.",
    },
    {
      title: "Paste the job or program",
      text: "Drop in a job posting, a Campus France brief, or a Parcoursup choice. AI extracts the criteria in real time.",
    },
    {
      title: "Download your resume + letter",
      text: "In under 30 seconds: an ATS-optimized resume and a matching cover letter, as premium Word or PDF.",
    },
  ],
  universesTitleBefore: "Two tracks, ",
  universesTitleHighlight: "one product",
  universesSubtitle: "Jobs or studies: Veyala matches the conventions of each process.",
  universeTablist: "Choose a track",
  universeJobTab: "For jobs",
  universeStudyTab: "For studies",
  universeJob: {
    badge: "Jobs",
    title: "Job applications",
    text: "Paste the posting. Veyala maps the keywords, reshapes your experience, and writes a resume and cover letter in the recruiter's language.",
    bullets: [
      "Automatic keyword extraction from the job posting",
      "ATS-oriented rewrite of your work experience",
      "A targeted, professional cover letter",
      "20+ recruiter-ready premium templates",
      "Native Word and high-quality PDF export",
    ],
    chips: ["ATS ✓", "Word", "PDF", "LinkedIn"],
    cta: "Create a job resume",
  },
  universeStudy: {
    badge: "Studies",
    title: "Academic applications & mobility",
    text: "Paste the program brief. Veyala builds an academic file that fits Campus France, Parcoursup, or Canadian university conventions.",
    bullets: [
      "Campus France file structured to official expectations",
      "Academic CV that highlights coursework and projects",
      "Motivation letter tailored to each Parcoursup choice",
      "Canada/Quebec formats followed closely",
      "Native Word and high-quality PDF export",
    ],
    chips: ["Campus France", "Parcoursup", "Canada/Quebec", "PDF"],
    cta: "Prepare a study application",
  },
  featuresEyebrow: "Features",
  featuresTitleBefore: "Everything you need, ",
  featuresTitleHighlight: "nothing extra",
  featuresSubtitle: "Built to work the first time you use it. No learning curve.",
  features: [
    {
      title: "Smart ATS tailoring",
      text: "AI rewrites your experience with the posting's exact keywords so you clear automated filters.",
    },
    {
      title: "Premium templates",
      text: "20+ designer templates: modern, classic, or academic.",
    },
    {
      title: "Word & PDF export",
      text: "Native, high-resolution files you can submit on any application portal.",
    },
    {
      title: "Multi-model AI",
      text: "Several models work together so every generation gets the strongest draft.",
    },
    {
      title: "Nothing invented",
      text: "Veyala highlights experience you actually have. No fake jobs, degrees, or skills.",
    },
    {
      title: "A matching cover letter",
      text: "Written from your resume and the posting: professional, specific, and convincing.",
    },
  ],
  templatesEyebrow: "Templates",
  templatesTitleBefore: "Premium ",
  templatesTitleHighlight: "designs",
  templatesSubtitle: "Every template is built to land with recruiters and admissions committees.",
  carouselPrev: "Previous templates",
  carouselNext: "Next templates",
  templateNameAcademic: "Academic",
  templateTagPopular: "Popular",
  templateTagNew: "New",
  heroAtsScore: "ATS score",
  heroTagJob: "Job",
  heroTagOptimized: "Optimized",
  heroAiWorking: "AI at work",
  heroGenerating: "Generating...",
  pricingEyebrow: "Pricing",
  pricingTitleBefore: "Pay for ",
  pricingTitleHighlight: "what you use",
  pricingSubtitle: "Credit packs, no subscription. Buy when you need them.",
  popular: "Most popular",
  forCredits: (n: number) => `for ${n} resumes`,
  perCv: (price: string) => `${price} / resume`,
  pricingFoot: "Credits never expire · Secure checkout with Stripe · No subscription",
  plans: [
    {
      name: "Starter",
      cta: "Get started",
      features: (credits: number) => [
        `${credits} resume generations`,
        `${credits} cover letters`,
        "Word & PDF export",
        "Standard templates",
        "Email support",
      ],
    },
    {
      name: "Pro",
      cta: "Choose Pro",
      features: (credits: number) => [
        `${credits} resume generations`,
        `${credits} cover letters`,
        "Word & PDF export",
        "Every premium template",
        "Priority generation",
        "Multi-model AI",
      ],
    },
    {
      name: "Expert",
      cta: "Choose Expert",
      features: (credits: number) => [
        `${credits} resume generations`,
        `${credits} cover letters`,
        "Word & PDF export",
        "Every premium template",
        "Priority generation",
        "Premium AI access",
        "Exclusive templates",
      ],
    },
  ],
  testimonialsTitleBefore: "They landed ",
  testimonialsTitleHighlight: "the interview",
  testimonialsSubtitle: "Students and early-career professionals who trust Veyala.",
  starsAria: "5 out of 5 stars",
  testimonials: [
    {
      quote:
        "I generated my Campus France CV in two minutes. The AI matched my background to the university's criteria. The letter was spot on.",
      initials: "LM",
      name: "Léa Martin",
      role: "Master's in Marketing, Sciences Po Paris",
    },
    {
      quote:
        "I applied to three roles and booked two interviews the same week. A 94% ATS score on my last application says it all.",
      initials: "TD",
      name: "Thomas Dubois",
      role: "Junior engineer, Paris",
    },
    {
      quote:
        "My file for Université de Montréal followed local conventions exactly. Veyala adapted the format so I didn't have to rewrite a thing.",
      initials: "AB",
      name: "Aïcha Benali",
      role: "Campus France student, Canada",
    },
    {
      quote:
        "After 10 years in accounting I'm moving into engineering. Veyala surfaced transferable skills I would never have written that way.",
      initials: "HM",
      name: "Hugo Moreau",
      role: "Career changer, Lyon",
    },
  ],
  faqTitle: "Frequently asked questions",
  faqSubtitle: "What to know before you start.",
  faq: [
    {
      question: "Is generation actually instant?",
      answer:
        "Yes. A full run (tailored resume and cover letter) usually takes under 30 seconds. Job analysis starts as soon as you paste the posting.",
    },
    {
      question: "Is my personal data protected?",
      answer:
        "Yes. Your data is encrypted. We never sell it or use it to train AI models. You can edit or delete your profile and documents at any time.",
    },
    {
      question: "Which formats can I export?",
      answer:
        "Every generation produces a native Word (.docx) file and a matching high-resolution PDF, with selectable text and clickable links, ready for any application portal.",
    },
    {
      question: "Which AI does Veyala use?",
      answer:
        "Veyala orchestrates several leading models and picks the best one for each step: job analysis, ATS rewrite, cover letter. You always get the strongest available draft.",
    },
    {
      question: "Will my resume really be unique to each job?",
      answer:
        "Yes. Each run starts from your profile and that specific posting: keywords, section order, and wording are tailored to the application. Nothing is invented.",
    },
    {
      question: "How do credits work?",
      answer:
        "1 credit = 1 complete generation (resume + cover letter, Word + PDF). You buy packs with no subscription, from €1.99 for 5 resumes, and credits never expire. A failed generation is refunded automatically.",
    },
  ],
  ctaEyebrow: "Start today, for free",
  ctaTitleBefore: "Your next application",
  ctaTitleHighlight: "deserves a stronger resume.",
  ctaSubtitle:
    "Join 48,000+ candidates who already trust Veyala with their applications. First resume free, no credit card.",
  ctaTemplates: "Browse templates",
  ctaFoot: "No subscription · First resume free · Your data stays yours",
  footerTagline: "Your application, amplified by AI. Resumes and cover letters in 30 seconds.",
  footerProduct: "Product",
  footerResources: "Resources",
  footerLegal: "Legal",
  footerGuideCv: "Resume guide",
  footerGuideLetter: "Cover letter guide",
  footerApi: "API",
  footerCookies: "Cookies",
  footerRights: "All rights reserved.",
  footerCgu: "Terms",
  footerPrivacy: "Privacy",
  footerMentions: "Legal notice",
  demoCta: "Watch demo",
  watchDemo: "Watch the demo",
} as const;
