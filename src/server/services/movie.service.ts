import { cached, getCache } from "@/server/cache";
import { getRepositories } from "@/server/repositories";
import type { ListParams, Movie, MovieDetail, Paginated } from "@/types";

/**
 * Movie catalog service — read-through caching over the repository so hot
 * pages (home, detail) hit Redis instead of Postgres on most requests.
 *
 * Cache keys embed a catalog version number; admin mutations bump the version
 * which invalidates every derived key at once (old keys expire via TTL).
 */

const TTL = {
  home: 120,
  detail: 300,
  list: 60,
} as const;

const VERSION_KEY = "catalog:version";

async function catalogVersion(): Promise<number> {
  return (await getCache().get<number>(VERSION_KEY)) ?? 1;
}

/** Invalidate all cached catalog data (called after admin mutations). */
export async function bumpCatalogVersion(): Promise<void> {
  const next = (await catalogVersion()) + 1;
  await getCache().set(VERSION_KEY, next);
}

export async function getHomeSections(): Promise<{
  featured: Movie[];
  latestSingles: Movie[];
  latestSeries: Movie[];
  topRated: Movie[];
}> {
  const v = await catalogVersion();
  return cached(`home:sections:v${v}`, TTL.home, async () => {
    const repo = getRepositories().movies;
    const [featured, latestSingles, latestSeries, topRated] = await Promise.all([
      repo.featured(12),
      repo.latest("single", 18),
      repo.latest("series", 18),
      repo.list({ sort: "rating", pageSize: 18 }).then((r) => r.items),
    ]);
    return { featured, latestSingles, latestSeries, topRated };
  });
}

export async function listMovies(params: ListParams): Promise<Paginated<Movie>> {
  const v = await catalogVersion();
  const key = `list:v${v}:${JSON.stringify(params)}`;
  return cached(key, TTL.list, () => getRepositories().movies.list(params));
}

export async function getMovieBySlug(slug: string): Promise<MovieDetail | null> {
  const v = await catalogVersion();
  return cached(`movie:v${v}:${slug}`, TTL.detail, () =>
    getRepositories().movies.bySlug(slug),
  );
}

export async function getRelatedMovies(movie: MovieDetail, limit = 12): Promise<Movie[]> {
  const v = await catalogVersion();
  return cached(`related:v${v}:${movie.id}`, TTL.detail, () =>
    getRepositories().movies.related(
      movie.id,
      movie.genres.map((g) => g.slug),
      limit,
    ),
  );
}

export async function searchMovies(query: string, limit = 24): Promise<Movie[]> {
  const q = query.trim();
  if (q.length < 1) return [];
  const v = await catalogVersion();
  return cached(`search:v${v}:${q.toLowerCase()}:${limit}`, TTL.list, () =>
    getRepositories().movies.search(q, limit),
  );
}
