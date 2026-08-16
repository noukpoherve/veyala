"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  LayoutDashboard,
  Loader2,
  Mail,
  Palette,
  Pause,
  PenLine,
  Play,
  RotateCcw,
  Sparkles,
  Upload,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VeyalaMark } from "@/components/landing/logo";

type SceneId =
  | "hook"
  | "google"
  | "serp"
  | "landing"
  | "register"
  | "profile"
  | "compose"
  | "review"
  | "generating"
  | "result"
  | "outro";

type Scene = {
  id: SceneId;
  durationMs: number;
  caption: string;
  label: string;
};

const PIPELINE_STEPS = [
  "Lecture de l'offre",
  "Analyse des exigences",
  "Matching initial",
  "Adaptation ATS du CV",
  "Lettre de motivation",
  "Exports PDF / Word",
  "Matching optimisé",
] as const;

const GAPS = [
  { term: "Design System", kind: "Indispensable" },
  { term: "Figma", kind: "Outil / stack" },
  { term: "Recherche utilisateur", kind: "Indispensable" },
  { term: "Agile", kind: "Atout" },
] as const;

const SCENES: Scene[] = [
  {
    id: "hook",
    durationMs: 2800,
    label: "Le besoin",
    caption: "Léa veut un CV vraiment adapté à une offre, pas un modèle générique.",
  },
  {
    id: "google",
    durationMs: 3600,
    label: "Recherche Google",
    caption: "Elle cherche comment optimiser un CV pour les filtres ATS.",
  },
  {
    id: "serp",
    durationMs: 4800,
    label: "Découverte",
    caption: "Parmi les outils CV / ATS, elle repère Veyala : adapté à chaque offre, en français.",
  },
  {
    id: "landing",
    durationMs: 3000,
    label: "Landing",
    caption: "Sur veyala.fr, elle clique sur « Générer mon CV gratuitement ».",
  },
  {
    id: "register",
    durationMs: 3200,
    label: "Compte",
    caption: "Création de compte : 2 crédits offerts, sans carte bancaire.",
  },
  {
    id: "profile",
    durationMs: 4200,
    label: "CV de base",
    caption: "Étape clé : importer son CV de base (PDF/DOCX). L’IA reformule, elle n’invente rien.",
  },
  {
    id: "compose",
    durationMs: 4800,
    label: "L’offre",
    caption: "Sur Générer un CV : elle colle l’offre, choisit un template, puis analyse.",
  },
  {
    id: "review",
    durationMs: 4800,
    label: "Matching",
    caption: "Analyse gratuite : score actuel vs projeté. Elle coche ce qu’elle assume.",
  },
  {
    id: "generating",
    durationMs: 5200,
    label: "Génération",
    caption: "1 crédit : adaptation ATS du CV, lettre, exports Word/PDF, matching après.",
  },
  {
    id: "result",
    durationMs: 4800,
    label: "Résultat",
    caption: "Matching 58 % → 91 %. CV + lettre prêts à télécharger ou modifier.",
  },
  {
    id: "outro",
    durationMs: 4200,
    label: "À vous",
    caption: "Même parcours produit : importer → analyser → générer → exporter.",
  },
];

