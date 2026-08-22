import { Skeleton } from "@/components/ui/skeleton";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

export default function BlogPostLoading() {
  const m = getMessages(getLocale());

  return (
    <main
      className="mx-auto max-w-3xl px-6 py-16 md:py-20"
      role="status"
      aria-label={m.common.loadingAria.article}
    >
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-5 h-10 w-full" />
      <Skeleton className="mt-3 h-10 w-2/3" />
      <div className="mt-6 flex items-center gap-3">
        <Skeleton className="size-9 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="mt-10 aspect-video w-full rounded-panel" />
      <div className="mt-10 space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </main>
  );
}
