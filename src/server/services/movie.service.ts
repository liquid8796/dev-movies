import { cached, getCache } from "@/server/cache";
import { getRepositories } from "@/server/repositories";
import type { ListParams, Movie, MovieDetail, Paginated } from "@/types";

/**
 * Movie catalog service — read-through caching over the repository so hot
 * pages (home, detail) hit Redis instead of Postgres on most requests.
 */

const TTL = {
  home: 120,
  detail: 300,
  list: 60,
} as const;

export async function getHomeSections(): Promise<{
  featured: Movie[];
  latestSingles: Movie[];
  latestSeries: Movie[];
  topRated: Movie[];
}> {
  return cached("home:sections:v1", TTL.home, async () => {
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
  const key = `list:v1:${JSON.stringify(params)}`;
  return cached(key, TTL.list, () => getRepositories().movies.list(params));
}

export async function getMovieBySlug(slug: string): Promise<MovieDetail | null> {
  return cached(`movie:v1:${slug}`, TTL.detail, () =>
    getRepositories().movies.bySlug(slug),
  );
}

export async function getRelatedMovies(movie: MovieDetail, limit = 12): Promise<Movie[]> {
  return cached(`related:v1:${movie.id}`, TTL.detail, () =>
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
  return cached(`search:v1:${q.toLowerCase()}:${limit}`, TTL.list, () =>
    getRepositories().movies.search(q, limit),
  );
}

/** Invalidate cached movie data after admin mutations. */
export async function invalidateMovie(slug: string): Promise<void> {
  const cache = getCache();
  await Promise.all([cache.del(`movie:v1:${slug}`), cache.del("home:sections:v1")]);
}
