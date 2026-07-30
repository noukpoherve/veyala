import Link from "next/link";
import type { ContentBlock } from "@/lib/blog/types";

export function ArticleBody({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-5 text-[17px] leading-relaxed text-slate-700">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case "p":
            return <p key={key}>{block.text}</p>;
          case "h2":
            return (
              <h2
                key={key}
                id={slugify(block.text)}
                className="scroll-mt-28 pt-4 font-display text-2xl font-bold tracking-tight text-slate-900"
              >
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={key}
                className="pt-2 font-display text-xl font-semibold tracking-tight text-slate-900"
              >
                {block.text}
              </h3>
            );
          case "ul":
            return (
              <ul key={key} className="list-disc space-y-2 pl-6">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key} className="list-decimal space-y-2 pl-6">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            );
          case "callout":
            return (
              <aside
                key={key}
                className="rounded-2xl border border-blue-100 bg-blue-50/70 px-5 py-4 text-[16px] text-slate-700"
              >
                {block.title ? (
                  <p className="mb-1.5 text-sm font-semibold uppercase tracking-[0.12em] text-blue-700">
                    {block.title}
                  </p>
                ) : null}
                <p>{block.text}</p>
              </aside>
            );
          case "quote":
            return (
              <blockquote
                key={key}
                className="border-l-4 border-blue-600 pl-5 font-display text-xl font-medium leading-snug text-slate-800"
              >
                <p>{block.text}</p>
                {block.cite ? (
                  <cite className="mt-2 block text-sm font-sans not-italic text-slate-500">
                    — {block.cite}
                  </cite>
                ) : null}
              </blockquote>
            );
          case "cta":
            return (
              <div key={key} className="rounded-3xl bg-[#0B1527] px-6 py-7 text-white sm:px-8">
                <p className="max-w-xl text-[16px] leading-relaxed text-slate-200">{block.text}</p>
                <Link
                  href={block.href}
                  className="mt-5 inline-flex items-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
                >
                  {block.label}
                </Link>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
