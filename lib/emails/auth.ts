import { renderTransactionalEmail } from "@/lib/emails/layout";

/** GoTrue placeholders — must not be HTML-escaped beyond what layout already does (braces are safe). */
const SITE = "{{ .SiteURL }}";
const CONFIRM = "{{ .ConfirmationURL }}";

export type AuthEmailId =
  | "confirmation"
  | "recovery"
  | "invite"
  | "email_change"
  | "password_changed";

type AuthEmailCopy = {
  filename: string;
  subject: string;
  preheader: string;
  title: string;
  intro: string;
  ctaLabel?: string;
  ctaHref: string;
  showRawUrl: boolean;
  note: string;
};

const AUTH_EMAILS: Record<AuthEmailId, AuthEmailCopy> = {
  confirmation: {
    filename: "confirmation.html",
    subject: "Confirmez votre email — Veyala",
    preheader: "Un clic pour activer votre compte et vos 2 crédits offerts.",
    title: "Bienvenue sur Veyala",
    intro:
      "Merci d'avoir créé votre compte. Confirmez votre adresse email pour l'activer et recevoir vos 2 crédits offerts — sans carte bancaire.",
    ctaLabel: "Confirmer mon adresse email",
    ctaHref: CONFIRM,
    showRawUrl: true,
    note: "Ce lien expire dans une heure. Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.",
  },
  recovery: {
    filename: "recovery.html",
    subject: "Réinitialisez votre mot de passe — Veyala",
    preheader: "Un lien sécurisé pour choisir un nouveau mot de passe.",
    title: "Réinitialisation du mot de passe",
    intro:
      "Nous avons reçu une demande de réinitialisation pour le compte associé à cette adresse. Choisissez un nouveau mot de passe pour retrouver l'accès à votre espace.",
    ctaLabel: "Choisir un nouveau mot de passe",
    ctaHref: CONFIRM,
    showRawUrl: true,
    note: "Ce lien expire dans une heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe actuel reste inchangé.",
  },
  invite: {
    filename: "invite.html",
    subject: "Invitation à rejoindre Veyala",
    preheader: "Un administrateur vous ouvre un accès à l'espace Veyala.",
    title: "Vous êtes invité sur Veyala",
    intro:
      "Un administrateur vous ouvre un accès à l'espace Veyala. Définissez votre mot de passe pour activer votre compte et rejoindre l'équipe.",
    ctaLabel: "Activer mon compte",
    ctaHref: CONFIRM,
    showRawUrl: true,
    note: "Ce lien expire dans une heure. Si vous n'attendiez pas cette invitation, ignorez cet email.",
  },
  email_change: {
    filename: "email-change.html",
    subject: "Confirmez votre nouvelle adresse — Veyala",
    preheader: "Validez ce changement d'email pour sécuriser votre compte.",
    title: "Confirmez votre nouvelle adresse",
    intro:
      "Une demande de changement d'adresse email a été faite sur votre compte Veyala. Confirmez {{ .NewEmail }} pour finaliser la modification.",
    ctaLabel: "Confirmer cette adresse",
    ctaHref: CONFIRM,
    showRawUrl: true,
    note: "Ce lien expire dans une heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre adresse actuelle reste inchangée.",
  },
  password_changed: {
    filename: "password-changed.html",
    subject: "Votre mot de passe a été modifié — Veyala",
    preheader: "Notification de sécurité : le mot de passe de votre compte a changé.",
    title: "Votre mot de passe a été modifié",
    intro:
      "Le mot de passe de votre compte Veyala vient d'être mis à jour. Si c'est bien vous, aucune action n'est nécessaire.\n\nSi vous n'êtes pas à l'origine de ce changement, reconnectez-vous dès que possible et contactez le support depuis votre espace.",
    ctaLabel: "Ouvrir Veyala",
    ctaHref: `${SITE}/login`,
    showRawUrl: false,
    note: "Cet email est envoyé automatiquement pour la sécurité de votre compte.",
  },
};

export function authEmailSubject(id: AuthEmailId): string {
  return AUTH_EMAILS[id].subject;
}

export function renderAuthEmail(id: AuthEmailId): { html: string; text: string; subject: string } {
  const copy = AUTH_EMAILS[id];
  const rendered = renderTransactionalEmail({
    siteUrl: SITE,
    preheader: copy.preheader,
    title: copy.title,
    intro: copy.intro,
    cta: copy.ctaLabel ? { href: copy.ctaHref, label: copy.ctaLabel } : undefined,
    ctaUrl: copy.showRawUrl ? copy.ctaHref : undefined,
    note: copy.note,
  });
  return { ...rendered, subject: copy.subject };
}

/** Filenames → HTML, for writing `supabase/templates/*.html`. */
export function authEmailFiles(): Record<string, string> {
  return Object.fromEntries(
    (Object.keys(AUTH_EMAILS) as AuthEmailId[]).map((id) => {
      const copy = AUTH_EMAILS[id];
      const { html } = renderAuthEmail(id);
      return [copy.filename, html];
    })
  );
}
