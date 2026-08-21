"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { VeyalaLogo } from "@/components/landing/logo";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useMessages } from "@/components/i18n/locale-provider";
import { Link } from "@/i18n/navigation";

export function LandingHeader({ isAuthenticated }: { isAuthenticated: boolean }) {
  const m = useMessages();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const primaryHref = isAuthenticated ? "/dashboard" : "/login";
  const navLinks = [
    { href: "/#fonctionnalites", label: m.nav.features },
    { href: "/#tarifs", label: m.nav.pricing },
    { href: "/#etudiants", label: m.nav.students },
    { href: "/blog", label: m.nav.blog },
    { href: "/#faq", label: m.nav.faq },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-md transition-all duration-300",
        scrolled ? "border-slate-900/10 bg-white/85 shadow-sm" : "border-transparent bg-white/60"
      )}
    >
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-4 px-6 py-3 md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" aria-label={m.common.homeAria} className="justify-self-start">
          <VeyalaLogo />
        </Link>

        <nav aria-label={m.nav.mainNav} className="hidden md:block">
          <ul className="flex items-center gap-8 text-sm font-medium text-slate-600">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="transition-colors hover:text-slate-900">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 justify-self-end md:flex">
          <LanguageSwitcher />
          {isAuthenticated ? null : (
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {m.nav.login}
            </Link>
          )}
          <Button asChild className="group">
            <Link href={primaryHref}>
              {isAuthenticated ? m.nav.myWorkspace : m.nav.generateCv}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </Button>
        </div>

        <button
          type="button"
          className="flex size-11 items-center justify-center justify-self-end rounded-md text-slate-600 md:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? m.common.closeMenu : m.common.openMenu}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <X className="size-5" aria-hidden />
          ) : (
            <Menu className="size-5" aria-hidden />
          )}
        </button>
      </div>

      {menuOpen ? (
        <nav
          aria-label={m.nav.mainNav}
          className="border-t border-slate-100 bg-white/95 px-6 py-4 md:hidden"
        >
          <ul className="text-sm font-medium text-slate-700">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="block py-2.5" onClick={() => setMenuOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
            <li className="flex flex-wrap items-center gap-3 pt-2">
              <LanguageSwitcher />
              {isAuthenticated ? null : (
                <Link href="/login" className="text-slate-600">
                  {m.nav.login}
                </Link>
              )}
              <Button asChild size="sm">
                <Link href={primaryHref}>
                  {isAuthenticated ? m.nav.myWorkspace : m.nav.generateCv}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
