import {
  and,
  countDistinct,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { getDb, schema } from "@/server/db";
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
import { PAGE_SIZE } from "@/lib/constants";
import type {
  AdminMovieDetail,
  AdminMovieInput,
  CollectionRepository,
  MovieRepository,
  ProgressRepository,
  Repositories,
  UserRecord,
  UserRepository,
} from "./types";

type MovieRow = typeof schema.movies.$inferSelect;
type EpisodeRow = typeof schema.episodes.$inferSelect;
type UserRow = typeof schema.users.$inferSelect;

function toUserRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    image: row.image,
    balance: row.balance,
    inviteCode: row.inviteCode,
    createdAt: row.createdAt.toISOString(),
  };
}

function toEpisode(row: EpisodeRow): Episode {
  return {
    id: row.id,
    movieId: row.movieId,
    season: row.season,
    number: row.number,
    title: row.title,
    duration: row.duration,
    sourceType: row.sourceType,
  };
}

class DrizzleMovieRepository implements MovieRepository {
  private db = getDb();

  /** Attach genres + episode counts to a page of movie rows. */
  private async hydrate(rows: MovieRow[]): Promise<Movie[]> {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);

    const [genreRows, episodeCounts] = await Promise.all([
      this.db
        .select({
          movieId: schema.movieGenres.movieId,
          slug: schema.genres.slug,
          name: schema.genres.name,
        })
        .from(schema.movieGenres)
        .innerJoin(schema.genres, eq(schema.movieGenres.genreSlug, schema.genres.slug))
        .where(inArray(schema.movieGenres.movieId, ids)),
      this.db
        .select({ movieId: schema.episodes.movieId, count: countDistinct(schema.episodes.id) })
        .from(schema.episodes)
        .where(inArray(schema.episodes.movieId, ids))
        .groupBy(schema.episodes.movieId),
    ]);

    const genresByMovie = new Map<string, { slug: string; name: string }[]>();
    for (const g of genreRows) {
      const arr = genresByMovie.get(g.movieId) ?? [];
      arr.push({ slug: g.slug, name: g.name });
      genresByMovie.set(g.movieId, arr);
    }
    const countByMovie = new Map(episodeCounts.map((c) => [c.movieId, Number(c.count)]));

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      originalTitle: row.originalTitle,
      description: row.description,
      type: row.type,
      posterUrl: row.posterUrl,
      backdropUrl: row.backdropUrl,
      year: row.year,
      duration: row.duration,
      country: row.country,
      quality: row.quality as Movie["quality"],
      rating: row.rating,
      views: row.views,
      featured: row.featured,
      genres: genresByMovie.get(row.id) ?? [],
      episodeCount: countByMovie.get(row.id) ?? 0,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  private buildFilters(params: ListParams) {
    const m = schema.movies;
    const filters = [];
    if (params.type) filters.push(eq(m.type, params.type));
    if (params.country) filters.push(eq(m.country, params.country));
    if (params.year) filters.push(eq(m.year, params.year));
    if (params.durationBucket === "short") filters.push(lt(m.duration, 90));
    if (params.durationBucket === "medium")
      filters.push(and(gte(m.duration, 90), sql`${m.duration} <= 120`)!);
    if (params.durationBucket === "long") filters.push(gt(m.duration, 120));
    if (params.genre) {
      filters.push(
        inArray(
          m.id,
          this.db
            .select({ id: schema.movieGenres.movieId })
            .from(schema.movieGenres)
            .where(eq(schema.movieGenres.genreSlug, params.genre)),
        ),
      );
    }
    return filters.length > 0 ? and(...filters) : undefined;
  }

  private orderFor(sort: ListParams["sort"]) {
    const m = schema.movies;
    switch (sort) {
      case "year":
        return [desc(m.year), desc(m.updatedAt)];
      case "views":
        return [desc(m.views)];
      case "rating":
        return [desc(m.rating)];
      default:
        return [desc(m.updatedAt)];
    }
  }

  async list(params: ListParams): Promise<Paginated<Movie>> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = params.pageSize ?? PAGE_SIZE;
    const where = this.buildFilters(params);

