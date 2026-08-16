import type { Metadata } from "next";
import Link from "next/link";
import {
  Bot,
  Check,
  CheckCircle2,
  Clock,
  Cpu,
  Download,
  FileDown,
  FileText,
  Globe,
  Layers,
  PenLine,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import { getActivePacks } from "@/lib/cached";
import { siteUrl } from "@/lib/utils";
import { Reveal } from "@/components/landing/reveal";
import { Counter } from "@/components/landing/counter";
import { DemoCta, DemoSection } from "@/components/landing/demo-player";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

// Below-the-fold interactive sections: lazy chunks keep the hero's JS payload small.
const UniverseTabs = dynamic(
  () => import("@/components/landing/universe-tabs").then((mod) => mod.UniverseTabs),
  { loading: () => <Skeleton className="h-[480px] rounded-3xl" /> }
);
const TemplatesCarousel = dynamic(
  () => import("@/components/landing/templates-carousel").then((mod) => mod.TemplatesCarousel),
  { loading: () => <Skeleton className="h-[420px] rounded-3xl" /> }
);
const FaqAccordion = dynamic(
  () => import("@/components/landing/faq-accordion").then((mod) => mod.FaqAccordion),
  { loading: () => <Skeleton className="h-[420px] rounded-3xl" /> }
);

export const metadata: Metadata = {
  title: "Veyala — Votre CV, adapté à chaque offre, en 30 secondes",
  description:
    "Collez une offre d'emploi ou une fiche de formation : Veyala génère un CV et une lettre de motivation parfaitement adaptés. Export Word & PDF. Compatible ATS.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Veyala — Votre candidature, augmentée par l'IA",
    description:
      "CV et lettres de motivation adaptés par IA, pour l'emploi et les études. Export Word & PDF, compatible ATS.",
    type: "website",
    locale: "fr_FR",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Veyala — CV adaptés par IA",
    description:
      "Générez un CV ATS + lettre de motivation à partir de votre profil et d'une offre.",
  },
};

const price = (cents: number) => `${(cents / 100).toFixed(2).replace(".", ",")}€`;

const SCHOOLS = ["Sciences Po", "HEC Paris", "Polytechnique", "ESSEC", "Dauphine"];

const STATS = [
  {
    value: 48200,
    suffix: "+",
    label: "CV & lettres générés",
    sub: "et ça augmente chaque jour",
  },
  {
    value: 320,
    suffix: "+",
    label: "établissements couverts",
    sub: "Campus France, Parcoursup, universités",
  },
  {
    value: 73,
    suffix: "%",
    label: "de taux de réponse moyen",
    sub: "déclaré par nos utilisateurs actifs",
  },
];

const STEPS = [
  {
    icon: Upload,
    iconBg: "from-blue-500 to-blue-600",
    number: "01",
    title: "J'importe mon profil",
    text: "Collez votre CV existant ou remplissez votre profil. Veyala analyse vos compétences, formations et expériences en quelques secondes.",
  },
  {
    icon: FileText,
    iconBg: "from-sky-400 to-blue-500",
    number: "02",
    title: "Je colle l'offre ou la formation",
    text: "Collez l'offre d'emploi, la fiche Campus France ou le vœu Parcoursup. L'IA extrait les critères clés en temps réel.",
  },
  {
    icon: Download,
    iconBg: "from-blue-700 to-indigo-800",
    number: "03",
    title: "Je télécharge mon CV + lettre",
    text: "En moins de 30 secondes : CV optimisé ATS et lettre de motivation cohérente, exportables en Word ou PDF premium.",
  },
];

