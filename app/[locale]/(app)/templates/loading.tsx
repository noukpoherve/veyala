import { Skeleton } from "@/components/ui/skeleton";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

export default function TemplatesLoading() {
  const m = getMessages(getLocale());

  return (
    <div
      className="mx-auto max-w-4xl space-y-8"
      role="status"
      aria-label={m.common.loadingAria.templates}
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
