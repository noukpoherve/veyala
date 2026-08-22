"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessages } from "@/components/i18n/locale-provider";

export function FaqAccordion() {
  const items = useMessages().marketing.faq;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.question}
            className={cn(
              "overflow-hidden rounded-panel border bg-white transition-shadow duration-300",
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
                <p className="px-6 pb-5 text-[15px] leading-relaxed text-slate-500">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
