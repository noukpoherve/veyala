import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Rss } from "lucide-react";
import { PostCard } from "@/components/blog/post-card";
import { getFeaturedPublishedPosts, getPublishedPosts } from "@/lib/blog/queries";
import { blogIndexJsonLd } from "@/lib/blog/seo";
import { Button } from "@/components/ui/button";

export const revalidate = 60;

const TITLE = "Blog CV, ATS et emploi : guides pour candidater mieux";
const DESCRIPTION =
  "Guides Veyala sur le CV ATS, les mots-clés recrutement, la lettre de motivation, le job hunting et les candidatures étudiants. Conseils concrets pour passer les filtres et décrocher des entretiens.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "blog CV",
    "ATS",
    "mots-clés CV",
    "lettre de motivation",
    "offre d'emploi",
    "job hunting",
    "CV étudiant",
    "Campus France",
    "générateur CV IA",
    "candidature",
    "recrutement",
    "Veyala",
  ],
  alternates: {
    canonical: "/blog",
    types: {
      "application/rss+xml": "/blog/feed.xml",
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/blog",
    siteName: "Veyala",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default async function BlogIndexPage() {
  const [posts, featuredPosts] = await Promise.all([
    getPublishedPosts(),
    getFeaturedPublishedPosts(),
  ]);
  const featured = featuredPosts[0] ?? posts[0];
  const rest = posts.filter((post) => post.slug !== featured?.slug);
  const jsonLd = blogIndexJsonLd(posts);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="bg-aurora relative overflow-hidden border-b border-slate-100">
        <div
          aria-hidden
          className="orb -top-32 left-[-10%] size-[480px]"
          style={{
            background: "radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="orb bottom-[-20%] right-[-8%] size-[420px]"
          style={{
            background: "radial-gradient(circle, rgba(96,165,250,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-14 md:pb-20 md:pt-20">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
            Blog Veyala
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight text-slate-900 md:text-5xl md:leading-[1.08]">
            CV, ATS, emploi&nbsp;: candidater avec méthode
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            Des guides actionnables pour adapter votre CV à chaque offre, passer les filtres ATS,
            écrire une lettre de motivation convaincante et accélérer votre recherche d&apos;emploi.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/register">
                Générer mon CV
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <a
              href="/blog/feed.xml"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
            >
              <Rss className="size-4" aria-hidden />
              Flux RSS
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14 md:py-16">
        {featured ? (
          <div className="mb-12">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              À la une
            </p>
            <PostCard post={featured} featured />
          </div>
        ) : (
          <p className="mb-8 text-sm text-slate-500">Aucun article publié pour le moment.</p>
        )}

        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Tous les articles
          </h2>
          <p className="text-sm text-slate-500">{posts.length} guides</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/70">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-14 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Passez à la pratique
            </h2>
            <p className="mt-2 text-slate-600">
              Collez une offre d&apos;emploi : Veyala génère un CV optimisé ATS et une lettre de
              motivation adaptés en moins de 30 secondes.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/register">
              Créer mon compte
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
