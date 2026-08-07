/** Shared offset pagination helpers for admin/app list pages. */

export const DEFAULT_PAGE_SIZE = 20;

export function parsePage(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export function parsePageSize(
  raw: string | string[] | undefined,
  fallback = DEFAULT_PAGE_SIZE
): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(5, Math.floor(n)));
}

export function paginationSkip(page: number, pageSize = DEFAULT_PAGE_SIZE): number {
  return (Math.max(1, page) - 1) * pageSize;
}

export function totalPages(total: number, pageSize = DEFAULT_PAGE_SIZE): number {
  if (total <= 0) return 1;
  return Math.ceil(total / pageSize);
}

export type PageQuery = Record<string, string | string[] | undefined>;

/** Builds a query string preserving existing params and setting the page key. */
export function pageHref(
  pathname: string,
  current: PageQuery,
  page: number,
  pageParam = "page"
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (key === pageParam || value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v) params.append(key, v);
      }
    } else if (value !== "") {
      params.set(key, value);
    }
  }
  if (page > 1) params.set(pageParam, String(page));
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
