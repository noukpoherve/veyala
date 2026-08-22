import { Skeleton } from "@/components/ui/skeleton";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

export default function BlogLoading() {
  const m = getMessages(getLocale());

  return (
    <main>
      <section className="border-b border-slate-100 bg-gradient-to-b from-blue-50/60 to-transparent">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-4 h-10 w-full max-w-2xl" />
          <Skeleton className="mt-5 h-6 w-full max-w-xl" />
        </div>
      </section>
      <section
        className="mx-auto max-w-6xl px-6 py-14 md:py-16"
        role="status"
        aria-label={m.common.loadingAria.articles}
      >
        <Skeleton className="mb-12 h-72 w-full rounded-panel" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-panel" />
          ))}
        </div>
      </section>
    </main>
  );
}