const SEARCH_QUERY = "optimiser CV ATS pour une offre d'emploi";
const TOTAL_MS = SCENES.reduce((sum, scene) => sum + scene.durationMs, 0);
const DEMO_DURATION_LABEL = (() => {
  const totalSec = Math.round(TOTAL_MS / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return minutes > 0 ? `${minutes} min ${String(seconds).padStart(2, "0")}s` : `${seconds}s`;
})();

/** Hero CTA — scrolls to the on-page demo section (Scape-style). */
export function DemoCta({ className }: { className?: string }) {
  return (
    <a
      href="#demo"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-800 shadow-sm transition-bounce hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-slate-100">
        <Play className="size-3 fill-slate-700 text-slate-700" aria-hidden />
      </span>
      Voir une démo
      {/* <span className="text-sm font-medium text-slate-400">{DEMO_DURATION_LABEL}</span> */}
    </a>
  );
}

/** Landing section hosting the product walkthrough video-like player. */
export function DemoSection() {
  return (
    <section
      id="demo"
      aria-label="Démo produit Veyala"
      className="scroll-mt-20 border-b border-slate-100 bg-slate-50/80"
    >
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="mt-12">
          <DemoPlayer embedded />
        </div>
      </div>
    </section>
  );
}

function DemoPlayer({ onClose, embedded = false }: { onClose?: () => void; embedded?: boolean }) {
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(!embedded);
  const [progress, setProgress] = useState(0);
  const [hasStarted, setHasStarted] = useState(!embedded);
  const startedAt = useRef(Date.now());
  const elapsedBeforePause = useRef(0);
  const frameRef = useRef<number | null>(null);

  const scene = SCENES[Math.min(sceneIndex, SCENES.length - 1)] as Scene;
  const finished = progress >= 0.999 && sceneIndex === SCENES.length - 1;

  const seekToElapsed = useCallback((elapsedMs: number) => {
    let remaining = Math.max(0, Math.min(elapsedMs, TOTAL_MS));
    let index = 0;
    for (let i = 0; i < SCENES.length; i++) {
      const current = SCENES[i];
      if (!current) continue;
      if (remaining <= current.durationMs) {
        index = i;
        break;
      }
      remaining -= current.durationMs;
      index = i;
    }
    setSceneIndex(index);
    setProgress(elapsedMs / TOTAL_MS);
  }, []);

  const restart = useCallback(() => {
    elapsedBeforePause.current = 0;
    startedAt.current = Date.now();
    setSceneIndex(0);
    setProgress(0);
    setHasStarted(true);
    setPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    setHasStarted(true);
    setPlaying((value) => {
      if (value) {
        elapsedBeforePause.current = progress * TOTAL_MS;
        return false;
      }
      return true;
    });
  }, [progress]);

  useEffect(() => {
    if (!embedded || hasStarted) return;
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setHasStarted(true);
          setPlaying(true);
          observer.disconnect();
        }
      },
      { threshold: 0.45 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [embedded, hasStarted]);

  useEffect(() => {
    if (embedded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose?.();
      if (event.key === " ") {
        event.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [embedded, onClose, togglePlay]);

  useEffect(() => {
    if (!playing) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return;
    }
    startedAt.current = Date.now();
    const tick = () => {
      const elapsed = elapsedBeforePause.current + (Date.now() - startedAt.current);
      if (elapsed >= TOTAL_MS) {
        setProgress(1);
        setSceneIndex(SCENES.length - 1);
        setPlaying(false);
        elapsedBeforePause.current = TOTAL_MS;
        return;
      }
      seekToElapsed(elapsed);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [playing, seekToElapsed]);

  const sceneProgress = (() => {
    let before = 0;
    for (let i = 0; i < sceneIndex; i++) before += SCENES[i]?.durationMs ?? 0;
    const local = progress * TOTAL_MS - before;
    return Math.min(1, Math.max(0, local / scene.durationMs));
  })();

  const player = (
    <div
      ref={rootRef}
      className={cn(
        "relative flex w-full flex-col overflow-hidden bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/10",
        embedded ? "rounded-3xl" : "max-h-[min(920px,100%)] max-w-5xl rounded-[28px]"
      )}
      {...(embedded
        ? { role: "region" as const, "aria-labelledby": titleId }
        : { role: "dialog" as const, "aria-modal": true as const, "aria-labelledby": titleId })}
    >
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <VeyalaMark className="size-8 shrink-0" />
          <p id={titleId} className="sr-only">
            Démo produit Veyala
          </p>
          <p className="truncate text-xs text-slate-500">
            {scene.label} · {Math.round(progress * 100)}%
          </p>
        </div>
        {!embedded && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
            aria-label="Fermer la démo"
          >
            <X className="size-5" aria-hidden />
          </button>
        ) : null}
      </header>

      <div className="relative aspect-[16/10] w-full bg-slate-100 sm:aspect-[16/9]">
        <SceneStage sceneId={scene.id} sceneProgress={sceneProgress} />
        {!hasStarted && embedded ? (
          <button
            type="button"
            onClick={() => {
              setHasStarted(true);
              setPlaying(true);
            }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-900/35 text-white backdrop-blur-[2px]"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-white text-slate-900 shadow-xl">
              <Play className="size-7 fill-slate-900" aria-hidden />
            </span>
            <span className="text-sm font-semibold">Lancer la démo · {DEMO_DURATION_LABEL}</span>
          </button>
        ) : null}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/85 via-slate-900/45 to-transparent px-4 pb-4 pt-16 sm:px-6 sm:pb-5">
          <p className="max-w-3xl text-sm font-medium leading-relaxed text-white sm:text-base">
            {scene.caption}
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
        <div className="mb-3 h-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-[width] duration-100 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (finished) {
                  restart();
                  return;
                }
                togglePlay();
              }}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              {finished ? (
                <>
                  <RotateCcw className="size-4" aria-hidden />
                  Relancer
                </>
              ) : playing ? (
                <>
                  <Pause className="size-4" aria-hidden />
                  Pause
                </>
              ) : (
                <>
                  <Play className="size-4 fill-white" aria-hidden />
                  Lecture
                </>
              )}
            </button>
            <button
              type="button"
              onClick={restart}
              className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Recommencer
            </button>
          </div>
          <Button asChild size="sm">
            <Link href="/register" onClick={onClose}>
              Créer mon compte
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );

  if (embedded) return player;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md"
        aria-label="Fermer la démo"
        onClick={onClose}
      />
      {player}
    </div>
  );
}

function SceneStage({ sceneId, sceneProgress }: { sceneId: SceneId; sceneProgress: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {sceneId === "hook" ? <HookScene progress={sceneProgress} /> : null}
      {sceneId === "google" ? <GoogleScene progress={sceneProgress} /> : null}
      {sceneId === "serp" ? <SerpScene progress={sceneProgress} /> : null}
      {sceneId === "landing" ? <LandingScene progress={sceneProgress} /> : null}
      {sceneId === "register" ? <RegisterScene progress={sceneProgress} /> : null}
      {sceneId === "profile" ? <ProfileScene progress={sceneProgress} /> : null}
      {sceneId === "compose" ? <ComposeScene progress={sceneProgress} /> : null}
      {sceneId === "review" ? <ReviewScene progress={sceneProgress} /> : null}
      {sceneId === "generating" ? <GeneratingScene progress={sceneProgress} /> : null}
      {sceneId === "result" ? <ResultScene progress={sceneProgress} /> : null}
      {sceneId === "outro" ? <OutroScene progress={sceneProgress} /> : null}
    </div>
  );
}

/** Shared app chrome: sidebar + main — mirrors AppShell. */
function AppFrame({
  active,
  children,
  credits = 2,
}: {
  active: "dashboard" | "profile" | "generate" | "cv";
  children: React.ReactNode;
  credits?: number;
}) {
  const items = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { id: "generate", label: "Générer un CV", icon: Sparkles },
    { id: "profile", label: "Mon CV de base", icon: UserRound },
    { id: "templates", label: "Templates", icon: Palette },
    { id: "billing", label: "Crédits & factures", icon: Wallet },
  ] as const;

  return (
    <div className="flex h-full bg-slate-100/80">
      <aside className="hidden w-[200px] shrink-0 flex-col border-r border-slate-200 bg-white sm:flex">
        <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-3">
          <VeyalaMark className="size-6" />
          <p className="font-display text-sm font-bold tracking-tight text-blue-600">Veyala</p>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === active || (active === "cv" && item.id === "generate");
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-2.5 py-2 text-[11px] font-medium",
                  isActive ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-500"
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                {item.label}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm">
            <p className="text-[10px] font-bold text-slate-500">Mes crédits</p>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-blue-600 to-blue-400" />
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              {credits} restants · 1 crédit = 1 CV + lettre
            </p>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1 overflow-hidden p-3 sm:p-4">{children}</div>
    </div>
  );
}