    const [rows, totalRows] = await Promise.all([
      this.db
        .select()
        .from(schema.movies)
        .where(where)
        .orderBy(...this.orderFor(params.sort))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.movies)
        .where(where),
    ]);

    const total = Number(totalRows[0]?.count ?? 0);
    return {
      items: await this.hydrate(rows),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async featured(limit: number): Promise<Movie[]> {
    const rows = await this.db
      .select()
      .from(schema.movies)
      .where(eq(schema.movies.featured, true))
      .orderBy(desc(schema.movies.updatedAt))
      .limit(limit);
    return this.hydrate(rows);
  }

  async latest(type: MovieType | undefined, limit: number): Promise<Movie[]> {
    const rows = await this.db
      .select()
      .from(schema.movies)
      .where(type ? eq(schema.movies.type, type) : undefined)
      .orderBy(desc(schema.movies.updatedAt))
      .limit(limit);
    return this.hydrate(rows);
  }

  async bySlug(slug: string): Promise<MovieDetail | null> {
    const rows = await this.db
      .select()
      .from(schema.movies)
      .where(eq(schema.movies.slug, slug))
      .limit(1);
    if (rows.length === 0) return null;
    const [movie] = await this.hydrate(rows);
    const episodeRows = await this.db
      .select()
      .from(schema.episodes)
      .where(eq(schema.episodes.movieId, movie.id))
      .orderBy(schema.episodes.season, schema.episodes.number);
    return { ...movie, episodes: episodeRows.map(toEpisode) };
  }

  async byIds(ids: string[]): Promise<Movie[]> {
    if (ids.length === 0) return [];
    const rows = await this.db.select().from(schema.movies).where(inArray(schema.movies.id, ids));
    const hydrated = await this.hydrate(rows);
    // Preserve the caller's ordering (e.g. trending rank).
    const byId = new Map(hydrated.map((m) => [m.id, m]));
    return ids.map((id) => byId.get(id)).filter((m): m is Movie => Boolean(m));
  }

  async related(movieId: string, genreSlugs: string[], limit: number): Promise<Movie[]> {
    if (genreSlugs.length === 0) return [];
    const rows = await this.db
      .select()
      .from(schema.movies)
      .where(
        and(
          ne(schema.movies.id, movieId),
          inArray(
            schema.movies.id,
            this.db
              .select({ id: schema.movieGenres.movieId })
              .from(schema.movieGenres)
              .where(inArray(schema.movieGenres.genreSlug, genreSlugs)),
          ),
        ),
      )
      .orderBy(desc(schema.movies.views))
      .limit(limit);
    return this.hydrate(rows);
  }

  async search(query: string, limit: number): Promise<Movie[]> {
    const q = `%${query.trim()}%`;
    const rows = await this.db
      .select()
      .from(schema.movies)
      .where(or(ilike(schema.movies.title, q), ilike(schema.movies.originalTitle, q)))
      .orderBy(desc(schema.movies.views))
      .limit(limit);
    return this.hydrate(rows);
  }

  async episodeById(episodeId: string): Promise<{ episode: Episode; movie: Movie } | null> {
    const rows = await this.db
      .select()
      .from(schema.episodes)
      .innerJoin(schema.movies, eq(schema.episodes.movieId, schema.movies.id))
      .where(eq(schema.episodes.id, episodeId))
      .limit(1);
    if (rows.length === 0) return null;
    const [movie] = await this.hydrate([rows[0].movies]);
    return { episode: toEpisode(rows[0].episodes), movie };
  }

  async incrementViews(movieId: string): Promise<void> {
    await this.db
      .update(schema.movies)
      .set({ views: sql`${schema.movies.views} + 1` })
      .where(eq(schema.movies.id, movieId));
  }

  async episodeSource(episodeId: string) {
    const rows = await this.db
      .select()
      .from(schema.episodes)
      .where(eq(schema.episodes.id, episodeId))
      .limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      sourceType: row.sourceType,
      oneDriveItemId: row.oneDriveItemId,
      oneDrivePath: row.oneDrivePath,
      fallbackUrl: row.fallbackUrl,
    };
  }

  // --- Admin CRUD ---

  async byId(id: string): Promise<Movie | null> {
    const rows = await this.db
      .select()
      .from(schema.movies)
      .where(eq(schema.movies.id, id))
      .limit(1);
    if (rows.length === 0) return null;
    const [movie] = await this.hydrate(rows);
    return movie;
  }

  async adminDetail(id: string): Promise<AdminMovieDetail | null> {
    const rows = await this.db
      .select()
      .from(schema.movies)
      .where(eq(schema.movies.id, id))
      .limit(1);
    if (rows.length === 0) return null;
    const [movie] = await this.hydrate(rows);
    const episodeRows = await this.db
      .select()
      .from(schema.episodes)
      .where(eq(schema.episodes.movieId, id))
      .orderBy(schema.episodes.season, schema.episodes.number);
    return {
      movie: { ...movie, episodes: episodeRows.map(toEpisode) },
      episodes: episodeRows.map((row) => ({
        season: row.season,
        number: row.number,
        title: row.title,
        duration: row.duration,
        sourceType: row.sourceType,
        oneDrivePath: row.oneDrivePath,
        fallbackUrl: row.fallbackUrl,
      })),
    };
  }

  private movieValues(input: AdminMovieInput) {
    return {
      slug: input.slug,
      title: input.title,
      originalTitle: input.originalTitle,
      description: input.description,
      type: input.type,
      posterUrl: input.posterUrl,
      backdropUrl: input.backdropUrl,
      year: input.year,
      duration: input.duration,
      country: input.country,
      quality: input.quality,
      rating: input.rating,
      featured: input.featured,
      updatedAt: new Date(),
    };
  }

  /** Relink genres and sync episodes by (season, number) so unchanged episode
   *  ids — and viewers' watch progress — survive edits. */
  private async syncRelations(movieId: string, input: AdminMovieInput): Promise<void> {
    await this.db.delete(schema.movieGenres).where(eq(schema.movieGenres.movieId, movieId));
    for (const genreSlug of input.genres) {
      await this.db
        .insert(schema.movieGenres)
        .values({ movieId, genreSlug })
        .onConflictDoNothing();
    }

    const existing = await this.db
      .select()
      .from(schema.episodes)
      .where(eq(schema.episodes.movieId, movieId));
    const byKey = new Map(existing.map((ep) => [`${ep.season}:${ep.number}`, ep]));
    const keep = new Set<string>();

    for (const ep of input.episodes) {
      const match = byKey.get(`${ep.season}:${ep.number}`);
      const values = {
        season: ep.season,
        number: ep.number,
        title: ep.title,
        duration: ep.duration,
        sourceType: ep.sourceType,
        oneDrivePath: ep.oneDrivePath,
        fallbackUrl: ep.fallbackUrl,
      };
      if (match) {
        keep.add(match.id);
        await this.db.update(schema.episodes).set(values).where(eq(schema.episodes.id, match.id));
      } else {
        await this.db.insert(schema.episodes).values({ movieId, ...values });
      }
    }
    const stale = existing.filter((ep) => !keep.has(ep.id)).map((ep) => ep.id);
    if (stale.length > 0) {
      await this.db.delete(schema.episodes).where(inArray(schema.episodes.id, stale));
    }
  }

  async create(input: AdminMovieInput): Promise<Movie> {
    const inserted = await this.db
      .insert(schema.movies)
      .values(this.movieValues(input))
      .returning();
    await this.syncRelations(inserted[0].id, input);
    const [movie] = await this.hydrate(inserted);
    return movie;
  }

  async update(id: string, input: AdminMovieInput): Promise<void> {
    await this.db.update(schema.movies).set(this.movieValues(input)).where(eq(schema.movies.id, id));
    await this.syncRelations(id, input);
  }

  async remove(id: string): Promise<void> {
    // Genres, episodes, collections and progress cascade via FK constraints.
    await this.db.delete(schema.movies).where(eq(schema.movies.id, id));
  }
}

