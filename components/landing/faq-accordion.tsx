"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQ_ITEMS = [
  {
    question: "La génération est-elle vraiment instantanée ?",
    answer:
      "Oui. En moyenne, la génération complète — CV optimisé et lettre de motivation — prend moins de 30 secondes. L'analyse de l'offre se fait en temps réel dès que vous la collez.",
  },
  {
    question: "Mes données personnelles sont-elles protégées ?",
    answer:
      "Oui. Vos données sont chiffrées et ne sont jamais revendues ni utilisées pour entraîner des modèles d'IA. Vous pouvez modifier ou supprimer votre profil et vos documents à tout moment.",
  },
  {
    question: "Quels formats puis-je exporter ?",
    answer:
      "Chaque génération produit un fichier Word (.docx) natif et un PDF haute définition au design identique, avec texte sélectionnable et liens cliquables — directement exploitables sur tous les portails de candidature.",
  },
  {
    question: "Quelle IA est utilisée par Veyala ?",
    answer:
      "Veyala orchestre plusieurs modèles d'IA de pointe et sélectionne le plus pertinent pour chaque étape : analyse de l'offre, reformulation ATS, rédaction de la lettre. Vous bénéficiez toujours de la meilleure qualité disponible.",
  },
  {
    question: "Mon CV sera-t-il vraiment unique à chaque offre ?",
    answer:
      "Oui. Chaque génération part de votre profil et de l'offre précise que vous collez : les mots-clés, l'ordre des rubriques et les formulations sont adaptés à cette candidature — sans jamais rien inventer.",
  },
  {
    question: "Comment fonctionnent les crédits ?",
    answer:
      "1 crédit = 1 génération complète (CV + lettre, Word + PDF). Vous achetez des packs sans abonnement, à partir de 1,99 € pour 5 CV, et vos crédits n'expirent jamais. Une génération échouée est automatiquement remboursée.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.question}
            className={cn(
              "overflow-hidden rounded-2xl border bg-white transition-shadow duration-300",
              isOpen ? "border-blue-100 shadow-md" : "border-slate-100 shadow-sm"
            )}
          >
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-[15px] font-semibold text-slate-900"
              >
                {item.question}
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-transform duration-300",
                    isOpen && "rotate-180"
                  )}
                >
                  <ChevronDown className="size-4" aria-hidden />
                </span>
              </button>
            </h3>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <p className="px-6 pb-5 text-[15px] leading-relaxed text-slate-500">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
