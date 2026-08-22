import { Skeleton } from "@/components/ui/skeleton";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

export default function DashboardLoading() {
  const m = getMessages(getLocale());

  return (
    <div className="space-y-10" role="status" aria-label={m.common.loadingAria.dashboard}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-40 rounded-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-44 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