const FEATURES = [
  {
    icon: ScanSearch,
    chip: "bg-blue-50 text-blue-600",
    title: "Adaptation ATS intelligente",
    text: "Notre IA reformule vos expériences avec les mots-clés exacts de l'offre pour passer tous les filtres automatiques.",
  },
  {
    icon: Layers,
    chip: "bg-blue-50 text-blue-600",
    title: "Multi-templates premium",
    text: "Choisissez parmi 20+ templates conçus par des designers — modernes, classiques ou académiques.",
  },
  {
    icon: FileDown,
    chip: "bg-blue-50 text-blue-600",
    title: "Export Word & PDF",
    text: "Fichiers natifs haute définition, directement exploitables sur tous les portails de candidature.",
  },
  {
    icon: Cpu,
    chip: "bg-violet-50 text-violet-600",
    title: "Orchestration multi-IA",
    text: "Plusieurs modèles d'IA travaillent ensemble pour vous garantir la meilleure rédaction à chaque génération.",
  },
  {
    icon: ShieldCheck,
    chip: "bg-emerald-50 text-emerald-600",
    title: "Zéro invention",
    text: "Veyala valorise vos vraies expériences — sans jamais inventer de poste, de diplôme ou de compétence.",
  },
  {
    icon: PenLine,
    chip: "bg-amber-50 text-amber-600",
    title: "Lettre de motivation cohérente",
    text: "Construite autour de votre CV et de l'offre — tonalité professionnelle, personnalisée, convaincante.",
  },
];

const PLAN_META = [
  {
    name: "Starter",
    cta: "Commencer",
    featured: false,
    features: (credits: number) => [
      `${credits} générations de CV`,
      `${credits} lettres de motivation`,
      "Export Word & PDF",
      "Templates standard",
      "Support e-mail",
    ],
  },
  {
    name: "Pro",
    cta: "Choisir Pro",
    featured: true,
    features: (credits: number) => [
      `${credits} générations de CV`,
      `${credits} lettres de motivation`,
      "Export Word & PDF",
      "Tous les templates premium",
      "Génération prioritaire",
      "Accès multi-IA",
    ],
  },
  {
    name: "Expert",
    cta: "Choisir Expert",
    featured: false,
    features: (credits: number) => [
      `${credits} générations de CV`,
      `${credits} lettres de motivation`,
      "Export Word & PDF",
      "Tous les templates premium",
      "Génération prioritaire",
      "Accès premium IA",
      "Templates exclusifs",
    ],
  },
];

const FALLBACK_PACKS = [
  { id: "starter", credits: 5, priceCents: 199 },
  { id: "pro", credits: 20, priceCents: 599 },
  { id: "expert", credits: 50, priceCents: 1299 },
];

const TESTIMONIALS = [
  {
    quote:
      "J'ai généré mon CV Campus France en 2 minutes. L'IA a parfaitement adapté mon parcours aux critères de l'université cible. Lettre impeccable.",
    initials: "LM",
    name: "Léa Martin",
    role: "Master Marketing, Sciences Po Paris",
  },
  {
    quote:
      "J'envoie une candidature sur 3 offres, et j'ai décroché 2 entretiens la même semaine. Le score ATS à 94% sur ma dernière candidature parle de lui-même.",
    initials: "TD",
    name: "Thomas Dubois",
    role: "Ingénieur junior, Paris",
  },
  {
    quote:
      "Mon dossier pour l'Université de Montréal était pile dans les codes locaux. Veyala a su adapter le format sans que j'aie rien à reformuler.",
    initials: "AB",
    name: "Aïcha Benali",
    role: "Étudiante Campus France, Canada",
  },
  {
    quote:
      "Après 10 ans en comptabilité, je me reconvertis dans le dev. Veyala a mis en valeur mes compétences transversales d'une façon que je n'aurais jamais écrite.",
    initials: "HM",
    name: "Hugo Moreau",
    role: "Reconversion professionnelle, Lyon",
  },
];

