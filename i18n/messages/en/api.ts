/** User-facing messages returned by route handlers and server actions. */
export const api = {
  invalidRequest: "Invalid request.",
  analyze: {
    rateLimited: "Too many analyses in a row. Try again in a few minutes.",
    jobSourceRequired: "Add the job posting URL, or paste its text.",
    failed: "The analysis failed.",
  },
  generate: {
    rateLimited: "Too many generations in a row. Try again in a few minutes.",
    enqueueFailed: "We couldn't start the generation.",
    jobNotFound: "Job not found.",
    failed: "The generation failed.",
  },
  campusFrance: {
    analyzeFailed:
      "The analysis failed. Try again, or paste the program description if the URL is blocked.",
  },
  importCv: {
    rateLimited: "Too many imports in a row. Try again in a few minutes.",
    noFile: "No file received.",
    fileTooLarge: "That file is too large (8 MB max).",
    unsupportedFormat: "Unsupported format: PDF or DOCX only.",
    structureFailed: "The AI service couldn't structure your resume. Try again in a moment.",
    noTextExtracted:
      "We couldn't extract any text from this file. Use a text-based PDF or DOCX (not a scanned image), 8 MB max.",
    failed:
      "The import failed after reading the file. Try again in a moment; if it keeps happening, use the exported DOCX.",
  },
  templates: {
    rateLimited: "Too many submissions in a row. Try again in a few minutes.",
    nameRequired: "Template name required (3 to 60 characters).",
    imageRequired: "Reference image required.",
    unsupportedImage: "Unsupported image format: use PNG, JPEG, or WebP.",
    imageTooLarge: "That image is too large (5 MB max).",
    duplicate: (name: string) =>
      `This template already exists as “${name}”. You can use it right away.`,
    submitted:
      "Template submitted. You can use it right away, and other users will see it once it's approved.",
    analyzeFailed: "We couldn't analyze that template.",
  },
  stripe: {
    invalidPack: "Invalid pack.",
    packUnavailable: "This pack is no longer available.",
    checkoutFailed: "Checkout couldn't start. Check the Stripe setup or try again later.",
    syncRateLimited: "Too many attempts. Try again in a moment.",
    syncFailed: "We can't sync this payment right now.",
    productName: (_packLabel: string, credits: number) => `Veyala: ${credits}-credit pack`,
    lineItemDescription: (credits: number, promoLabel?: string) =>
      `${credits} resume generation${credits === 1 ? "" : "s"}${promoLabel ? ` · code ${promoLabel}` : ""}`,
  },
  promo: {
    invalidData: "Invalid data.",
    invalidCode: "Invalid promo code.",
  },
  files: {
    forbidden: "Access denied.",
    notFound: "File not found.",
  },
  llmTest: {
    adminOnly: "Administrators only.",
    invalidBody: "Invalid request body.",
    failed: "Unknown error.",
  },
  profile: {
    invalidData: "Invalid data. Check the required fields.",
  },
  cvEditor: {
    invalidData: "Invalid data. Full name is required.",
    notFound: "Resume not found.",
    templateNotAllowed: "That template isn't allowed.",
    saveFailed: "Saving failed.",
  },
  blog: {
    invalidForm: "Invalid form.",
    postNotFound: "Post not found.",
    slugTaken: "This slug is already taken.",
    slugTakenShort: "Slug already taken",
    seoTooLow: (score: number, min: number) =>
      `SEO score ${score}/100 (minimum ${min} to publish).`,
    published: (score: number) => `Published (SEO ${score}/100).`,
    draftSaved: (score: number) => `Draft saved (SEO ${score}/100).`,
  },
  settings: {
    providerNotFound: "Provider not found.",
    providerTestFailed: "Provider test failed.",
  },
} as const;
