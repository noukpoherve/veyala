import { Skeleton } from "@/components/ui/skeleton";

export default function CvEditLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Chargement de l'éditeur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-6 w-64 max-w-full" />
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-panel" />
          <Skeleton className="h-56 w-full rounded-panel" />
        </div>
        <Skeleton className="aspect-[210/297] w-full rounded-panel" />
      </div>
    </div>
  );
}
