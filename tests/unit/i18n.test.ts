import { describe, expect, it } from "vitest";
import { resolveAuthEmailLocale } from "@/i18n/auth-locale";
import { localizeHref, localizePath, localeFromPathname, stripLocalePrefix } from "@/i18n/path";
import { isEnglishGeneration } from "@/lib/generation-locale";
import { authEmailSubject, renderAuthEmail } from "@/lib/emails/auth";
import { catalogs } from "@/i18n/messages";

describe("locale paths", () => {
  it("never introduces /fr and prefixes English only", () => {
    expect(localizePath("/register", "fr")).toBe("/register");
    expect(localizePath("/register", "en")).toBe("/en/register");
    expect(localizePath("/", "en")).toBe("/en");
    expect(localizePath("/en/dashboard", "fr")).toBe("/dashboard");
    expect(localeFromPathname("/en/login")).toBe("en");
    expect(localeFromPathname("/login")).toBe("fr");
    expect(localeFromPathname("/energy")).toBe("fr");
    expect(stripLocalePrefix("/en/forgot-password")).toBe("/forgot-password");
  });

  it("preserves search and hash when switching locale", () => {
    expect(localizeHref("/login?error=credentials", "en")).toBe("/en/login?error=credentials");
    expect(localizeHref("/#faq", "en")).toBe("/en#faq");
    expect(localizeHref("/en/billing?status=success", "fr")).toBe("/billing?status=success");
  });
});

describe("auth email locale", () => {
  it("prefers the journey URL over stored metadata", () => {
    expect(
      resolveAuthEmailLocale({
        redirectTo: "https://veyala.fr/en/auth/callback?next=%2Fen%2Fdashboard",
        metadataLocale: "fr",
      })
    ).toBe("en");
    expect(
      resolveAuthEmailLocale({
        redirectTo: "https://veyala.fr/auth/callback?next=/reset-password",
        metadataLocale: "en",
      })
    ).toBe("fr");
    expect(resolveAuthEmailLocale({ metadataLocale: "en" })).toBe("en");
    expect(resolveAuthEmailLocale({})).toBe("fr");
  });
});

describe("auth email copy", () => {
  it("renders native English confirmation without French chrome", () => {
    expect(authEmailSubject("confirmation", "en")).toBe("Confirm your email | Veyala");
    const email = renderAuthEmail("confirmation", {
      locale: "en",
      siteUrl: "https://veyala.fr",
      confirmationUrl: "https://veyala.fr/en/auth/callback?next=%2Fen%2Fdashboard",
    });
    expect(email.html).toContain('lang="en"');
    expect(email.html).toContain("Welcome to Veyala");
    expect(email.html).toContain("/en/cgu");
    expect(email.html).toContain("If the button doesn&#39;t work");
    expect(email.html).not.toContain("Confirmez");
    expect(email.html).not.toContain("/fr/");
  });

  it("keeps French confirmation copy unchanged", () => {
    const email = renderAuthEmail("confirmation", { locale: "fr" });
    expect(email.html).toContain('lang="fr"');
    expect(email.html).toContain("Bienvenue sur Veyala");
    expect(email.subject).toBe("Confirmez votre email | Veyala");
  });
});

describe("generation language", () => {
  it("uses English when the UI is English or the field says english", () => {
    expect(isEnglishGeneration("english")).toBe(true);
    expect(isEnglishGeneration("", "en")).toBe(true);
    expect(isEnglishGeneration(undefined, "fr")).toBe(false);
    expect(isEnglishGeneration("français", "en")).toBe(false);
  });
});

describe("message catalogs", () => {
  it("exposes the same top-level namespaces in FR and EN", () => {
    expect(Object.keys(catalogs.en).sort()).toEqual(Object.keys(catalogs.fr).sort());
  });
});