class DrizzleUserRepository implements UserRepository {
  private db = getDb();

  async byEmail(email: string): Promise<UserRecord | null> {
    const rows = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase()))
      .limit(1);
    return rows[0] ? toUserRecord(rows[0]) : null;
  }

  async byId(id: string): Promise<UserRecord | null> {
    const rows = await this.db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return rows[0] ? toUserRecord(rows[0]) : null;
  }

  async create(data: { name: string; email: string; passwordHash: string }): Promise<UserRecord> {
    const rows = await this.db
      .insert(schema.users)
      .values({ name: data.name, email: data.email.toLowerCase(), passwordHash: data.passwordHash })
      .returning();
    return toUserRecord(rows[0]);
  }

  async updateProfile(id: string, data: { name?: string; email?: string }): Promise<void> {
    const patch: Partial<UserRow> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.email !== undefined) patch.email = data.email.toLowerCase();
    if (Object.keys(patch).length === 0) return;
    await this.db.update(schema.users).set(patch).where(eq(schema.users.id, id));
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.db.update(schema.users).set({ passwordHash }).where(eq(schema.users.id, id));
  }

  async setInviteCode(id: string, code: string): Promise<void> {
    await this.db.update(schema.users).set({ inviteCode: code }).where(eq(schema.users.id, id));
  }
}

