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

/**
 * Repository interfaces — the only contract the service layer depends on.
 * Two implementations exist: Drizzle/Neon (production) and in-memory (demo).
 * Adding a new backing store only requires implementing these interfaces.
 */

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  image: string | null;
  balance: number;
  inviteCode: string | null;
  createdAt: string;
}

/** Episode payload for admin create/update. */
export interface AdminEpisodeInput {
  season: number;
  number: number;
  title: string;
  duration: number;
  sourceType: "mp4" | "hls";
  oneDrivePath: string | null;
  fallbackUrl: string | null;
}

/** Movie payload for admin create/update. */
export interface AdminMovieInput {
  slug: string;
  title: string;
  originalTitle: string;
  description: string;
  type: MovieType;
  posterUrl: string;
  backdropUrl: string;
  year: number;
  duration: number;
  country: string;
  quality: string;
  rating: number;
  featured: boolean;
  genres: string[];
  episodes: AdminEpisodeInput[];
}

/** Admin edit view: movie detail + raw episode sources. */
export interface AdminMovieDetail {
  movie: MovieDetail;
  episodes: AdminEpisodeInput[];
}

export interface MovieRepository {
  list(params: ListParams): Promise<Paginated<Movie>>;
  featured(limit: number): Promise<Movie[]>;
  latest(type: MovieType | undefined, limit: number): Promise<Movie[]>;
  bySlug(slug: string): Promise<MovieDetail | null>;
  byIds(ids: string[]): Promise<Movie[]>;
  related(movieId: string, genreSlugs: string[], limit: number): Promise<Movie[]>;
  search(query: string, limit: number): Promise<Movie[]>;
  episodeById(episodeId: string): Promise<{ episode: Episode; movie: Movie } | null>;
  incrementViews(movieId: string): Promise<void>;
  /** Raw source info needed by the streaming service. */
  episodeSource(episodeId: string): Promise<{
    id: string;
    sourceType: "mp4" | "hls";
    oneDriveItemId: string | null;
    oneDrivePath: string | null;
    fallbackUrl: string | null;
  } | null>;
  // --- Admin CRUD ---
  byId(id: string): Promise<Movie | null>;
  adminDetail(id: string): Promise<AdminMovieDetail | null>;
  create(input: AdminMovieInput): Promise<Movie>;
  update(id: string, input: AdminMovieInput): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface UserRepository {
  byEmail(email: string): Promise<UserRecord | null>;
  byId(id: string): Promise<UserRecord | null>;
  create(data: { name: string; email: string; passwordHash: string }): Promise<UserRecord>;
  updateProfile(id: string, data: { name?: string; email?: string }): Promise<void>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  setInviteCode(id: string, code: string): Promise<void>;
}

export interface CollectionRepository {
  get(userId: string, movieId: string): Promise<CollectionStatus | null>;
  set(userId: string, movieId: string, status: CollectionStatus | null): Promise<void>;
  listByUser(userId: string, status?: CollectionStatus): Promise<CollectionEntry[]>;
}

export interface ProgressRepository {
  upsert(userId: string, progress: Omit<WatchProgress, "updatedAt">): Promise<void>;
  get(userId: string, episodeId: string): Promise<WatchProgress | null>;
  continueWatching(userId: string, limit: number): Promise<ContinueWatchingEntry[]>;
}

export interface Repositories {
  movies: MovieRepository;
  users: UserRepository;
  collections: CollectionRepository;
  progress: ProgressRepository;
}
