import { describe, expect, it } from "vitest";
import { resolveAuthEmailLocale } from "@/i18n/auth-locale";
import { authCallbackRedirect } from "@/i18n/auth-urls";
import {
  localizeHref,
  localizePath,
  localeFromPathname,
  needsUnlocalizedLocaleRewrite,
  resolveRoute,
  stripLocalePrefix,
  toInternalHref,
  toInternalPath,
} from "@/i18n/path";
import { isSafeInternalPath, sanitizeCallbackUrl } from "@/i18n/safe-path";
import { isEnglishGeneration } from "@/lib/generation-locale";
import { authEmailSubject, renderAuthEmail } from "@/lib/emails/auth";
import { catalogs } from "@/i18n/messages";
import { messageForHttpStatus, localizeServerError, USER_ERRORS } from "@/lib/user-facing-error";

describe("locale paths", () => {
  it("never introduces /fr and prefixes English only", () => {
    expect(localizePath("/register", "fr")).toBe("/register");
    expect(localizePath("/register", "en")).toBe("/en/register");
    expect(localizePath("/", "en")).toBe("/en");
    expect(localizePath("/en/dashboard", "fr")).toBe("/dashboard");
    expect(localeFromPathname("/en/login")).toBe("en");
    expect(localeFromPathname("/login")).toBe("fr");
    expect(localeFromPathname("/energy")).toBe("fr");
    expect(stripLocalePrefix("/fr/dashboard")).toBe("/dashboard");
    expect(stripLocalePrefix("/fr")).toBe("/");
    expect(toInternalPath("/login", "fr")).toBe("/fr/login");
    expect(toInternalPath("/login", "en")).toBe("/en/login");
    expect(toInternalHref("/billing?status=success", "fr")).toBe("/fr/billing?status=success");
    expect(localizeHref("/fr/login", "en")).toBe("/en/login");
    expect(localizeHref("/fr/dashboard", "en")).toBe("/en/dashboard");
    expect(localizeHref("/en/dashboard", "fr")).toBe("/dashboard");
    expect(localizePath("/en/register", "fr")).toBe("/register");
  });

  it("preserves search and hash when switching locale", () => {
    expect(localizeHref("/login?error=credentials", "en")).toBe("/en/login?error=credentials");
    expect(localizeHref("/#faq", "en")).toBe("/en#faq");
    expect(localizeHref("/en/billing?status=success", "fr")).toBe("/billing?status=success");
    expect(localizeHref("/dashboard?status=success#faq", "en")).toBe(
      "/en/dashboard?status=success#faq"
    );
  });
});

describe("request routing", () => {
  it("rewrites unprefixed French URLs into the /fr tree", () => {
    expect(resolveRoute("/")).toEqual({
      locale: "fr",
      path: "/",
      internal: "/fr",
      prefixed: false,
    });
    expect(resolveRoute("/blog")).toEqual({
      locale: "fr",
      path: "/blog",
      internal: "/fr/blog",
      prefixed: false,
    });
  });

  it("serves English URLs without a rewrite so both locales are distinct routes", () => {
    expect(resolveRoute("/en")).toEqual({
      locale: "en",
      path: "/",
      internal: "/en",
      prefixed: true,
    });
    expect(resolveRoute("/en/dashboard")).toEqual({
      locale: "en",
      path: "/dashboard",
      internal: "/en/dashboard",
      prefixed: true,
    });
  });

  it("gates auth on the unprefixed path so /en/dashboard stays protected", () => {
    expect(resolveRoute("/en/dashboard").path).toBe(resolveRoute("/dashboard").path);
  });

  it("accepts /fr as an internal alias without rewriting it twice", () => {
    expect(resolveRoute("/fr/blog")).toEqual({
      locale: "fr",
      path: "/blog",
      internal: "/fr/blog",
      prefixed: true,
    });
  });

  it("does not treat lookalike paths as locale prefixes", () => {
    expect(resolveRoute("/energy").locale).toBe("fr");
    expect(resolveRoute("/energy").internal).toBe("/fr/energy");
    expect(resolveRoute("/france").internal).toBe("/fr/france");
  });

  it("rewrites /en/auth/callback onto the real /auth/callback handler", () => {
    const resolved = resolveRoute("/en/auth/callback");
    expect(resolved).toEqual({
      locale: "en",
      path: "/auth/callback",
      internal: "/en/auth/callback",
      prefixed: true,
    });
    expect(needsUnlocalizedLocaleRewrite("/en/auth/callback")).toBe(true);
    expect(needsUnlocalizedLocaleRewrite("/auth/callback")).toBe(false);
    expect(needsUnlocalizedLocaleRewrite("/en/dashboard")).toBe(false);
  });
});

describe("auth callback URLs", () => {
  it("builds public EN callback URLs that middleware can rewrite", () => {
    const url = authCallbackRedirect("en", "/dashboard");
    expect(url).toContain("/en/auth/callback?");
    expect(url).toContain("next=%2Fen%2Fdashboard");
    expect(needsUnlocalizedLocaleRewrite(new URL(url).pathname)).toBe(true);
  });

  it("keeps French callbacks unprefixed", () => {
    const url = authCallbackRedirect("fr", "/reset-password");
    expect(url).toContain("/auth/callback?");
    expect(url).not.toContain("/en/auth");
    expect(url).toContain("next=%2Freset-password");
  });
});

describe("safe callback URLs", () => {
  it("rejects open redirects", () => {
    expect(isSafeInternalPath("//evil.com")).toBe(false);
    expect(isSafeInternalPath("/\\evil.com")).toBe(false);
    expect(isSafeInternalPath("https://evil.com")).toBe(false);
    expect(isSafeInternalPath("http://evil.com")).toBe(false);
    expect(isSafeInternalPath("/dashboard")).toBe(true);
    expect(isSafeInternalPath("/en/dashboard")).toBe(true);
    expect(isSafeInternalPath("/login?next=1")).toBe(true);
  });

  it("sanitizes and localizes callback targets", () => {
    expect(sanitizeCallbackUrl("//evil.com", "en")).toBe("/en/dashboard");
    expect(sanitizeCallbackUrl("/\\evil.com", "fr")).toBe("/dashboard");
    expect(sanitizeCallbackUrl("https://evil.com", "en")).toBe("/en/dashboard");
    expect(sanitizeCallbackUrl("/dashboard", "en")).toBe("/en/dashboard");
    expect(sanitizeCallbackUrl("/en/dashboard", "fr")).toBe("/dashboard");
    expect(sanitizeCallbackUrl("/billing?status=success", "en")).toBe("/en/billing?status=success");
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

describe("localized server errors", () => {
  it("maps HTTP statuses per locale", () => {
    expect(messageForHttpStatus(401, "fr")).toBe(USER_ERRORS.session);
    expect(messageForHttpStatus(401, "en")).toBe(catalogs.en.errors.session);
    expect(messageForHttpStatus(402, "en")).toMatch(/credits/i);
  });

  it("translates known French generation errors for EN visitors", () => {
    expect(
      localizeServerError("Solde de crédits insuffisant : rechargez dans « Crédits ».", 402, "en")
    ).toBe(catalogs.en.errors.insufficientCredits);
    expect(
      localizeServerError("Importez d'abord votre CV de base dans « Mon CV de base ».", 412, "en")
    ).toBe(catalogs.en.errors.needBaseCv);
  });
});
