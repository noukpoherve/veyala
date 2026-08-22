import { Skeleton } from "@/components/ui/skeleton";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

export default function CampusFranceLoading() {
  const m = getMessages(getLocale());

  return (
    <div
      className="mx-auto max-w-3xl space-y-6"
      role="status"
      aria-label={m.common.loadingAria.campusFrance}
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-36 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-11 w-56 rounded-full" />
    </div>
  );
}
