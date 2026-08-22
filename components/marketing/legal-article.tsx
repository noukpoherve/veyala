import { formatDate } from "@/i18n/format";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

/** Shared shell for legal pages: consistent typography and spacing. */
export function LegalArticle({
  title,
  updated,
  binding = false,
  children,
}: {
  title: string;
  /** ISO date, rendered in the active locale. */
  updated: string;
  /** Shows the "French version prevails" notice, which is empty in French. */
  binding?: boolean;
  children: React.ReactNode;
}) {
  const locale = getLocale();
  const m = getMessages(locale);
  const note = binding ? m.legal.bindingNote : "";

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <article className="space-y-6">
        <header className="space-y-1">
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {m.legal.updated(formatDate(updated, locale))}
          </p>
        </header>
        {note ? (
          <p className="rounded-panel border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            {note}
          </p>
        ) : null}
        <div className="space-y-6 text-sm leading-relaxed [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
      </article>
    </main>
  );
}
