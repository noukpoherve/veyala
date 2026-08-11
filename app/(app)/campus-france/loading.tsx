import { Skeleton } from "@/components/ui/skeleton";

export default function CampusFranceLoading() {
  return (
    <div
      className="mx-auto max-w-3xl space-y-6"
      role="status"
      aria-label="Chargement du module Campus France"
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
