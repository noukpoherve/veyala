import Link from "next/link";
import { FileText } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const FOOTER_LINKS = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/cgu", label: "CGU" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/contact", label: "Contact" },
];

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="bg-signature inline-block h-6 w-1.5 rounded-full" aria-hidden />
            <FileText className="size-5 text-primary" aria-hidden />
            CVGen
          </Link>
          <nav aria-label="Navigation principale" className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="/#fonctionnalites" className="hover:text-foreground">Fonctionnalités</a>
            <a href="/#tarifs" className="hover:text-foreground">Tarifs</a>
            <a href="/#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            {session?.user ? (
              <Button asChild variant="gradient">
                <Link href="/dashboard">Mon espace</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button asChild variant="gradient">
                  <Link href="/login">Générer mon CV</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} CVGen — CV optimisés par IA.</p>
          <nav aria-label="Liens légaux">
            <ul className="flex flex-wrap gap-4">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-foreground hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
