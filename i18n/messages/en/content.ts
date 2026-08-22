/** Copy for blog, legal and contact pages. */
export const content = {
  blog: {
    metaTitle: "Resume, ATS and job search blog: guides to apply smarter",
    metaDescription:
      "Veyala guides on ATS-friendly resumes, recruiting keywords, cover letters, job hunting and student applications. Practical advice to clear the filters and land interviews.",
    keywords: [
      "resume blog",
      "ATS",
      "resume keywords",
      "cover letter",
      "job posting",
      "job hunting",
      "student resume",
      "Campus France",
      "AI resume builder",
      "job application",
      "recruiting",
      "Veyala",
    ],
    eyebrow: "Veyala blog",
    heading: "Resumes, ATS, hiring: apply with a method",
    intro:
      "Actionable guides to tailor your resume to every job posting, clear ATS filters, write a convincing cover letter and speed up your job search.",
    rss: "RSS feed",
    featured: "Featured",
    empty: "No articles published yet.",
    allPosts: "All articles",
    guidesCount: (n: number) => `${n} guides`,
    practiceTitle: "Put it into practice",
    practiceText:
      "Paste a job posting and Veyala writes an ATS-ready resume and a matching cover letter in under 30 seconds.",
    notFoundTitle: "Article not found",
    breadcrumb: "Breadcrumb",
    home: "Home",
    publishedOn: (date: string) => `Published ${date}`,
    updatedOn: (date: string) => `Updated ${date}`,
    minutesShort: (n: number) => `${n} min`,
    faqTitle: "FAQ",
    backToBlog: "Back to the blog",
    shareOn: (network: string) => `Share on ${network}`,
    copyLink: "Copy link",
    copyLinkShort: "Link",
    feedTitle: "Veyala blog: resumes, ATS and hiring",
    feedDescription:
      "Practical guides to make your resume ATS-friendly, tailor your applications and write cover letters that work.",
    feedLanguage: "en-us",
  },

  cgu: {
    purposeTitle: "1. Purpose",
    purposeBody:
      "These terms govern the use of Veyala, an AI-assisted resume generation service. Creating an account means you accept them.",
    accountTitle: "2. Account and credits",
    accountItems: [
      "Your account is personal and you are responsible for keeping it confidential.",
      "1 credit covers 1 resume generation (Word and PDF files included).",
      "You get 2 free credits when you sign up, and purchased credits never expire.",
      "A failed generation is automatically refunded in credits.",
      "Credits cannot be refunded in euros or transferred.",
    ],
    generatedTitle: "3. Generated content",
    generatedBody:
      "The AI only rewrites the information you provide: you remain solely responsible for the accuracy of your base resume and of the generated resumes you send to third parties.",
    acceptableUseTitle: "4. Acceptable use",
    acceptableUseBody:
      "The following are prohibited: impersonation, submitting unlawful content, reselling the service, and any attempt to bypass the credit or security mechanisms.",
    paymentsTitle: "5. Payments",
    paymentsBody:
      "Payments are processed by Stripe. Listed prices are in euros, tax included. Your account is credited once Stripe confirms the payment.",
    terminationTitle: "6. Termination",
    terminationBody:
      "You can delete your account and your data at any time from the Privacy page or by contacting us. Veyala may suspend an account that breaches these terms.",
  },

  privacy: {
    collectedTitle: "Data we collect",
    collectedItems: [
      "Account: email, name, profile picture (if you sign in with Google).",
      "Resume: the file you upload and its structured version, which you can edit.",
      "Generations: the job postings you submit and the resumes produced.",
      "Payments: processed by Stripe. We never store card details.",
    ],
    purposesTitle: "Purposes and legal bases",
    purposesBody:
      "Your data is used solely to deliver the service (performance of the contract): tailoring your resume to job postings, generating exports and managing your credits. We never sell data and we run no advertising.",
    processorsTitle: "Processors",
    processorsBody:
      "The text of your resume and of the job postings is sent to the configured AI provider for generation only. Payments go through Stripe, and sign-in emails through our SMTP provider.",
    retentionTitle: "Retention periods",
    retentionBody:
      "Your data is kept for as long as your account is active, then deleted within 30 days of the account being removed.",
    rightsTitle: "Your rights (GDPR)",
    rightsBody:
      "You have the right to access, rectify, port, object to and erase your data. Deleting your account and all associated data is available on request at contact@cvgen.example and from your workspace. You may also file a complaint with the CNIL, the French data protection authority.",
  },

  legalNotice: {
    publisherTitle: "Site publisher",
    publisherBody:
      "Veyala is published by [company name to be completed], [legal form], registered under number [SIREN], with its registered office at [address]. Publication director: [name]. Contact: contact@cvgen.example.",
    hostingTitle: "Hosting",
    hostingBody:
      "The site is hosted by [host, e.g. Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA]. The database is hosted by [Neon / Supabase].",
    ipTitle: "Intellectual property",
    ipBody:
      "Every element of the site (design, text, logos, code) is protected by intellectual property law. Generated resumes belong to their users.",
  },

  contact: {
    body: "A question, a generation issue or a request about your data? Write to us and we reply within 48 business hours.",
  },

  demo: {
    sectionAria: "Veyala product demo",
    close: "Close the demo",
    start: (duration: string) => `Play the demo · ${duration}`,
    replay: "Play again",
    pause: "Pause",
    play: "Play",
    restart: "Start over",
    searchQuery: "optimize resume for ATS and a job posting",
    resultsCount: "About 2,840,000 results (0.38 seconds)",
    pipeline: [
      "Reading the job posting",
      "Analyzing requirements",
      "Initial match",
      "ATS resume tailoring",
      "Cover letter",
      "PDF / Word exports",
      "Optimized match",
    ],
    gaps: [
      { term: "Design System", kind: "Must-have" },
      { term: "Figma", kind: "Tool / stack" },
      { term: "User research", kind: "Must-have" },
      { term: "Agile", kind: "Nice to have" },
    ],
    scenes: [
      {
        label: "The need",
        caption: "Lea wants a resume truly tailored to one posting, not a generic template.",
      },
      {
        label: "Google search",
        caption: "She looks up how to optimize a resume for ATS filters.",
      },
      {
        label: "Discovery",
        caption: "Among the resume and ATS tools, she spots Veyala: tailored to every job posting.",
      },
      {
        label: "Landing page",
        caption: "On veyala.fr, she clicks “Create my resume for free”.",
      },
      {
        label: "Account",
        caption: "Sign-up: 2 free credits, no credit card required.",
      },
      {
        label: "Base resume",
        caption: "Key step: upload your base resume (PDF/DOCX). The AI rewrites, it never invents.",
      },
      {
        label: "The posting",
        caption: "In Create a resume: she pastes the posting, picks a template, then analyzes.",
      },
      {
        label: "Match",
        caption: "Free analysis: current vs projected score. She checks what she can back up.",
      },
      {
        label: "Generation",
        caption: "1 credit: ATS resume tailoring, cover letter, Word/PDF exports, match after.",
      },
      {
        label: "Result",
        caption: "Match 58% → 91%. Resume and cover letter ready to download or edit.",
      },
      {
        label: "Your turn",
        caption: "Same product flow: upload → analyze → generate → export.",
      },
    ],
    serp: [
      {
        title: "Veyala: a resume tailored to every job posting, ATS-friendly",
        snippet:
          "Upload your resume, paste a posting: free match analysis, then an ATS-optimized resume and cover letter. Word & PDF export.",
      },
      {
        title: "Kickresume: AI resume and cover letter builder",
        snippet:
          "More than 40 templates, AI writing and an ATS checker. Great for students and creative profiles.",
      },
      {
        title: "Rezi: ATS resume optimizer with a real-time score",
        snippet:
          "Scan your resume for ATS, pull the keywords out of a posting and improve your Rezi score.",
      },
      {
        title: "Teal: resume builder and job application tracker",
        snippet:
          "Build your resume, track your applications and run your whole job search from one dashboard.",
      },
      {
        title: "Resume.io: professional online resume templates",
        snippet: "Build a resume in minutes with ready-made templates and a one-click PDF export.",
      },
      {
        title: "CVpass: ATS scanner and career suite (France)",
        snippet:
          "ATS score calibrated for the French market, cover letter, LinkedIn and application tracking.",
      },
    ],
    hook: {
      eyebrow: "A real Veyala walkthrough",
      titleBefore: "The perfect resume for ",
      titleHighlight: "this",
      titleAfter: " job posting",
      text: "Not a generic template: a file aligned with the ATS keywords in the posting.",
    },
    landing: {
      subtitle: "Paste a job posting and Veyala writes a perfectly tailored resume and letter.",
    },
    register: {
      subtitle: "2 free credits when you sign up, no credit card required.",
    },
    profile: {
      subtitle: "Source of truth: the AI rewrites, it does not invent.",
      importTitle: "Automatic import",
      importHint: "PDF or DOCX · 8 MB max",
      importDone: "Resume analyzed, profile filled in",
      importLoading: "Analyzing your resume…",
      importCta: "Upload my resume (PDF or DOCX)",
      identity: "Identity & contact",
      role: "Product Designer",
      skills: ["Figma", "UX Research", "Prototyping"],
      save: "Save my base resume",
    },
    compose: {
      title: "Create a tailored resume",
      steps: "1. Run the free match analysis. 2. Check the missing skills. 3. Generate (1 credit).",
      jobTitle: "1. The job posting",
      pasted: "Pasted text (recommended)",
      offer: `Product Designer, SaaS startup · Paris / Hybrid
Scope: design system, user research, Figma prototyping.
Must-have: Figma, Design System, UX Research. Nice: Agile, Framer.`,
      templateTitle: "2. Template",
      templates: ["Classic", "Minimal", "Modern"],
      analyzeCta: "Analyze the match (free)",
    },
    review: {
      title: "Match analysis",
      subtitle: "No credit charged. Check the skills you can back up.",
      currentScore: "Current score",
      projectedScore: "Projected score",
      maxScore: "Max if all checked",
      gapsTitle: "Missing skills",
      checkAll: "Check all",
      generateCta: "Create my resume (1 credit)",
    },
    generating: {
      title: "Generating",
      subtitle: "Steps stay in sync even if the connection drops for a moment.",
      matchBefore: "Match before",
      matchAfter: "Match after",
    },
    result: {
      backToDashboard: "← Back to dashboard",
      jobTitle: "Product Designer",
      templateMeta: "“Classic” template · pasted text",
      source: "Source: pasted text",
      matchDelta: "Match 58% → 91% (+33)",
      editCta: "Edit in the editor",
      cvTitle: "Optimized resume",
      letterTitle: "Cover letter",
      word: "Word (.docx)",
      pdf: "PDF",
      letterExcerpt:
        "Dear Hiring Manager, with hands-on experience in design systems and user research…",
      cvSkills: ["Figma", "Design System", "UX Research"],
    },
    outro: {
      eyebrow: "The Veyala workflow",
      title: "The real flow, in 4 steps",
      steps: [
        "Upload my base resume",
        "Analyze the match (free)",
        "Create my resume (1 credit)",
        "Export to Word & PDF",
      ],
    },
  },
} as const;
