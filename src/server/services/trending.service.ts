import { getCache } from "@/server/cache";
import { getRepositories } from "@/server/repositories";
import type { Movie } from "@/types";

/**
 * Trending service — view counters live in Redis sorted sets (one per ISO
 * week) so ranking is cheap and never touches Postgres on the hot path.
 */

function isoWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 864e5 + 1) / 7);
  return `trending:${d.getUTCFullYear()}-w${String(week).padStart(2, "0")}`;
}

/** Record one view: bump the weekly counter and the persistent total. */
export async function recordView(movieId: string): Promise<void> {
  await Promise.all([
    getCache().zincr(isoWeekKey(), movieId),
    getRepositories().movies.incrementViews(movieId),
  ]);
}

/** Weekly trending, backfilled with all-time top views when the week is young. */
export async function getTrending(limit = 18): Promise<Movie[]> {
  const repo = getRepositories().movies;
  const ids = await getCache().ztop(isoWeekKey(), limit);
  const fromCounters = await repo.byIds(ids);
  if (fromCounters.length >= limit) return fromCounters;

  const seen = new Set(fromCounters.map((m) => m.id));
  const fallback = await repo.list({ sort: "views", pageSize: limit });
  return [...fromCounters, ...fallback.items.filter((m) => !seen.has(m.id))].slice(0, limit);
}