class DrizzleCollectionRepository implements CollectionRepository {
  private db = getDb();
  constructor(private movies: DrizzleMovieRepository) {}

  async get(userId: string, movieId: string): Promise<CollectionStatus | null> {
    const rows = await this.db
      .select({ status: schema.collections.status })
      .from(schema.collections)
      .where(
        and(eq(schema.collections.userId, userId), eq(schema.collections.movieId, movieId)),
      )
      .limit(1);
    return rows[0]?.status ?? null;
  }

  async set(userId: string, movieId: string, status: CollectionStatus | null): Promise<void> {
    if (status === null) {
      await this.db
        .delete(schema.collections)
        .where(
          and(eq(schema.collections.userId, userId), eq(schema.collections.movieId, movieId)),
        );
      return;
    }
    await this.db
      .insert(schema.collections)
      .values({ userId, movieId, status, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [schema.collections.userId, schema.collections.movieId],
        set: { status, updatedAt: new Date() },
      });
  }

  async listByUser(userId: string, status?: CollectionStatus): Promise<CollectionEntry[]> {
    const rows = await this.db
      .select()
      .from(schema.collections)
      .where(
        and(
          eq(schema.collections.userId, userId),
          status ? eq(schema.collections.status, status) : undefined,
        ),
      )
      .orderBy(desc(schema.collections.updatedAt));
    const movies = await this.movies.byIds(rows.map((r) => r.movieId));
    const byId = new Map(movies.map((m) => [m.id, m]));
    return rows
      .filter((r) => byId.has(r.movieId))
      .map((r) => ({
        movie: byId.get(r.movieId)!,
        status: r.status,
        updatedAt: r.updatedAt.toISOString(),
      }));
  }
}

class DrizzleProgressRepository implements ProgressRepository {
  private db = getDb();
  constructor(private movies: DrizzleMovieRepository) {}

  async upsert(userId: string, progress: Omit<WatchProgress, "updatedAt">): Promise<void> {
    await this.db
      .insert(schema.watchProgress)
      .values({ userId, ...progress, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [schema.watchProgress.userId, schema.watchProgress.episodeId],
        set: { position: progress.position, duration: progress.duration, updatedAt: new Date() },
      });
  }

  async get(userId: string, episodeId: string): Promise<WatchProgress | null> {
    const rows = await this.db
      .select()
      .from(schema.watchProgress)
      .where(
        and(
          eq(schema.watchProgress.userId, userId),
          eq(schema.watchProgress.episodeId, episodeId),
        ),
      )
      .limit(1);
    if (!rows[0]) return null;
    return {
      episodeId: rows[0].episodeId,
      movieId: rows[0].movieId,
      position: rows[0].position,
      duration: rows[0].duration,
      updatedAt: rows[0].updatedAt.toISOString(),
    };
  }

  async continueWatching(userId: string, limit: number): Promise<ContinueWatchingEntry[]> {
    const rows = await this.db
      .select()
      .from(schema.watchProgress)
      .innerJoin(schema.episodes, eq(schema.watchProgress.episodeId, schema.episodes.id))
      .where(eq(schema.watchProgress.userId, userId))
      .orderBy(desc(schema.watchProgress.updatedAt))
      .limit(limit);

    const movies = await this.movies.byIds(rows.map((r) => r.watch_progress.movieId));
    const byId = new Map(movies.map((m) => [m.id, m]));
    return rows
      .filter((r) => byId.has(r.watch_progress.movieId))
      .map((r) => ({
        episodeId: r.watch_progress.episodeId,
        movieId: r.watch_progress.movieId,
        position: r.watch_progress.position,
        duration: r.watch_progress.duration,
        updatedAt: r.watch_progress.updatedAt.toISOString(),
        movie: byId.get(r.watch_progress.movieId)!,
        episode: toEpisode(r.episodes),
      }));
  }
}

export function createDrizzleRepositories(): Repositories {
  const movies = new DrizzleMovieRepository();
  return {
    movies,
    users: new DrizzleUserRepository(),
    collections: new DrizzleCollectionRepository(movies),
    progress: new DrizzleProgressRepository(movies),
  };
}
