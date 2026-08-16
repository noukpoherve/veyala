"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { VeyalaLogo } from "@/components/landing/logo";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/#fonctionnalites", label: "Fonctionnalités" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/#etudiants", label: "Étudiants" },
  { href: "/blog", label: "Blog" },
  { href: "/#faq", label: "FAQ" },
];

export function LandingHeader({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const primaryHref = isAuthenticated ? "/dashboard" : "/login";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-md transition-all duration-300",
        scrolled ? "border-slate-900/10 bg-white/85 shadow-sm" : "border-transparent bg-white/60"
      )}
    >
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-4 px-6 py-3 md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" aria-label="Accueil Veyala" className="justify-self-start">
          <VeyalaLogo />
        </Link>

        <nav aria-label="Navigation principale" className="hidden md:block">
          <ul className="flex items-center gap-8 text-sm font-medium text-slate-600">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="transition-colors hover:text-slate-900">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 justify-self-end md:flex">
          {isAuthenticated ? null : (
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              Se connecter
            </Link>
          )}
          <Button asChild className="group">
            <Link href={primaryHref}>
              {isAuthenticated ? "Mon espace" : "Générer mon CV"}
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
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
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
          aria-label="Navigation mobile"
          className="border-t border-slate-100 bg-white/95 px-6 py-4 md:hidden"
        >
          <ul className="text-sm font-medium text-slate-700">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="block py-2.5" onClick={() => setMenuOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
            <li className="flex items-center gap-3 pt-2">
              {isAuthenticated ? null : (
                <Link href="/login" className="text-slate-600">
                  Se connecter
                </Link>
              )}
              <Button asChild size="sm">
                <Link href={primaryHref}>
                  {isAuthenticated ? "Mon espace" : "Générer mon CV"}
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
