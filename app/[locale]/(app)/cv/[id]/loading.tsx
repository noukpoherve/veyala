import { Skeleton } from "@/components/ui/skeleton";
import { getLocale } from "@/i18n/get-locale";
import { getMessages } from "@/i18n/messages";

export default function CvLoading() {
  const m = getMessages(getLocale());

  return (
    <div className="mx-auto max-w-4xl space-y-6" role="status" aria-label={m.common.loadingAria.cv}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </div>
      <Skeleton className="aspect-[210/260] w-full rounded-2xl" />
    </div>
  );
}
