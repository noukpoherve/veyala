import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { authEmailFiles, authEmailSubject, renderAuthEmail } from "@/lib/emails/auth";
import { escapeHtml, quoteBlock, renderTransactionalEmail } from "@/lib/emails/layout";

describe("escapeHtml", () => {
  it("escapes markup and quotes", () => {
    expect(escapeHtml(`<img src="x" onerror='alert(1)'>`)).toBe(
      "&lt;img src=&quot;x&quot; onerror=&#39;alert(1)&#39;&gt;"
    );
  });
});

describe("renderTransactionalEmail", () => {
  const email = renderTransactionalEmail({
    siteUrl: "https://veyala.fr",
    preheader: "Aperçu inbox",
    title: "Titre du message",
    intro: "Premier paragraphe.\n\nSecond paragraphe.",
    bodyHtml: quoteBlock("<script>alert(1)</script>"),
    bodyText: "corps",
    cta: { href: "https://veyala.fr/support", label: "Voir la conversation" },
    ctaUrl: "https://veyala.fr/support",
    note: "Note de sécurité.",
  });

  it("builds a French HTML document with brand chrome", () => {
    expect(email.html).toContain('lang="fr"');
    expect(email.html).toContain("Aperçu inbox");
    expect(email.html).toContain("Titre du message");
    expect(email.html).toContain("https://veyala.fr/brand/veyala-logo-full.png");
    expect(email.html).toContain("#2563EB");
    expect(email.html).toContain("Voir la conversation");
    expect(email.html).toContain("https://veyala.fr/cgu");
    expect(email.html).toContain("https://veyala.fr/confidentialite");
    expect(email.html).toContain("Si le bouton ne s&#39;affiche pas, copiez ce lien :");
  });

  it("escapes user content in the quote and never interpolates raw tags", () => {
    expect(email.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(email.html).not.toContain("<script>alert(1)</script>");
  });

  it("splits intro paragraphs and keeps a usable text alternative", () => {
    expect(email.html).toContain("Premier paragraphe.");
    expect(email.html).toContain("Second paragraphe.");
    expect(email.text).toContain("Titre du message");
    expect(email.text).toContain("corps");
    expect(email.text).toContain("Voir la conversation : https://veyala.fr/support");
  });
});

describe("auth emails", () => {
  it("uses French subjects and GoTrue placeholders", () => {
    expect(authEmailSubject("confirmation")).toBe("Confirmez votre email | Veyala");
    const confirmation = renderAuthEmail("confirmation");
    expect(confirmation.html).toContain("{{ .ConfirmationURL }}");
    expect(confirmation.html).toContain("{{ .SiteURL }}/brand/veyala-logo-full.png");
    expect(confirmation.html).toContain("Bienvenue sur Veyala");
    expect(confirmation.html).toContain("2 crédits offerts");

    const recovery = renderAuthEmail("recovery");
    expect(recovery.html).toContain("Réinitialisation du mot de passe");
    expect(recovery.subject).toMatch(/mot de passe/);

    const invite = renderAuthEmail("invite");
    expect(invite.html).toContain("Vous êtes invité sur Veyala");

    const emailChange = renderAuthEmail("email_change");
    expect(emailChange.html).toContain("{{ .NewEmail }}");

    const changed = renderAuthEmail("password_changed");
    expect(changed.html).toContain("{{ .SiteURL }}/login");
    expect(changed.html).not.toContain("{{ .ConfirmationURL }}");
  });

  it("keeps committed Supabase templates in sync with the renderer", () => {
    for (const [filename, html] of Object.entries(authEmailFiles())) {
      const onDisk = readFileSync(join("supabase/templates", filename), "utf8");
      expect(onDisk).toBe(html);
    }
  });
});