function HookScene({ progress }: { progress: number }) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-blue-50 px-6 text-center">
      <p
        className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700"
        style={{ opacity: Math.min(1, progress * 3) }}
      >
        Parcours réel Veyala
      </p>
      <h2
        className="mt-4 max-w-2xl font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
        style={{ opacity: Math.min(1, Math.max(0, (progress - 0.1) * 2.5)) }}
      >
        Un CV parfait pour <span className="text-blue-600">cette</span> offre
      </h2>
      <p
        className="mt-4 max-w-lg text-sm text-slate-600 sm:text-base"
        style={{ opacity: Math.min(1, Math.max(0, (progress - 0.35) * 2.2)) }}
      >
        Pas un template générique : un dossier aligné sur les mots-clés ATS de l&apos;annonce.
      </p>
    </div>
  );
}

function GoogleScene({ progress }: { progress: number }) {
  const typed = SEARCH_QUERY.slice(0, Math.floor(progress * SEARCH_QUERY.length));
  return (
    <div className="flex h-full items-center justify-center bg-[#f8f9fa] px-4">
      <div className="w-full max-w-2xl">
        <p className="mb-8 text-center text-[40px] font-normal tracking-tight text-[#4285F4] sm:text-5xl">
          Google
        </p>
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3.5 shadow-md">
          <SearchGlyph />
          <p className="min-h-[1.5rem] flex-1 text-left text-[15px] text-slate-800">
            {typed}
            <span className="ml-0.5 inline-block h-5 w-[2px] animate-pulse bg-slate-700 align-middle" />
          </p>
        </div>
      </div>
    </div>
  );
}

