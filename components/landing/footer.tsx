import Link from "next/link";
import { Globe } from "lucide-react";
import { VeyalaLogo } from "@/components/landing/logo";

const FOOTER_COLUMNS = [
  {
    title: "Produit",
    links: [
      { href: "/#fonctionnalites", label: "Fonctionnalités" },
      { href: "/#tarifs", label: "Tarifs" },
      { href: "/#templates", label: "Templates" },
      { href: "/#etudiants", label: "Étudiants" },
      { href: "/contact", label: "API" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/#comment-ca-marche", label: "Guide CV" },
      { href: "/#comment-ca-marche", label: "Guide lettre" },
      { href: "/#faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Légal",
    links: [
      { href: "/cgu", label: "CGU" },
      { href: "/confidentialite", label: "Confidentialité" },
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/confidentialite", label: "Cookies" },
    ],
  },
];

const SOCIAL_LINKS = [
  { href: "https://instagram.com", label: "Instagram" },
  { href: "https://linkedin.com", label: "LinkedIn" },
  { href: "https://youtube.com", label: "YouTube" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="Veyala — accueil">
              <VeyalaLogo />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-500">
              Votre candidature, augmentée par l&apos;IA. CV et lettres de motivation en 30
              secondes.
            </p>
            <button
              type="button"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
            >
              <Globe className="size-4" aria-hidden />
              Français
            </button>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">
                {column.title}
              </h2>
              <ul className="mt-5 space-y-3.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[15px] text-slate-600 transition-colors hover:text-blue-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 py-6 text-sm text-slate-600">
          <p>© {new Date().getFullYear()} Veyala. Tous droits réservés.</p>
          <ul className="flex items-center gap-6">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="font-medium text-slate-600 transition-colors hover:text-blue-700"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
