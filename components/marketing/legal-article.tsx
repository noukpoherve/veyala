/** Shared shell for legal pages: consistent typography and spacing. */
export function LegalArticle({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <article className="space-y-6">
        <header className="space-y-1">
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">Dernière mise à jour : {updated}</p>
        </header>
        <div className="space-y-6 text-sm leading-relaxed [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
      </article>
    </main>
  );
}
