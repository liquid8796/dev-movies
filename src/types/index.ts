/** Shared domain types used by both server and client code. */

export type MovieType = "single" | "series";

export type StreamType = "mp4" | "hls";

export type CollectionStatus = "watching" | "wishlist" | "watched";

export interface Genre {
  slug: string;
  name: string;
}

export interface Movie {
  id: string;
  slug: string;
  title: string;
  originalTitle: string;
  description: string;
  type: MovieType;
  posterUrl: string;
  backdropUrl: string;
  year: number;
  /** Runtime in minutes (per-episode for series). */
  duration: number;
  /** Country code, see COUNTRIES in lib/constants. */
  country: string;
  quality: "4K" | "FHD" | "HD" | "CAM";
  rating: number;
  views: number;
  featured: boolean;
  genres: Genre[];
  episodeCount: number;
  createdAt: string;
}

export interface Episode {
  id: string;
  movieId: string;
  season: number;
  number: number;
  title: string;
  duration: number;
  sourceType: StreamType;
}

export interface MovieDetail extends Movie {
  episodes: Episode[];
}

export interface CollectionEntry {
  movie: Movie;
  status: CollectionStatus;
  updatedAt: string;
}

export interface WatchProgress {
  episodeId: string;
  movieId: string;
  position: number;
  duration: number;
  updatedAt: string;
}

export interface ContinueWatchingEntry extends WatchProgress {
  movie: Movie;
  episode: Episode;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export type SortKey = "updated" | "year" | "views" | "rating";

export interface ListParams {
  type?: MovieType;
  genre?: string;
  country?: string;
  year?: number;
  /** Duration bucket: "short" (<90m), "medium" (90-120m), "long" (>120m). */
  durationBucket?: "short" | "medium" | "long";
  sort?: SortKey;
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StreamSource {
  url: string;
  type: StreamType;
  /** Where the bytes come from — useful for diagnostics. */
  origin: "onedrive" | "fallback";
}
