/** Copy for the authenticated app pages (dashboard, generate, billing, …). */
export const pages = {
  /** Shown instead of a metric that cannot be computed yet. */
  noValue: "·",

  dashboard: {
    description: "Your activity and every resume you have generated.",
    historyTitle: "Resume history",
    historyEmpty: "No resumes yet.",
    historyCount: (total: number) => `${total} resume${total === 1 ? "" : "s"} in total.`,
    importCta: "Import my resume",
  },

  scores: {
    coherence: "Consistency",
    matching: "Match",
  },

  activity: {
    title: "Activity summary",
    subtitle: "Last 30 days, plus your weekly trend.",
    topUp: "Buy more credits",
    cvsLabel: "Resumes (30 days)",
    cvsHint: (total: number) => `${total} in total`,
    gainLabel: "Average match gain",
    gainValue: (points: number) => `${points >= 0 ? "+" : ""}${points} pts`,
    gainHint: "before → after",
    bestLabel: "Best score",
    bestHint: "match after tailoring",
    creditsLabel: "Credits left",
    creditsHint: (used: number) => `${used} used (30 days)`,
    chartTitle: "Resumes generated per week",
    chartAria: (series: string) => `Activity over the last 8 weeks: ${series}`,
  },

  baseCvAlert: {
    title: "No base resume yet",
    cta: "Import my base resume",
    generateBody: "It is the source of truth for every generation. The AI never invents anything.",
    campusBody:
      "It is the source of truth for your application file. The AI never invents anything.",
  },

  profile: {
    importTitle: "Automatic import",
    importBody:
      "Import your existing resume (PDF or DOCX, 8 MB max). We read it and turn it into the structured, editable data below.",
    structuredAria: "Structured resume data",
    noCv: "No resume imported yet. Upload a file above, or fill in the form once you have imported one.",
    dangerTitle: "Danger zone",
    dangerBody:
      "Deactivates your account (it is archived, not erased). Your data is kept. To get access back, contact an administrator. Permanent deletion (GDPR) is handled by the support team.",
  },

  cvUpload: {
    analyzing: "Reading your resume…",
    reimport: "Import another resume (replaces your data)",
    import: "Import my resume (PDF or DOCX)",
    errorTitle: "Import failed",
  },

  profileForm: {
    invalid: "Some fields are invalid. Full name is required.",
    errorTitle: "Could not save",
    submit: "Save my base resume",
  },

  archiveAccount: {
    trigger: "Deactivate my account",
    dialogTitle: "Deactivate your account?",
    dialogBody:
      "Your account will be archived and you will no longer be able to sign in. Your data is kept. To restore access, contact an administrator.",
    confirmLabel: (word: string) => `Type ${word} to confirm`,
    pending: "Deactivating…",
    submit: "Confirm deactivation",
  },

  templates: {
    galleryTitle: "Public gallery",
    ownTitle: "My templates",
    proposeTitle: "Submit a template",
    proposeBody:
      "Duplicates are detected automatically. New templates go through review before they become public, but you can use yours right away.",
    status: {
      PENDING: "In review",
      APPROVED: "Approved",
      REJECTED: "Rejected",
    },
    layoutSidebar: "Side column",
    layoutSingle: "Single column",
    originCommunity: "community",
    originOfficial: "official",
  },

  templateImport: {
    nameLabel: "Template name",
    namePlaceholder: "Coral Elegance",
    imageLabel: "Reference image (PNG, JPEG or WebP, 5 MB max)",
    chooseImage: "Choose an image",
    imageHint:
      "A screenshot or photo of the resume design to reproduce. The AI extracts its colors, layout and sections.",
    submitted: "Template submitted.",
    errorTitle: "Could not submit",
    duplicateTitle: "Template already known",
    successTitle: "Template submitted",
    analyzing: "Analyzing…",
    submit: "Submit template",
  },

  billing: {
    cancelledTitle: "Payment canceled",
    cancelledBody: "You were not charged. You can try again whenever you like.",
    pendingTitle: "A recent payment is still being processed",
    pendingBodyBefore:
      "One purchase is still marked “Pending” (usually a payment page that was opened, then closed before checkout finished). Syncing brings the status up to date;",
    pendingBodyStrong: "it never re-credits",
    pendingBodyAfter: "a purchase already marked “Paid”.",
    packsTitle: "Add credits",
    paymentsTitle: "Payment history",
    paymentsEmpty: "No payments yet.",
    ledgerTitle: "Credit activity",
    ledgerEmpty: "No credit activity yet.",
    colAmount: "Amount",
    colPromo: "Promo",
    colReason: "Reason",
    reasons: {
      PURCHASE: "Pack purchase",
      GENERATION: "Resume generation",
      ADMIN_ADJUST: "Admin adjustment",
      SIGNUP_BONUS: "Sign-up bonus",
      REFUND: "Refund (failed generation)",
    },
    paymentStatus: {
      PAID: "Paid",
      PENDING: "Pending",
      FAILED: "Failed",
    },
  },

  checkout: {
    promoLabel: "Promo code",
    promoPlaceholder: "e.g. WELCOME20",
    apply: "Apply",
    invalidCode: "That promo code is not valid.",
    checkFailed: "We could not check that code right now.",
    promoAppliedPrefix: "Code",
    promoAppliedSuffix: (label: string) =>
      `(${label}): the price and credits are adjusted at checkout, based on the pack you pick.`,
    tip: "Tip: apply the code first, then choose a pack. The discount is recalculated for the pack you buy.",
    popular: "Most popular",
    packDescription: (generations: number, unitPrice: string) =>
      `${generations} generation${generations === 1 ? "" : "s"}, ${unitPrice} per resume`,
    recalculate: "Recalculate the code for this pack",
    buy: "Buy",
  },

  paymentSync: {
    refresh: "Refresh my balance",
    syncFailed: "Sync failed. Please try again.",
    creditsAdded: "New credits have been added to your balance.",
    alreadyUpToDate:
      "No new credits to add. Your balance is already up to date (a payment marked “Paid” is never credited twice).",
    connectionFailed: "Could not connect. Please try again.",
    checkingTitle: "Checking…",
    checkingBody: "Syncing with Stripe…",
    errorTitle: "Sync failed",
    addedTitle: "Credits added",
    upToDateTitle: "Balance already up to date",
  },

  support: {
    description: "A question or an issue? Write to us. The reply shows up here and by email.",
    statusSent: "Message sent. Our team will reply by email and right here.",
    statusInvalid:
      "Invalid message: the subject needs at least 3 characters and the message at least 10.",
    statusRateLimited: "Too many messages sent. Try again in a few minutes.",
    sentTitle: "Message sent",
    failedTitle: "Could not send",
    newMessage: "New message",
    subject: "Subject",
    subjectPlaceholder: "e.g. PDF export is failing",
    message: "Message",
    messagePlaceholder: "Describe your request in as much detail as you can…",
    threadsTitle: "Your conversations",
    statusOpen: "Open",
    statusClosed: "Closed",
    fromTeam: "Veyala team",
    fromYou: "You",
    replyPlaceholder: "Reply…",
    replyAria: (subject: string) => `Reply to “${subject}”`,
    sendReply: "Send reply",
  },

  cvDetail: {
    breadcrumbAria: "Breadcrumb",
    backToDashboard: "Back to dashboard",
    templateMeta: (template: string, date: string) => `Template “${template}” · ${date}`,
    source: (source: string) => `Source: ${source}`,
    pastedText: "pasted text",
    editInEditor: "Open in the editor",
    campusReportTitle: "Campus France consistency report",
    atsReportTitle: "ATS match report",
    academicCv: "Academic resume",
    optimizedCv: "Tailored resume",
    previewTitle: (jobTitle: string) => `Resume preview: ${jobTitle}`,
    letterPreviewTitle: (jobTitle: string) => `Cover letter: ${jobTitle}`,
    noLetterBody:
      "This resume was generated before cover letters existed. Regenerate it to get one, or write it in the editor.",
  },

  regenerate: {
    pending: "Regenerating…",
    cta: "Regenerate (1 credit)",
  },

  exportButtons: {
    dirtyHint: "Save your changes to download the latest version.",
    word: "Word (.docx)",
    pdf: "PDF",
  },

  userMenu: {
    contactUs: "Contact us",
  },

  sidebar: {
    navAria: "Navigation",
    menuAria: "Menu",
    hide: "Hide navigation",
    show: "Show navigation",
  },
} as const;
