import type { Metadata } from "next";
import Link from "next/link";
import {
  Bot,
  FileCheck2,
  FileType2,
  Palette,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "CVGen — CV optimisés par IA, adaptés à chaque offre d'emploi",
  description:
    "Importez votre CV, collez une offre d'emploi et téléchargez un CV sur mesure optimisé ATS, en Word et PDF. L'IA reformule sans jamais rien inventer. 2 crédits offerts.",
  openGraph: {
    title: "CVGen — CV optimisés par IA",
    description:
      "Un CV sur mesure pour chaque offre d'emploi, exporté en Word et PDF au design soigné.",
    type: "website",
    locale: "fr_FR",
  },
};

const euros = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

const FEATURES = [
  {
    icon: Target,
    title: "Adapté à chaque offre",
    text: "Collez l'offre (URL ou texte) : le CV reprend son vocabulaire et met en avant vos atouts les plus pertinents.",
  },
  {
    icon: ShieldCheck,
    title: "Zéro invention",
    text: "L'IA reformule et réordonne votre CV de base — jamais elle n'invente une expérience, une compétence ou un chiffre.",
  },
  {
    icon: FileCheck2,
    title: "Optimisé ATS",
    text: "Texte réel sélectionnable, mots-clés de l'offre, structure lisible par les robots recruteurs.",
  },
  {
    icon: FileType2,
    title: "Word + PDF impeccables",
    text: "Deux formats prêts à envoyer, tenant sur une page, avec liens cliquables et design premium.",
  },
  {
    icon: Palette,
    title: "Multi-templates",
    text: "Templates officiels soignés ou templates communautaires validés — importez même le vôtre depuis une image.",
  },
  {
    icon: Bot,
    title: "Multi-IA",
    text: "Groq, Gemini, Mistral, OpenAI, Claude… le fournisseur d'IA se change sans toucher au code.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Trois candidatures, trois entretiens. Le CV reprenait exactement les mots de l'offre, c'est bluffant.",
    author: "Sarah M.",
    role: "Développeuse front-end",
  },
  {
    quote:
      "Le template dégradé rend superbement en PDF comme en Word. Mon CV tient enfin sur une page.",
    author: "Karim B.",
    role: "Ingénieur DevOps",
  },
  {
    quote:
      "J'importe mon CV une fois, et je génère une variante ciblée en trente secondes par offre.",
    author: "Léa T.",
    role: "Product manager",
  },
];

const FAQ = [
  {
    q: "L'IA peut-elle inventer des expériences ?",
    a: "Non, c'est notre règle fondamentale : l'IA ne fait que reformuler, réordonner et mettre en avant le contenu de votre CV de base. Vous restez l'unique source de vérité, et vos données sont éditables à tout moment.",
  },
  {
    q: "Quels formats de CV puis-je importer et exporter ?",
    a: "Vous importez un PDF ou un DOCX. Chaque génération produit un Word (.docx) et un PDF au design identique, avec liens cliquables et texte sélectionnable compatible ATS.",
  },
  {
    q: "Comment fonctionnent les crédits ?",
    a: "1 crédit = 1 génération de CV. Vous recevez 2 crédits offerts à l'inscription, puis vous rechargez par packs (à partir de 1,99 €). Un échec de génération est automatiquement remboursé.",
  },
  {
    q: "Le site de l'offre bloque la lecture automatique, que faire ?",
    a: "Certains sites (Indeed, LinkedIn…) bloquent les robots : copiez simplement le texte de l'offre et collez-le dans le formulaire, le résultat est identique.",
  },
  {
    q: "Puis-je proposer mon propre template ?",
    a: "Oui : importez une image de référence, l'IA en extrait la mise en page et les couleurs. Les doublons sont détectés automatiquement et chaque nouveau template est validé par notre équipe avant d'être public.",
  },
];