function HeroVisual() {
  return (
    <div aria-hidden className="relative mx-auto mt-16 max-w-3xl">
      {/* Floating ATS score card (left) */}
      <div className="absolute left-0 top-24 hidden -rotate-6 md:block">
        <div className="animate-float-b w-48 rounded-2xl bg-white/90 p-4 text-left shadow-xl shadow-blue-900/10 ring-1 ring-slate-900/5 backdrop-blur">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-success" />
            <span className="text-xs font-bold text-slate-800">ATS Score</span>
          </div>
          <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="ats-bar absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 to-blue-600" />
          </div>
          <p className="mt-1 text-right text-xs font-bold text-blue-600">94%</p>
          <div className="mt-2 flex gap-1.5">
            <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              Emploi
            </span>
            <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              Optimisé
            </span>
          </div>
        </div>
      </div>

      {/* Floating "IA en cours" card (right) */}
      <div className="absolute right-0 top-16 hidden rotate-6 md:block">
        <div className="animate-float-b w-44 rounded-2xl bg-white/90 p-4 text-left shadow-xl shadow-blue-900/10 ring-1 ring-slate-900/5 backdrop-blur">
          <div className="flex items-center gap-2">
            <Bot className="size-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800">IA en cours</span>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-blue-100" />
            <div className="h-1.5 w-5/6 rounded-full bg-blue-100/80" />
            <div className="h-1.5 w-2/3 rounded-full bg-blue-100/60" />
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span className="flex items-center gap-0.5">
              <span className="typing-dot size-1 rounded-full bg-blue-600" />
              <span className="typing-dot size-1 rounded-full bg-blue-600" />
              <span className="typing-dot size-1 rounded-full bg-blue-600" />
            </span>
            <span className="text-[10px] text-slate-400">Génération...</span>
          </div>
        </div>
      </div>

      {/* Main CV mockup */}
      <div className="animate-float relative z-10 mx-auto w-64 overflow-hidden rounded-2xl bg-white shadow-2xl shadow-blue-900/15 ring-1 ring-slate-900/5">
        <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-4 text-left">
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white">
            <Sparkles className="size-2.5" />
            IA
          </span>
          <span className="flex size-9 items-center justify-center rounded-full bg-white/25 text-xs font-bold text-white ring-1 ring-white/40">
            ML
          </span>
          <div className="mt-3 space-y-1.5">
            <div className="h-2 w-32 rounded-full bg-white/80" />
            <div className="h-1.5 w-24 rounded-full bg-white/50" />
            <div className="h-1.5 w-28 rounded-full bg-white/35" />
          </div>
        </div>
        <div className="space-y-3.5 p-4 text-left">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-1 rounded-full bg-blue-600" />
              <span className="h-2 w-24 rounded-full bg-slate-800" />
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-slate-100" />
              <div className="h-1.5 w-11/12 rounded-full bg-slate-100" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-1 rounded-full bg-blue-500" />
              <span className="h-2 w-20 rounded-full bg-slate-800" />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {["React.js", "Python", "Figma", "SQL"].map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-1 rounded-full bg-sky-400" />
              <span className="h-2 w-16 rounded-full bg-slate-800" />
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="h-1.5 w-28 rounded-full bg-slate-700" />
              <div className="h-1 w-20 rounded-full bg-blue-200" />
              <div className="h-1 w-full rounded-full bg-slate-100" />
              <div className="h-1 w-10/12 rounded-full bg-slate-100" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/10 px-3 py-2">
            <CheckCircle2 className="size-3 shrink-0 text-success" />
            <span className="text-[10px] font-semibold text-success">
              Compatible ATS · Score 94/100
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const dbPacks = await getActivePacks().catch(() => []);
  const packs = (dbPacks.length ? dbPacks : FALLBACK_PACKS).slice(0, 3);
  const base = siteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Veyala",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: base,
    description:
      "Générez un CV et une lettre de motivation adaptés à chaque offre, optimisés ATS, export Word & PDF.",
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 1. Hero — animated aurora gradient background with pulsing orbs */}
      <section className="bg-aurora relative overflow-hidden">
        <div
          aria-hidden
          className="orb -top-40 left-[-8%] size-[560px] [animation-duration:9s]"
          style={{
            background: "radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="orb right-[-10%] top-24 size-[480px] [animation-duration:7s]"
          style={{
            background: "radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="orb bottom-0 left-1/3 size-[520px] [animation-duration:8s]"
          style={{
            background: "radial-gradient(circle, rgba(14,165,233,0.09) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-20 text-center md:pt-28">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-1.5 text-sm font-medium text-blue-700 shadow-sm backdrop-blur">
              <span className="size-1.5 animate-pulse rounded-full bg-blue-600" aria-hidden />
              Votre candidature, augmentée par l&apos;IA
            </span>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="mx-auto mt-8 max-w-4xl font-display text-[clamp(2.5rem,6.5vw,5.125rem)] font-extrabold leading-[1.04] tracking-tight text-slate-900">
              Votre CV, <span className="shimmer-text">adapté à chaque offre</span>
              <br className="hidden sm:block" />{" "}
              <span className="text-slate-400">— en 30 secondes.</span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-500">
              Collez une offre d&apos;emploi ou une fiche de formation — Veyala génère un CV et une
              lettre de motivation parfaitement adaptés. Export Word &amp; PDF. Compatible ATS.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="h-auto gap-2 px-7 py-3.5 text-base shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30"
              >
                <Link href="/login">
                  <Sparkles className="size-4" aria-hidden />
                  Générer mon CV gratuitement
                </Link>
              </Button>
              <DemoCta />
            </div>
          </Reveal>

          <Reveal delay={400}>
            <HeroVisual />
          </Reveal>

          {/* Trust band */}
          {/* <Reveal delay={500}>
            <div className="mt-20">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                Utilisé par des étudiants de
              </p>
              <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
                {SCHOOLS.map((school) => (
                  <li key={school} className="text-lg font-bold text-slate-300">
                    {school}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal> */}
        </div>
      </section>

      {/* 2. Social proof — animated counters */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 text-center md:grid-cols-3 md:gap-0 md:divide-x md:divide-slate-100">
          {STATS.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 120}>
              <div className="px-6">
                <p className="font-display text-5xl font-extrabold tracking-tight text-blue-600">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-2 font-semibold text-slate-900">{stat.label}</p>
                <p className="mt-1 text-sm text-slate-400">{stat.sub}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 2b. Product demo — Scape-style in-page walkthrough */}
      <DemoSection />

      {/* 3. How it works */}
      <section
        id="comment-ca-marche"
        className="scroll-mt-20 bg-gradient-to-b from-white via-blue-50/60 to-white"
      >
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <header className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-700 shadow-sm">
                <Clock className="size-3.5 text-blue-600" aria-hidden />
                Moins de 60 secondes
              </span>
              <h2 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                Comment ça marche ?
              </h2>
              <p className="mt-4 text-lg text-slate-500">
                Trois étapes simples. Un résultat taillé sur mesure à chaque candidature.
              </p>
            </header>
          </Reveal>

          <ol className="mt-16 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <Reveal
                key={step.number}
                as="li"
                delay={index * 150}
                className="relative h-full rounded-panel border border-blue-100/70 bg-gradient-to-b from-blue-50/70 to-white p-7 transition-shadow duration-300 hover:shadow-lg hover:shadow-blue-900/5"
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${step.iconBg} shadow-md shadow-blue-600/20`}
                  >
                    <step.icon className="size-5 text-white" aria-hidden />
                  </span>
                  <span aria-hidden className="font-display text-5xl font-extrabold text-slate-200">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-slate-500">{step.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* 4. Two universes — Emploi / Études */}
      <section id="etudiants" className="scroll-mt-20 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <header className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="font-display text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                Deux univers, <span className="text-blue-600">une solution</span>
              </h2>
              <p className="mt-4 text-lg text-slate-500">
                Emploi ou études : Veyala s&apos;adapte à votre projet et aux codes de chaque
                système.
              </p>
            </header>
          </Reveal>
          <Reveal delay={120}>
            <UniverseTabs />
          </Reveal>
        </div>
      </section>

      {/* 5. Features grid */}
      <section id="fonctionnalites" className="scroll-mt-20 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <header className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-700 shadow-sm">
                <Zap className="size-3.5 text-amber-500" aria-hidden />
                Fonctionnalités
              </span>
              <h2 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                Tout ce qu&apos;il vous faut,{" "}
                <span className="text-blue-600">rien de superflu</span>
              </h2>
              <p className="mt-4 text-lg text-slate-500">
                Conçu pour être efficace dès la première utilisation — sans apprentissage, sans
                friction.
              </p>
            </header>
          </Reveal>

          <ul className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <Reveal
                key={feature.title}
                as="li"
                delay={(index % 3) * 120}
                className="h-full rounded-panel border border-slate-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5"
              >
                <span
                  className={`flex size-11 items-center justify-center rounded-xl ${feature.chip}`}
                >
                  <feature.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-base font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-500">{feature.text}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. Templates gallery */}
      <section id="templates" className="scroll-mt-20 overflow-hidden bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <TemplatesCarousel
              heading={
                <>
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-700">
                    <Layers className="size-3.5" aria-hidden />
                    Templates
                  </span>
                  <h2 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                    Designs <span className="text-blue-600">premium</span>
                  </h2>
                  <p className="mt-4 text-lg text-slate-500">
                    Chaque template est conçu pour impressionner recruteurs et commissions
                    académiques.
                  </p>
                </>
              }
            />
          </Reveal>
        </div>
      </section>

      {/* 7. Pricing */}
      <section id="tarifs" className="scroll-mt-20 bg-gradient-to-b from-white to-blue-50/60">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <header className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-700 shadow-sm">
                Tarifs
              </span>
              <h2 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                Payez <span className="text-blue-600">ce que vous utilisez</span>
              </h2>
              <p className="mt-4 text-lg text-slate-500">
                Packs de crédits sans abonnement. Achetez quand vous en avez besoin.
              </p>
            </header>
          </Reveal>

          <div className="mx-auto mt-16 grid max-w-5xl items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packs.map((pack, index) => {
              const meta = PLAN_META[Math.min(index, PLAN_META.length - 1)] ?? PLAN_META[0]!;
              const perCv = price(Math.round(pack.priceCents / pack.credits));
              return (
                <Reveal key={pack.id} delay={index * 130}>
                  {meta.featured ? (
                    <article className="relative rounded-3xl bg-gradient-to-b from-blue-600 to-blue-800 p-8 text-white shadow-2xl shadow-blue-600/30 transition-bounce [transition-duration:380ms] hover:-translate-y-1.5 lg:-mt-7">
                      <span className="absolute right-6 top-6 rounded-full border border-white/30 bg-white/15 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest">
                        Populaire
                      </span>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-blue-100">
                        {meta.name}
                      </h3>
                      <p className="mt-4 font-display text-5xl font-extrabold tracking-tight">
                        {price(pack.priceCents)}
                      </p>
                      <p className="mt-1.5 text-sm text-blue-100">pour {pack.credits} CV</p>
                      <p className="text-xs text-blue-200/70">{perCv} / CV</p>
                      <Link
                        href="/login"
                        className="mt-7 block rounded-full bg-white py-3.5 text-center text-sm font-bold text-blue-700 shadow-lg transition-bounce hover:-translate-y-0.5 hover:shadow-xl"
                      >
                        {meta.cta}
                      </Link>
                      <ul className="mt-7 space-y-3">
                        {meta.features(pack.credits).map((feature) => (
                          <li key={feature} className="flex items-center gap-2.5 text-sm">
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                              <Check className="size-3" aria-hidden />
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </article>
                  ) : (
                    <article className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-bounce [transition-duration:380ms] hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-900/5">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600">
                        {meta.name}
                      </h3>
                      <p className="mt-4 font-display text-5xl font-extrabold tracking-tight text-slate-900">
                        {price(pack.priceCents)}
                      </p>
                      <p className="mt-1.5 text-sm text-slate-500">pour {pack.credits} CV</p>
                      <p className="text-xs text-slate-400">{perCv} / CV</p>
                      <Link
                        href="/login"
                        className="mt-7 block rounded-full bg-gradient-to-r from-blue-600 to-blue-500 py-3.5 text-center text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-bounce hover:-translate-y-0.5 hover:shadow-lg"
                      >
                        {meta.cta}
                      </Link>
                      <ul className="mt-7 space-y-3">
                        {meta.features(pack.credits).map((feature) => (
                          <li
                            key={feature}
                            className="flex items-center gap-2.5 text-sm text-slate-600"
                          >
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                              <Check className="size-3" aria-hidden />
                            </span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </article>
                  )}
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={200}>
            <p className="mt-12 text-center text-sm text-slate-400">
              Les crédits n&apos;expirent jamais · Paiement sécurisé par Stripe · Pas
              d&apos;abonnement
            </p>
          </Reveal>
        </div>
      </section>

      {/* 8. Testimonials */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal>
            <header className="mx-auto max-w-2xl text-center">
              <div className="flex justify-center gap-1" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <h2 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                Ils ont décroché <span className="text-blue-600">leur entretien</span>
              </h2>
              <p className="mt-4 text-lg text-slate-500">
                Étudiants et jeunes actifs qui font confiance à Veyala.
              </p>
            </header>
          </Reveal>

          <ul className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.map((testimonial, index) => (
              <Reveal key={testimonial.name} as="li" delay={index * 100} className="h-full">
                <figure className="flex h-full flex-col rounded-panel border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5">
                  <div role="img" className="flex gap-0.5" aria-label="5 étoiles sur 5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="size-3.5 fill-amber-400 text-amber-400"
                        aria-hidden
                      />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-slate-600">
                    “{testimonial.quote}”
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      {testimonial.initials}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-slate-900">
                        {testimonial.name}
                      </span>
                      <span className="block text-xs text-slate-500">{testimonial.role}</span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* 9. FAQ */}
      <section id="faq" className="scroll-mt-20 bg-blue-50/50">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <Reveal>
            <header className="text-center">
              <h2 className="font-display text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                Questions fréquentes
              </h2>
              <p className="mt-4 text-lg text-slate-500">
                Tout ce que vous voulez savoir avant de commencer.
              </p>
            </header>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-12">
              <FaqAccordion />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 10. Final CTA — dark premium section with animated aurora */}
      <section className="bg-aurora-dark relative overflow-hidden">
        <div
          aria-hidden
          className="orb -top-40 left-[10%] size-[520px] [animation-duration:6s]"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="orb -bottom-48 right-[5%] size-[480px] [animation-duration:6s]"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="orb left-1/3 top-1/3 size-[420px] [animation-duration:7s]"
          style={{
            background: "radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 py-28 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-slate-200 backdrop-blur">
              <span className="size-1.5 animate-pulse rounded-full bg-blue-400" aria-hidden />
              Commencez dès aujourd&apos;hui — gratuitement
            </span>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="mx-auto mt-8 max-w-4xl font-display text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
              Votre prochaine candidature
              <br className="hidden md:block" />{" "}
              <span className="shimmer-text">mérite le meilleur CV.</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
              Rejoignez 48 000+ candidats qui ont déjà confié leur candidature à Veyala. Premier CV
              gratuit, sans carte bancaire.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="h-auto gap-2 px-7 py-3.5 text-base shadow-lg shadow-blue-600/30 hover:bg-blue-500 hover:shadow-xl"
              >
                <Link href="/login">
                  <Sparkles className="size-4" aria-hidden />
                  Générer mon CV gratuitement
                </Link>
              </Button>
              <a
                href="#templates"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-base font-semibold text-white backdrop-blur transition-bounce hover:-translate-y-0.5 hover:bg-white/10"
              >
                <Globe className="size-4" aria-hidden />
                Voir tous les templates
              </a>
            </div>
          </Reveal>
          <Reveal delay={400}>
            <p className="mt-8 text-sm text-slate-500">
              Aucun abonnement requis · Premier CV offert · Données protégées
            </p>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
