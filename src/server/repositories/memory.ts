import { createHash, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { CATALOG } from "@/data/catalog";
import { PAGE_SIZE, GENRES } from "@/lib/constants";
import type {
  CollectionEntry,
  CollectionStatus,
  ContinueWatchingEntry,
  Episode,
  ListParams,
  Movie,
  MovieDetail,
  MovieType,
  Paginated,
  WatchProgress,
} from "@/types";
import type {
  CollectionRepository,
  MovieRepository,
  ProgressRepository,
  Repositories,
  UserRecord,
  UserRepository,
} from "./types";

/**
 * In-memory repositories — power the zero-config demo mode so the app runs
 * before any database is provisioned. Also double as a reference
 * implementation for tests. State is process-local and resets on restart.
 */

interface MemoryEpisode extends Episode {
  oneDriveItemId: string | null;
  oneDrivePath: string | null;
  fallbackUrl: string | null;
}

interface MemoryState {
  movies: (MovieDetail & { episodes: MemoryEpisode[] })[];
  users: UserRecord[];
  collections: Map<string, { status: CollectionStatus; updatedAt: string }>;
  progress: Map<string, WatchProgress>;
}

/** Deterministic UUID from a seed string so ids survive dev-server reloads. */
function stableId(seed: string): string {
  const hex = createHash("sha256").update(seed).digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `8${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

function buildState(): MemoryState {
  const genreMap = new Map(GENRES.map((g) => [g.slug, g.name]));
  const now = Date.now();

  const movies = CATALOG.map((entry, index) => {
    const movieId = stableId(`movie:${entry.slug}`);
    const createdAt = new Date(now - index * 36e5).toISOString();
    const episodes: MemoryEpisode[] = entry.episodes.map((ep) => ({
      id: stableId(`episode:${entry.slug}:${ep.season}:${ep.number}`),
      movieId,
      season: ep.season,
      number: ep.number,
      title: ep.title,
      duration: ep.duration,
      sourceType: ep.sourceType,
      oneDriveItemId: null,
      oneDrivePath: ep.oneDrivePath ?? null,
      fallbackUrl: ep.fallbackUrl,
    }));
    return {
      id: movieId,
      slug: entry.slug,
      title: entry.title,
      originalTitle: entry.originalTitle,
      description: entry.description,
      type: entry.type,
      posterUrl: `/posters/${entry.slug}.jpg`,
      backdropUrl: `/backdrops/${entry.slug}.jpg`,
      year: entry.year,
      duration: entry.duration,
      country: entry.country,
      quality: entry.quality,
      rating: entry.rating,
      views: entry.views,
      featured: entry.featured,
      genres: entry.genres.map((slug) => ({ slug, name: genreMap.get(slug) ?? slug })),
      episodeCount: episodes.length,
      createdAt,
      episodes,
    };
  });

  const demoUser: UserRecord = {
    id: stableId("user:demo"),
    name: "Nam Trần",
    email: "demo@phimverse.dev",
    passwordHash: bcrypt.hashSync("demo1234", 10),
    image: null,
    balance: 17500,
    inviteCode: null,
    createdAt: new Date("2021-12-24").toISOString(),
  };

  return { movies, users: [demoUser], collections: new Map(), progress: new Map() };
}

const globalForMemory = globalThis as unknown as { __memoryState?: MemoryState };

function state(): MemoryState {
  if (!globalForMemory.__memoryState) globalForMemory.__memoryState = buildState();
  return globalForMemory.__memoryState;
}

function stripEpisodes(m: MovieDetail): Movie {
  const { episodes: _episodes, ...movie } = m;
  return { ...movie };
}

function sortMovies(items: Movie[], sort: ListParams["sort"]): Movie[] {
  const arr = [...items];
  switch (sort) {
    case "year":
      return arr.sort((a, b) => b.year - a.year);
    case "views":
      return arr.sort((a, b) => b.views - a.views);
    case "rating":
      return arr.sort((a, b) => b.rating - a.rating);
    default:
      return arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

class MemoryMovieRepository implements MovieRepository {
  async list(params: ListParams): Promise<Paginated<Movie>> {
    let items = state().movies.map(stripEpisodes);
    if (params.type) items = items.filter((m) => m.type === params.type);
    if (params.country) items = items.filter((m) => m.country === params.country);
    if (params.year) items = items.filter((m) => m.year === params.year);
    if (params.genre) items = items.filter((m) => m.genres.some((g) => g.slug === params.genre));
    if (params.durationBucket === "short") items = items.filter((m) => m.duration < 90);
    if (params.durationBucket === "medium")
      items = items.filter((m) => m.duration >= 90 && m.duration <= 120);
    if (params.durationBucket === "long") items = items.filter((m) => m.duration > 120);

    items = sortMovies(items, params.sort);
    const page = Math.max(1, params.page ?? 1);
    const pageSize = params.pageSize ?? PAGE_SIZE;
    return {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      total: items.length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
    };
  }

  async featured(limit: number): Promise<Movie[]> {
    return state()
      .movies.filter((m) => m.featured)
      .map(stripEpisodes)
      .slice(0, limit);
  }

  async latest(type: MovieType | undefined, limit: number): Promise<Movie[]> {
    let items = state().movies.map(stripEpisodes);
    if (type) items = items.filter((m) => m.type === type);
    return sortMovies(items, "updated").slice(0, limit);
  }

  async bySlug(slug: string): Promise<MovieDetail | null> {
    const found = state().movies.find((m) => m.slug === slug);
    if (!found) return null;
    return {
      ...stripEpisodes(found),
      episodes: found.episodes.map(({ oneDriveItemId: _a, oneDrivePath: _b, fallbackUrl: _c, ...ep }) => ep),
    };
  }

  async byIds(ids: string[]): Promise<Movie[]> {
    const byId = new Map(state().movies.map((m) => [m.id, stripEpisodes(m)]));
    return ids.map((id) => byId.get(id)).filter((m): m is Movie => Boolean(m));
  }

  async related(movieId: string, genreSlugs: string[], limit: number): Promise<Movie[]> {
    return state()
      .movies.filter(
        (m) => m.id !== movieId && m.genres.some((g) => genreSlugs.includes(g.slug)),
      )
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)
      .map(stripEpisodes);
  }

  async search(query: string, limit: number): Promise<Movie[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return state()
      .movies.filter(
        (m) =>
          m.title.toLowerCase().includes(q) || m.originalTitle.toLowerCase().includes(q),
      )
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)
      .map(stripEpisodes);
  }

  async episodeById(episodeId: string): Promise<{ episode: Episode; movie: Movie } | null> {
    for (const movie of state().movies) {
      const ep = movie.episodes.find((e) => e.id === episodeId);
      if (ep) {
        const { oneDriveItemId: _a, oneDrivePath: _b, fallbackUrl: _c, ...episode } = ep;
        return { episode, movie: stripEpisodes(movie) };
      }
    }
    return null;
  }

  async incrementViews(movieId: string): Promise<void> {
    const movie = state().movies.find((m) => m.id === movieId);
    if (movie) movie.views += 1;
  }

  async episodeSource(episodeId: string) {
    for (const movie of state().movies) {
      const ep = movie.episodes.find((e) => e.id === episodeId);
      if (ep) {
        return {
          id: ep.id,
          sourceType: ep.sourceType,
          oneDriveItemId: ep.oneDriveItemId,
          oneDrivePath: ep.oneDrivePath,
          fallbackUrl: ep.fallbackUrl,
        };
      }
    }
    return null;
  }
}

class MemoryUserRepository implements UserRepository {
  async byEmail(email: string): Promise<UserRecord | null> {
    return state().users.find((u) => u.email === email.toLowerCase()) ?? null;
  }

  async byId(id: string): Promise<UserRecord | null> {
    return state().users.find((u) => u.id === id) ?? null;
  }

  async create(data: { name: string; email: string; passwordHash: string }): Promise<UserRecord> {
    const user: UserRecord = {
      id: randomUUID(),
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      image: null,
      balance: 0,
      inviteCode: null,
      createdAt: new Date().toISOString(),
    };
    state().users.push(user);
    return user;
  }

  async updateProfile(id: string, data: { name?: string; email?: string }): Promise<void> {
    const user = state().users.find((u) => u.id === id);
    if (!user) return;
    if (data.name !== undefined) user.name = data.name;
    if (data.email !== undefined) user.email = data.email.toLowerCase();
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    const user = state().users.find((u) => u.id === id);
    if (user) user.passwordHash = passwordHash;
  }

  async setInviteCode(id: string, code: string): Promise<void> {
    const user = state().users.find((u) => u.id === id);
    if (user) user.inviteCode = code;
  }
}

class MemoryCollectionRepository implements CollectionRepository {
  constructor(private movies: MemoryMovieRepository) {}

  async get(userId: string, movieId: string): Promise<CollectionStatus | null> {
    return state().collections.get(`${userId}:${movieId}`)?.status ?? null;
  }

  async set(userId: string, movieId: string, status: CollectionStatus | null): Promise<void> {
    const key = `${userId}:${movieId}`;
    if (status === null) state().collections.delete(key);
    else state().collections.set(key, { status, updatedAt: new Date().toISOString() });
  }

  async listByUser(userId: string, status?: CollectionStatus): Promise<CollectionEntry[]> {
    const entries: { movieId: string; status: CollectionStatus; updatedAt: string }[] = [];
    for (const [key, value] of state().collections) {
      const [uid, movieId] = key.split(":");
      if (uid === userId && (!status || value.status === status)) {
        entries.push({ movieId, ...value });
      }
    }
    entries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const movies = await this.movies.byIds(entries.map((e) => e.movieId));
    const byId = new Map(movies.map((m) => [m.id, m]));
    return entries
      .filter((e) => byId.has(e.movieId))
      .map((e) => ({ movie: byId.get(e.movieId)!, status: e.status, updatedAt: e.updatedAt }));
  }
}

class MemoryProgressRepository implements ProgressRepository {
  constructor(private movies: MemoryMovieRepository) {}

  async upsert(userId: string, progress: Omit<WatchProgress, "updatedAt">): Promise<void> {
    state().progress.set(`${userId}:${progress.episodeId}`, {
      ...progress,
      updatedAt: new Date().toISOString(),
    });
  }

  async get(userId: string, episodeId: string): Promise<WatchProgress | null> {
    return state().progress.get(`${userId}:${episodeId}`) ?? null;
  }

  async continueWatching(userId: string, limit: number): Promise<ContinueWatchingEntry[]> {
    const mine: WatchProgress[] = [];
    for (const [key, value] of state().progress) {
      if (key.startsWith(`${userId}:`)) mine.push(value);
    }
    mine.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    const entries: ContinueWatchingEntry[] = [];
    for (const p of mine.slice(0, limit)) {
      const found = await this.movies.episodeById(p.episodeId);
      if (found) entries.push({ ...p, movie: found.movie, episode: found.episode });
    }
    return entries;
  }
}

export function createMemoryRepositories(): Repositories {
  const movies = new MemoryMovieRepository();
  return {
    movies,
    users: new MemoryUserRepository(),
    collections: new MemoryCollectionRepository(movies),
    progress: new MemoryProgressRepository(movies),
  };
}
