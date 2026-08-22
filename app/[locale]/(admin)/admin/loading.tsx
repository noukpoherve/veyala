import { Skeleton } from "@/components/ui/skeleton";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

export default function AdminLoading() {
  const m = getMessages(getLocale());

  return (
    <div className="space-y-8" role="status" aria-label={m.common.loadingAria.admin}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-11 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