const SERP_RESULTS = [
  {
    id: "veyala",
    domain: "veyala.fr",
    title: "Veyala : CV adapté à chaque offre, compatible ATS",
    snippet:
      "Importez votre CV, collez une offre : analyse de matching gratuite, puis CV + lettre optimisés ATS. Export Word & PDF.",
  },
  {
    id: "kickresume",
    domain: "kickresume.com",
    title: "Kickresume : créateur de CV et lettre par IA",
    snippet:
      "Plus de 40 modèles, génération IA et vérificateur ATS. Idéal pour étudiants et profils créatifs.",
  },
  {
    id: "rezi",
    domain: "rezi.ai",
    title: "Rezi : optimiseur de CV ATS avec score en temps réel",
    snippet:
      "Analysez votre CV pour les ATS, extrayez les mots-clés d’une offre et améliorez votre score Rezi.",
  },
  {
    id: "teal",
    domain: "tealhq.com",
    title: "Teal : CV builder et suivi de candidatures",
    snippet:
      "Créez votre CV, suivez vos candidatures et gérez votre recherche d’emploi depuis un seul tableau de bord.",
  },
  {
    id: "resumeio",
    domain: "resume.io",
    title: "Resume.io : modèles de CV professionnels en ligne",
    snippet:
      "Construisez un CV en quelques minutes avec des templates prêts à l’emploi et un export PDF.",
  },
  {
    id: "cvpass",
    domain: "cvpass.fr",
    title: "CVpass : scanner ATS et suite carrière (France)",
    snippet: "Score ATS calibré sur le marché français, lettre, LinkedIn et suivi de candidatures.",
  },
] as const;

