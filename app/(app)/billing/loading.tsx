import { Skeleton } from "@/components/ui/skeleton";

export default function BillingLoading() {
  return (
    <div
      className="mx-auto max-w-4xl space-y-8"
      role="status"
      aria-label="Chargement de la facturation"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-56" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-11 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