function CvMiniPreview() {
  return (
    <div
      aria-hidden
      className="mx-auto flex aspect-[210/297] w-full max-w-sm overflow-hidden rounded-lg border bg-white shadow-xl"
    >
      <div className="bg-signature flex w-1/3 flex-col gap-2 p-3">
        <div className="mx-auto mt-1 h-14 w-12 rounded-sm bg-white/25" />
        <div className="mt-2 h-1.5 w-2/3 rounded bg-white/70" />
        <div className="h-1 w-full rounded bg-white/40" />
        <div className="h-1 w-5/6 rounded bg-white/40" />
        <div className="mt-2 h-1.5 w-2/3 rounded bg-white/70" />
        <div className="flex flex-wrap gap-1">
          <div className="h-2.5 w-10 rounded-sm border border-white/50 bg-white/15" />
          <div className="h-2.5 w-8 rounded-sm border border-white/50 bg-white/15" />
          <div className="h-2.5 w-12 rounded-sm border border-white/50 bg-white/15" />
          <div className="h-2.5 w-9 rounded-sm border border-white/50 bg-white/15" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="h-3 w-1/2 rounded bg-gray-800" />
        <div className="h-1.5 w-2/3 rounded bg-gray-300" />
        <div className="mt-2 h-2.5 w-full rounded-sm bg-[#56a8dc]" />
        <div className="h-1 w-full rounded bg-gray-200" />
        <div className="h-1 w-11/12 rounded bg-gray-200" />
        <div className="mt-2 h-2.5 w-full rounded-sm bg-[#56a8dc]" />
        <div className="h-1.5 w-1/2 rounded bg-gray-400" />
        <div className="h-1 w-full rounded bg-gray-200" />
        <div className="h-1 w-10/12 rounded bg-gray-200" />
        <div className="h-1 w-11/12 rounded bg-gray-200" />
        <div className="mt-1 h-1.5 w-1/2 rounded bg-gray-400" />
        <div className="h-1 w-full rounded bg-gray-200" />
        <div className="h-1 w-9/12 rounded bg-gray-200" />
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const packs = await db.pack.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  const highlighted = Math.floor(packs.length / 2);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-accent/60 to-transparent"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
          <div className="space-y-6">
            <Badge variant="secondary" className="gap-1.5">
              <Sparkles className="size-3.5" aria-hidden />2 crédits offerts à l&apos;inscription
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Un CV sur mesure pour{" "}
              <span className="bg-signature-x bg-clip-text text-transparent">chaque offre</span>{" "}
              d&apos;emploi
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Importez votre CV une fois. Collez une offre. Recevez en trente secondes un CV
              optimisé ATS, exporté en Word et PDF au design impeccable — sans que l&apos;IA
              n&apos;invente jamais rien.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="gradient">
                <Link href="/login">
                  <Sparkles />
                  Générer mon CV
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#fonctionnalites">Découvrir</a>
              </Button>
            </div>
          </div>
          <CvMiniPreview />
        </div>
      </section>

      {/* Features */}
      <section id="fonctionnalites" className="scroll-mt-20 border-t bg-muted/30">
        <div className="mx-auto max-w-6xl space-y-10 px-6 py-16">
          <header className="mx-auto max-w-2xl space-y-2 text-center">
            <h2 className="font-display text-3xl font-bold">
              Pensé pour décrocher des entretiens
            </h2>
            <p className="text-muted-foreground">
              Chaque détail sert un objectif : passer les filtres ATS et convaincre le
              recruteur en une page.
            </p>
          </header>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Card className="h-full">
                  <CardHeader>
                    <Icon className="size-6 text-primary" aria-hidden />
                    <CardTitle className="text-base">{title}</CardTitle>
                    <CardDescription>{text}</CardDescription>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pricing */}
      <section id="tarifs" className="scroll-mt-20 border-t">
        <div className="mx-auto max-w-6xl space-y-10 px-6 py-16">
          <header className="mx-auto max-w-2xl space-y-2 text-center">
            <h2 className="font-display text-3xl font-bold">Des tarifs simples, sans abonnement</h2>
            <p className="text-muted-foreground">
              1 crédit = 1 CV généré (Word + PDF). Les crédits n&apos;expirent jamais.
            </p>
          </header>
          <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-3">
            {packs.map((pack, i) => (
              <Card key={pack.id} className={i === highlighted ? "border-primary shadow-lg" : ""}>
                <CardHeader className="items-center text-center">
                  {i === highlighted ? <Badge className="mb-1">Le plus populaire</Badge> : null}
                  <CardTitle className="text-lg">{pack.label}</CardTitle>
                  <p className="font-display text-3xl font-bold">{euros(pack.priceCents)}</p>
                  <CardDescription>
                    soit {euros(Math.round(pack.priceCents / pack.credits))} par CV
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant={i === highlighted ? "gradient" : "outline"} className="w-full">
                    <Link href="/login">Commencer</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl space-y-10 px-6 py-16">
          <h2 className="text-center font-display text-3xl font-bold">Ils ont décroché des entretiens</h2>
          <ul className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <li key={t.author}>
                <figure className="h-full rounded-xl border bg-card p-6 shadow-sm">
                  <blockquote className="text-sm leading-relaxed">« {t.quote} »</blockquote>
                  <figcaption className="mt-4 text-sm">
                    <span className="font-medium">{t.author}</span>
                    <span className="text-muted-foreground"> — {t.role}</span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-t">
        <div className="mx-auto max-w-3xl space-y-8 px-6 py-16">
          <h2 className="text-center font-display text-3xl font-bold">Questions fréquentes</h2>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="group rounded-lg border bg-card p-4 open:shadow-sm">
                <summary className="cursor-pointer list-none font-medium marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-2">
                    {item.q}
                    <span aria-hidden className="text-muted-foreground transition-transform group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-signature">
        <div className="mx-auto max-w-6xl space-y-6 px-6 py-16 text-center text-white">
          <h2 className="font-display text-3xl font-bold">Votre prochain entretien commence ici</h2>
          <p className="mx-auto max-w-xl text-white/85">
            Créez votre compte, importez votre CV et générez vos deux premiers CV sur mesure
            gratuitement.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/login">Créer mon compte gratuitement</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
