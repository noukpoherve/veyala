"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Check, Download, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type UniverseKey = "emploi" | "etudes";

const UNIVERSES: Record<
  UniverseKey,
  {
    badge: string;
    title: string;
    text: string;
    bullets: string[];
    chips: string[];
  }
> = {
  emploi: {
    badge: "Emploi",
    title: "Candidature à un emploi",
    text: "Collez l'offre, Veyala analyse les mots-clés, restructure votre parcours et génère un CV et une lettre qui parlent le langage du recruteur.",
    bullets: [
      "Analyse automatique des mots-clés de l'offre",
      "Reformulation ATS-optimisée de vos expériences",
      "Lettre de motivation ciblée et professionnelle",
      "20+ templates recruteurs premium",
      "Export Word natif & PDF haute qualité",
    ],
    chips: ["ATS ✓", "Word", "PDF", "LinkedIn"],
  },
  etudes: {
    badge: "Études",
    title: "Dossier d'études & mobilité",
    text: "Collez la fiche de formation ou le vœu, Veyala construit un dossier académique dans les codes de chaque plateforme (Campus France, Parcoursup ou universités canadiennes).",
    bullets: [
      "Dossier Campus France structuré selon les attentes officielles",
      "CV académique valorisant formations et projets",
      "Lettre de motivation adaptée à chaque vœu Parcoursup",
      "Formats Canada/Québec respectés à la lettre",
      "Export Word natif & PDF haute qualité",
    ],
    chips: ["Campus France", "Parcoursup", "Canada/Québec", "PDF"],
  },
};

export function UniverseTabs() {
  const [tab, setTab] = useState<UniverseKey>("emploi");
  const universe = UNIVERSES[tab];
  const Icon = tab === "emploi" ? Briefcase : GraduationCap;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Choisir un univers"
        className="mx-auto flex w-fit flex-wrap items-center justify-center gap-1 rounded-full bg-blue-50/80 p-1.5"
      >
        {(
          [
            { key: "emploi", label: "Pour l'emploi", icon: Briefcase },
            { key: "etudes", label: "Pour les études", icon: GraduationCap },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            id={`universe-tab-${item.key}`}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            aria-controls={`universe-panel-${item.key}`}
            onClick={() => setTab(item.key)}
            className={cn(
              "transition-bounce inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold sm:px-6 sm:py-2.5",
              tab === item.key
                ? "bg-white text-slate-900 shadow-md"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <item.icon className="size-4" aria-hidden />
            {item.label}
          </button>
        ))}
      </div>

      <div
        key={tab}
        id={`universe-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`universe-tab-${tab}`}
        className="tab-panel mt-14 grid items-center gap-12 lg:grid-cols-2"
      >
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1 text-xs font-semibold text-white">
            <Icon className="size-3" aria-hidden />
            {universe.badge}
          </span>
          <h3 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            {universe.title}
          </h3>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-slate-500">{universe.text}</p>
          <ul className="mt-7 space-y-3.5">
            {universe.bullets.map((bullet) => (
              <li key={bullet} className="flex items-center gap-3 text-[15px] text-slate-700">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
                  <Check className="size-3 text-white" aria-hidden />
                </span>
                {bullet}
              </li>
            ))}
          </ul>
          <Button
            asChild
            size="lg"
            className="group mt-9 h-auto gap-2 px-7 py-3.5 shadow-lg shadow-blue-600/25 hover:shadow-xl"
          >
            <Link href="/login">
              Commencer maintenant
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </Button>
        </div>

        <div
          aria-hidden
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-6 shadow-2xl shadow-blue-600/30 md:p-8"
        >
          <div className="animate-spin-slow absolute -right-16 -top-16 size-64 rounded-full border border-dashed border-white/15" />
          <div className="absolute -bottom-20 -left-12 size-56 rounded-full border border-white/10" />

          <div className="relative rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur-sm">
            <div className="flex items-start gap-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <Icon className="size-4 text-white" aria-hidden />
              </span>
              <div className="w-full space-y-2 pt-1">
                <div className="h-2.5 w-36 rounded-full bg-white/70" />
                <div className="h-2 w-24 rounded-full bg-white/40" />
              </div>
            </div>
            <div className="mt-5 space-y-2.5">
              <div className="h-1.5 w-full rounded-full bg-white/25" />
              <div className="h-1.5 w-11/12 rounded-full bg-white/25" />
              <div className="h-1.5 w-4/5 rounded-full bg-white/25" />
            </div>
          </div>

          <div className="relative mt-4 flex items-center gap-3">
            <div className="flex-1 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
              <div className="space-y-2">
                <div className="h-1.5 w-full rounded-full bg-white/30" />
                <div className="h-1.5 w-2/3 rounded-full bg-white/25" />
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-3 text-xs font-semibold text-white ring-1 ring-white/20">
              <Download className="size-3.5" aria-hidden />
              Export
            </span>
          </div>

          <ul className="relative mt-5 flex flex-wrap gap-2">
            {universe.chips.map((chip) => (
              <li
                key={chip}
                className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1 text-xs font-medium text-white"
              >
                {chip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
