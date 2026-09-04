import { VeyalaLogo } from "@/components/landing/logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";
import { Link } from "@/i18n/navigation";

export function LandingFooter() {
  const m = getMessages(getLocale());
  const columns = [
    {
      title: m.marketing.footerProduct,
      links: [
        { href: "/#fonctionnalites", label: m.nav.features },
        { href: "/#tarifs", label: m.nav.pricing },
        { href: "/#templates", label: m.nav.templates },
        { href: "/#etudiants", label: m.nav.students },
        { href: "/contact", label: m.marketing.footerApi },
      ],
    },
    {
      title: m.marketing.footerResources,
      links: [
        { href: "/blog", label: m.nav.blog },
        { href: "/#comment-ca-marche", label: m.marketing.footerGuideCv },
        { href: "/#comment-ca-marche", label: m.marketing.footerGuideLetter },
        { href: "/#faq", label: m.nav.faq },
        { href: "/contact", label: m.nav.support },
      ],
    },
    {
      title: m.marketing.footerLegal,
      links: [
        { href: "/cgu", label: m.marketing.footerCgu },
        { href: "/confidentialite", label: m.marketing.footerPrivacy },
        { href: "/mentions-legales", label: m.marketing.footerMentions },
        { href: "/confidentialite", label: m.marketing.footerCookies },
      ],
    },
  ];

  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label={m.common.homeAria}>
              <VeyalaLogo />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-500">
              {m.marketing.footerTagline}
            </p>
            <div className="mt-6">
              <LanguageSwitcher variant="footer" />
            </div>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">
                {column.title}
              </h2>
              <ul className="mt-5 space-y-3.5">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
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
          <p>
            © {new Date().getFullYear()} Veyala. {m.marketing.footerRights}
          </p>
          <ul className="flex items-center gap-6">
            {[
              { href: "https://instagram.com", label: "Instagram" },
              { href: "https://www.linkedin.com/company/139174062/", label: "LinkedIn" },
              { href: "https://youtube.com", label: "YouTube" },
            ].map((social) => (
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