function SerpScene({ progress }: { progress: number }) {
  const highlight = progress > 0.35;

  return (
    <div className="h-full overflow-hidden bg-white px-3 py-4 sm:px-8 sm:py-5">
      <div className="mx-auto max-w-2xl">
        <div className="mb-3 flex items-center gap-3 rounded-full border border-slate-200 px-4 py-2.5 shadow-sm">
          <SearchGlyph />
          <p className="truncate text-sm text-slate-700">{SEARCH_QUERY}</p>
        </div>
        <p className="mb-3 text-[11px] text-slate-500">
          Environ 2&nbsp;840&nbsp;000 résultats (0,38&nbsp;s)
        </p>
        <div className="space-y-4">
          {SERP_RESULTS.map((result) => {
            const isVeyala = result.id === "veyala";
            const showHighlight = isVeyala && highlight;
            return (
              <div
                key={result.id}
                className={cn(
                  "rounded-xl p-2.5 transition-all duration-500 sm:p-3",
                  showHighlight && "bg-blue-50 ring-2 ring-blue-500 ring-offset-2"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full text-[9px] font-bold",
                      isVeyala ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                    )}
                  >
                    {result.domain.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] text-slate-700">{result.domain}</p>
                    <p className="truncate text-[10px] text-slate-400">
                      https://{result.domain}
                      {isVeyala ? " ›" : ""}
                    </p>
                  </div>
                </div>
                <p
                  className={cn(
                    "mt-1 text-base leading-snug sm:text-lg",
                    isVeyala ? "text-[#1a0dab]" : "text-[#1a0dab]/90"
                  )}
                >
                  {result.title}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                  {result.snippet}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LandingScene({ progress }: { progress: number }) {
  return (
    <div className="bg-aurora flex h-full flex-col items-center justify-center px-6 text-center">
      <p
        className="rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700"
        style={{ opacity: Math.min(1, progress * 4) }}
      >
        veyala.fr
      </p>
      <h2
        className="mt-5 max-w-2xl font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-[2.5rem] sm:leading-tight"
        style={{ opacity: Math.min(1, Math.max(0, (progress - 0.08) * 2.4)) }}
      >
        Votre CV, <span className="text-blue-600">adapté à chaque offre</span>
      </h2>
      <p
        className="mt-3 max-w-md text-sm text-slate-600"
        style={{ opacity: Math.min(1, Math.max(0, (progress - 0.25) * 2)) }}
      >
        Collez une offre : Veyala génère un CV et une lettre parfaitement adaptés.
      </p>
      <div
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25"
        style={{
          opacity: Math.min(1, Math.max(0, (progress - 0.45) * 2.5)),
          transform: `scale(${0.96 + Math.min(1, Math.max(0, (progress - 0.45) * 2.5)) * 0.04})`,
        }}
      >
        <Sparkles className="size-4" aria-hidden />
        Générer mon CV gratuitement
      </div>
    </div>
  );
}

function RegisterScene({ progress }: { progress: number }) {
  return (
    <div className="bg-aurora flex h-full items-center justify-center px-4">
      <div
        className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10"
        style={{ opacity: Math.min(1, progress * 2) }}
      >
        <p className="font-display text-xl font-bold text-slate-900">Créer un compte</p>
        <p className="mt-1 text-xs text-slate-500">
          2 crédits offerts à l&apos;inscription, sans carte bancaire.
        </p>
        <div className="mt-5 space-y-3">
          <Field label="Email" value="lea.martin@email.com" />
          <Field label="Mot de passe" value="••••••••" />
          <Field label="Confirmer" value="••••••••" />
        </div>
        <div
          className="mt-5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 py-2.5 text-center text-sm font-semibold text-white"
          style={{ opacity: Math.min(1, Math.max(0, (progress - 0.4) * 2)) }}
        >
          Créer mon compte
        </div>
      </div>
    </div>
  );
}

function ProfileScene({ progress }: { progress: number }) {
  const imported = progress > 0.35;
  return (
    <AppFrame active="profile" credits={2}>
      <div className="mx-auto max-w-xl space-y-3">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Mon CV de base</h2>
          <p className="text-xs text-slate-500">
            Source de vérité : l&apos;IA reformule, elle n&apos;invente pas.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Import automatique</p>
          <p className="mt-1 text-xs text-slate-500">PDF ou DOCX · 8 Mo max</p>
          <div
            className={cn(
              "mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-5 text-sm font-medium transition-colors",
              imported
                ? "border-success/30 bg-success/10 text-success"
                : "border-slate-300 bg-slate-50 text-slate-700"
            )}
          >
            {imported ? (
              <>
                <CheckCircle2 className="size-4" aria-hidden />
                CV analysé, profil rempli
              </>
            ) : progress > 0.15 ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Analyse du CV en cours…
              </>
            ) : (
              <>
                <Upload className="size-4" aria-hidden />
                Importer mon CV (PDF ou DOCX)
              </>
            )}
          </div>
        </div>
        {imported ? (
          <div
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            style={{ opacity: Math.min(1, (progress - 0.35) * 2.5) }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Identité & contact
            </p>
            <p className="mt-2 font-display text-base font-bold text-slate-900">Léa Martin</p>
            <p className="text-sm text-slate-600">Product Designer</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Figma", "UX Research", "Prototypage"].map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700"
                >
                  {skill}
                </span>
              ))}
            </div>
            <div
              className="mt-4 rounded-full bg-blue-600 py-2 text-center text-xs font-semibold text-white"
              style={{ opacity: Math.min(1, Math.max(0, (progress - 0.65) * 3)) }}
            >
              Enregistrer mon CV de base
            </div>
          </div>
        ) : null}
      </div>
    </AppFrame>
  );
}

function ComposeScene({ progress }: { progress: number }) {
  const offer = `Product Designer, Startup SaaS · Paris / Hybride
Missions : Design System, recherche utilisateur, prototypage Figma.
Must-have : Figma, Design System, UX Research. Nice : Agile, Framer.`;
  const shown = offer.slice(0, Math.floor(Math.min(1, progress / 0.55) * offer.length));
  const showTemplates = progress > 0.45;
  const showCta = progress > 0.7;

  return (
    <AppFrame active="generate" credits={2}>
      <div className="mx-auto max-w-xl space-y-3">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Générer un CV adapté</h2>
          <p className="text-[11px] leading-relaxed text-slate-500">
            1. Analysez gratuitement le matching. 2. Cochez les compétences manquantes. 3. Générez
            (1 crédit).
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">1. L&apos;offre d&apos;emploi</p>
          <div className="mt-2 flex gap-2 text-[10px] font-medium">
            <span className="rounded-full bg-blue-600 px-2.5 py-1 text-white">
              Texte collé (recommandé)
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
              URL de l&apos;offre
            </span>
          </div>
          <div className="mt-2 min-h-[88px] rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-mono text-[10px] leading-relaxed text-slate-700">
            {shown}
            <span className="ml-0.5 inline-block h-3 w-[2px] animate-pulse bg-blue-600 align-middle" />
          </div>
        </div>

        {showTemplates ? (
          <div
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            style={{ opacity: Math.min(1, (progress - 0.45) * 3) }}
          >
            <p className="text-sm font-semibold text-slate-900">2. Template</p>
            <div className="mt-2 flex gap-2">
              {[
                { name: "Classique", colors: ["#1e3a5f", "#2563eb"] },
                { name: "Épuré", colors: ["#0f172a", "#334155"] },
                { name: "Modern", colors: ["#1d4ed8", "#38bdf8"] },
              ].map((tpl, index) => (
                <div
                  key={tpl.name}
                  className={cn(
                    "flex-1 rounded-lg border p-2",
                    index === 0 ? "border-blue-500 ring-2 ring-blue-500/30" : "border-slate-200"
                  )}
                >
                  <div
                    className="h-8 rounded-md"
                    style={{
                      background: `linear-gradient(135deg, ${tpl.colors[0]}, ${tpl.colors[1]})`,
                    }}
                  />
                  <p className="mt-1.5 text-[10px] font-medium text-slate-700">{tpl.name}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {showCta ? (
          <div
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white"
            style={{ opacity: Math.min(1, (progress - 0.7) * 4) }}
          >
            <Sparkles className="size-3.5" aria-hidden />
            Analyser le matching (gratuit)
          </div>
        ) : null}
      </div>
    </AppFrame>
  );
}

function ReviewScene({ progress }: { progress: number }) {
  const checkedCount = Math.min(GAPS.length, Math.floor(progress * (GAPS.length + 1)));
  const projected = 58 + checkedCount * 8;

  return (
    <AppFrame active="generate" credits={2}>
      <div className="mx-auto max-w-xl space-y-3">
        <div className="space-y-1 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Analyse de matching
          </h2>
          <p className="text-[11px] text-slate-500">
            Aucun crédit débité. Cochez les compétences que vous assumez.
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <ScoreBox label="Score actuel" value="58%" />
            <ScoreBox label="Score projeté" value={`${Math.min(91, projected)}%`} highlight />
            <ScoreBox label="Max si tout coché" value="91%" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-900">Compétences manquantes</p>
            <p className="text-[10px] font-medium text-blue-600">Tout cocher</p>
          </div>
          <ul className="space-y-1.5">
            {GAPS.map((gap, index) => {
              const on = index < checkedCount;
              return (
                <li
                  key={gap.term}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs",
                    on ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded border text-[9px]",
                      on
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 text-transparent"
                    )}
                  >
                    ✓
                  </span>
                  <span className="font-medium text-slate-800">{gap.term}</span>
                  <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-600">
                    {gap.kind}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20"
          style={{ opacity: Math.min(1, Math.max(0, (progress - 0.55) * 3)) }}
        >
          <Sparkles className="size-3.5" aria-hidden />
          Générer mon CV (1 crédit)
        </div>
      </div>
    </AppFrame>
  );
}

function GeneratingScene({ progress }: { progress: number }) {
  const stepIdx = Math.min(PIPELINE_STEPS.length - 1, Math.floor(progress * PIPELINE_STEPS.length));
  const afterVisible = progress > 0.75;

  return (
    <AppFrame active="generate" credits={1}>
      <div className="mx-auto max-w-xl">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Génération en cours
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Les étapes restent synchronisées même si la connexion est interrompue un instant.
          </p>
          <ol className="mt-3 space-y-1">
            {PIPELINE_STEPS.map((label, index) => {
              const done = index < stepIdx;
              const current = index === stepIdx;
              return (
                <li
                  key={label}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs",
                    current && "bg-blue-50 font-medium text-slate-900",
                    done && "text-slate-700",
                    !done && !current && "text-slate-400"
                  )}
                >
                  <span className="flex size-5 items-center justify-center rounded-full border border-slate-200 text-[10px]">
                    {current ? (
                      <Loader2 className="size-3 animate-spin text-blue-600" aria-hidden />
                    ) : done ? (
                      <CheckCircle2 className="size-3 text-success" aria-hidden />
                    ) : (
                      index + 1
                    )}
                  </span>
                  {label}
                </li>
              );
            })}
          </ol>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <ScoreBox label="Matching avant" value="58%" />
            <ScoreBox
              label="Matching après"
              value={afterVisible ? "91%" : "…"}
              highlight={afterVisible}
            />
          </div>
        </div>
      </div>
    </AppFrame>
  );
}

function ResultScene({ progress }: { progress: number }) {
  return (
    <AppFrame active="cv" credits={1}>
      <div className="mx-auto max-w-2xl space-y-3">
        <p className="text-[11px] text-slate-500">← Retour au tableau de bord</p>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Product Designer</h2>
            <p className="text-[11px] text-slate-500">Template « Classique » · texte collé</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                Source : texte collé
              </span>
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                Matching 58% → 91% (+33)
              </span>
            </div>
          </div>
          <div
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-1.5 text-[11px] font-semibold text-white"
            style={{ opacity: Math.min(1, progress * 2) }}
          >
            <PenLine className="size-3" aria-hidden />
            Modifier dans l&apos;éditeur
          </div>
        </div>

        <div
          className="grid gap-3 sm:grid-cols-2"
          style={{ opacity: Math.min(1, Math.max(0, (progress - 0.15) * 2)) }}
        >
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <FileText className="size-3.5 text-blue-600" aria-hidden />
                CV optimisé
              </p>
              <div className="flex gap-1">
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-1.5 py-0.5 text-[9px] font-medium text-slate-700">
                  <Download className="size-2.5" aria-hidden />
                  Word (.docx)
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-1.5 py-0.5 text-[9px] font-medium text-slate-700">
                  <Download className="size-2.5" aria-hidden />
                  PDF
                </span>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
              <div className="bg-gradient-to-br from-blue-800 to-blue-600 p-3 text-white">
                <p className="text-[10px] text-blue-100">Léa Martin</p>
                <p className="font-display text-sm font-bold">Product Designer</p>
              </div>
              <div className="space-y-1.5 p-3">
                <div className="h-1.5 w-2/3 rounded-full bg-slate-200" />
                <div className="h-1.5 w-full rounded-full bg-slate-100" />
                <div className="h-1.5 w-5/6 rounded-full bg-slate-100" />
                <div className="mt-2 flex flex-wrap gap-1">
                  {["Figma", "Design System", "UX Research"].map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[8px] font-semibold text-blue-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                <Mail className="size-3.5 text-blue-600" aria-hidden />
                Lettre de motivation
              </p>
              <div className="flex gap-1">
                <span className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[9px] font-medium text-slate-700">
                  Word (.docx)
                </span>
                <span className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[9px] font-medium text-slate-700">
                  PDF
                </span>
              </div>
            </div>
            <div className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] leading-relaxed text-slate-600">
                Madame, Monsieur, forte d&apos;une expérience en Design System et recherche
                utilisateur…
              </p>
              <div className="h-1.5 w-full rounded-full bg-slate-200" />
              <div className="h-1.5 w-11/12 rounded-full bg-slate-100" />
              <div className="h-1.5 w-4/5 rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}

function OutroScene({ progress }: { progress: number }) {
  const steps = [
    "Importer mon CV de base",
    "Analyser le matching (gratuit)",
    "Générer mon CV (1 crédit)",
    "Exporter Word & PDF",
  ];
  return (
    <div className="flex h-full flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <p
        className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700"
        style={{ opacity: Math.min(1, progress * 3) }}
      >
        Workflow Veyala
      </p>
      <h2
        className="mt-3 max-w-lg font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
        style={{ opacity: Math.min(1, Math.max(0, (progress - 0.08) * 2.2)) }}
      >
        Le vrai parcours, en 4 étapes
      </h2>
      <ol className="mt-6 w-full max-w-md space-y-2 text-left">
        {steps.map((step, index) => (
          <li
            key={step}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm"
            style={{
              opacity: Math.min(1, Math.max(0, (progress - 0.2 - index * 0.12) * 3)),
            }}
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-medium text-slate-600">{label}</p>
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800">
        {value}
      </div>
    </div>
  );
}

function ScoreBox({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-2.5",
        highlight ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"
      )}
    >
      <p className="text-[9px] text-slate-500">{label}</p>
      <p
        className={cn(
          "font-display text-xl font-bold tabular-nums",
          highlight ? "text-blue-700" : "text-slate-900"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function SearchGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-slate-400" aria-hidden>
      <path
        fill="currentColor"
        d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
      />
    </svg>
  );
}
