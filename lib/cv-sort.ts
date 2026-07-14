/**
 * Chronological sorting for free-text date ranges like "09/2022 – 07/2024",
 * "2023 — 2025" or "02/2026 – En cours". Used to reorder experiences and
 * education most-recent-first, keeping the timeline coherent after manual
 * drag-and-drop.
 */

const PRESENT = /(en cours|présent|present|actuel|aujourd'hui|now|ongoing|current|depuis)/i;

/** A comparable rank for a date range: higher = more recent; ongoing = max. */
function dateRank(dates: string): number {
  if (!dates.trim()) return Number.NEGATIVE_INFINITY;
  if (PRESENT.test(dates)) return Number.POSITIVE_INFINITY;
  // Latest month/year (or year) mentioned ≈ the end of the range.
  let best = Number.NEGATIVE_INFINITY;
  for (const m of Array.from(dates.matchAll(/(?:(\d{1,2})[/.-])?(\d{4})/g))) {
    const month = m[1] ? Number(m[1]) : 1;
    const year = Number(m[2]);
    const rank = year * 12 + Math.min(Math.max(month, 1), 12) - 1;
    if (rank > best) best = rank;
  }
  return best;
}

/** Returns a new array sorted most-recent-first; stable for equal dates. */
export function sortByDatesDesc<T extends { dates: string }>(items: T[]): T[] {
  return items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => {
      const ra = dateRank(a.item.dates);
      const rb = dateRank(b.item.dates);
      if (ra === rb) return a.i - b.i;
      return rb > ra ? 1 : -1;
    })
    .map(({ item }) => item);
}
