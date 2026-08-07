import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { pageHref, type PageQuery } from "@/lib/pagination";

type PaginationProps = {
  pathname: string;
  searchParams?: PageQuery;
  page: number;
  totalPages: number;
  totalItems?: number;
  /** Query param name for the page index (default: `page`). */
  pageParam?: string;
  className?: string;
};

/** Server-friendly prev/next pagination that preserves other query filters. */
export function Pagination({
  pathname,
  searchParams = {},
  page,
  totalPages,
  totalItems,
  pageParam = "page",
  className,
}: PaginationProps) {
  if (totalPages <= 1) {
    return totalItems != null ? (
      <p className={cn("text-sm text-muted-foreground", className)}>
        {totalItems} résultat{totalItems > 1 ? "s" : ""}
      </p>
    ) : null;
  }

  const prev = page > 1 ? pageHref(pathname, searchParams, page - 1, pageParam) : null;
  const next = page < totalPages ? pageHref(pathname, searchParams, page + 1, pageParam) : null;

  return (
    <nav
      className={cn("flex flex-wrap items-center justify-between gap-3", className)}
      aria-label="Pagination"
    >
      <p className="text-sm text-muted-foreground">
        Page {page} / {totalPages}
        {totalItems != null ? ` · ${totalItems} résultat${totalItems > 1 ? "s" : ""}` : ""}
      </p>
      <div className="flex items-center gap-2">
        {prev ? (
          <Link
            href={prev}
            className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm font-medium hover:bg-muted"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Précédent
          </Link>
        ) : (
          <span className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm text-muted-foreground opacity-50">
            <ChevronLeft className="size-4" aria-hidden />
            Précédent
          </span>
        )}
        {next ? (
          <Link
            href={next}
            className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm font-medium hover:bg-muted"
          >
            Suivant
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        ) : (
          <span className="inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm text-muted-foreground opacity-50">
            Suivant
            <ChevronRight className="size-4" aria-hidden />
          </span>
        )}
      </div>
    </nav>
  );
}
