export const errors = {
  network: "Can't reach the server. Check your connection and try again.",
  unknown: "Something went wrong. Please try again in a moment.",
  session: "Your session expired. Log in again to continue.",
  rateLimited: "Too many attempts. Wait a few minutes, then try again.",
  analyze: "We couldn't analyze this job posting. Check the text or URL, then try again.",
  generate: "Generation failed. If a credit was used, it has been refunded automatically.",
  reproject: "We couldn't refresh the score right now. Your selections are saved.",
  import: "We couldn't import that resume. Use a readable PDF or DOCX (8 MB max) and try again.",
  payment: "Checkout couldn't start. Try again in a moment or contact support.",
  template: "We couldn't submit that template. Use a PNG, JPEG, or WebP image (5 MB max).",
  profile: "Couldn't save. Check the required fields and try again.",
  saveCv: "Couldn't save this resume. Please try again in a moment.",
  insufficientCredits: "Not enough credits. Top up in Credits to continue.",
  forbidden: "You don't have permission to do that.",
  notFound: "We couldn't find that.",
  needBaseCv: "Import your base resume in My base resume first.",
  fileTooLarge: "That file is too large.",
  unsupportedFormat: "That file format isn't supported.",
  invalidData: "That data is invalid or unreadable.",
  unavailable: "The service is temporarily unavailable. Try again in a moment.",
  authRequired: "Please log in.",
  pageNotFoundTitle: "This page doesn't exist",
  pageNotFoundBody:
    "The link may be wrong, or the page may have moved. Head home, or contact support if you need help.",
  serverTitle: "Something broke on our side",
  serverBody:
    "We've been notified. Try again in a moment, or contact support if it keeps happening.",
  unavailableTitle: "Temporarily unavailable",
  unavailableBody:
    "We're doing maintenance or handling extra load. Try again in a few minutes, or write to support if it's urgent.",
  genericTitle: "We couldn't continue",
  genericBody:
    "An unexpected error stopped this action. Try again, or contact support with what you were doing.",
  ref: "Ref.",
  errorKind: "Error",
} as const;

export const emails = {
  tagline: "Veyala: your application, amplified by AI.",
  buttonFallback: "If the button doesn't work, copy and paste this link:",
  terms: "Terms",
  privacy: "Privacy",
  confirmation: {
    subject: "Confirm your email | Veyala",
    preheader: "One click to activate your account and claim 2 free credits.",
    title: "Welcome to Veyala",
    intro:
      "Thanks for creating an account. Confirm your email to activate it and receive 2 free credits, no credit card needed.",
    cta: "Confirm my email",
    note: "This link expires in one hour. If you didn't create an account, you can ignore this email.",
  },
  recovery: {
    subject: "Reset your password | Veyala",
    preheader: "A secure link to choose a new password.",
    title: "Reset your password",
    intro:
      "We received a reset request for the account on this email. Choose a new password to get back into your workspace.",
    cta: "Choose a new password",
    note: "This link expires in one hour. If you didn't ask for a reset, ignore this email. Your current password stays the same.",
  },
  invite: {
    subject: "You're invited to Veyala",
    preheader: "An administrator opened access to Veyala for you.",
    title: "You're invited to Veyala",
    intro:
      "An administrator opened a Veyala workspace for you. Set your password to activate your account and join the team.",
    cta: "Activate my account",
    note: "This link expires in one hour. If you weren't expecting this invitation, you can ignore this email.",
  },
  emailChange: {
    subject: "Confirm your new email | Veyala",
    preheader: "Confirm this email change to keep your account secure.",
    title: "Confirm your new email",
    intro:
      "Someone requested an email change on your Veyala account. Confirm {{ .NewEmail }} to finish the update.",
    cta: "Confirm this email",
    note: "This link expires in one hour. If you didn't request this, ignore the email. Your current address stays in place.",
  },
  passwordChanged: {
    subject: "Your password was changed | Veyala",
    preheader: "Security notice: the password on your account was updated.",
    title: "Your password was changed",
    intro:
      "The password on your Veyala account was just updated. If that was you, no action is needed.\n\nIf you didn't change it, log in as soon as you can and contact support from your workspace.",
    cta: "Open Veyala",
    note: "This email is sent automatically whenever your password changes.",
  },
  supportNotifyTitle: "New support message",
  supportNotifyPreheader: (email: string) => `New message from ${email}`,
  supportNotifyIntro: (email: string, subject: string) =>
    `${email} just wrote from Veyala about “${subject}”. Reply from the admin inbox.`,
  supportNotifyCta: "Open inbox",
  supportReplyTitle: "The Veyala team replied",
  supportReplyPreheader: "The Veyala team replied.",
  supportReplyIntro: (subject: string) =>
    `About your request “${subject}”. You can continue the conversation from Support in your workspace.`,
  supportReplyCta: "View conversation",
  supportReplyNote: "This email is a copy. The reply is also in your Veyala workspace.",
} as const;

export const cv = {
  contact: "Contact",
  summary: "Profile",
  experience: "Work Experience",
  experienceShort: "Experience",
  education: "Education",
  educationShort: "Education",
  certifications: "Certifications",
  skills: "Skills",
  languages: "Languages",
  interests: "Interests",
  information: "Details",
} as const;
