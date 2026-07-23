import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    image: text("image"),
    balance: integer("balance").notNull().default(0),
    inviteCode: text("invite_code"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const movies = pgTable(
  "movies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    originalTitle: text("original_title").notNull().default(""),
    description: text("description").notNull().default(""),
    type: text("type", { enum: ["single", "series"] }).notNull(),
    posterUrl: text("poster_url").notNull().default(""),
    backdropUrl: text("backdrop_url").notNull().default(""),
    year: integer("year").notNull(),
    duration: integer("duration").notNull().default(0),
    country: text("country").notNull().default("us"),
    quality: text("quality").notNull().default("FHD"),
    rating: real("rating").notNull().default(0),
    views: integer("views").notNull().default(0),
    featured: boolean("featured").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("movies_slug_idx").on(t.slug),
    index("movies_type_idx").on(t.type),
    index("movies_year_idx").on(t.year),
    index("movies_updated_idx").on(t.updatedAt),
  ],
);

export const genres = pgTable("genres", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
});

export const movieGenres = pgTable(
  "movie_genres",
  {
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    genreSlug: text("genre_slug")
      .notNull()
      .references(() => genres.slug, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.movieId, t.genreSlug] })],
);

export const episodes = pgTable(
  "episodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    season: integer("season").notNull().default(1),
    number: integer("number").notNull(),
    title: text("title").notNull().default(""),
    duration: integer("duration").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("episodes_movie_idx").on(t.movieId)],
);

/** One playable variant of an episode per resolution (4K/1080p/720p/360p). */
export const episodeSources = pgTable(
  "episode_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    episodeId: uuid("episode_id")
      .notNull()
      .references(() => episodes.id, { onDelete: "cascade" }),
    resolution: text("resolution", { enum: ["2160p", "1080p", "720p", "360p"] }).notNull(),
    sourceType: text("source_type", { enum: ["mp4", "hls"] }).notNull().default("mp4"),
    /** OneDrive item id — preferred lookup when present. */
    oneDriveItemId: text("onedrive_item_id"),
    /** Path of the file inside the drive, e.g. "Movies/silo/2160p/e01.mp4". */
    oneDrivePath: text("onedrive_path"),
    /** Public demo/backup URL used when OneDrive is not configured. */
    fallbackUrl: text("fallback_url"),
  },
  (t) => [uniqueIndex("episode_sources_ep_res_idx").on(t.episodeId, t.resolution)],
);

export const collections = pgTable(
  "collections",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["watching", "wishlist", "watched"] }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.movieId] })],
);

export const watchProgress = pgTable(
  "watch_progress",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    episodeId: uuid("episode_id")
      .notNull()
      .references(() => episodes.id, { onDelete: "cascade" }),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    position: real("position").notNull().default(0),
    duration: real("duration").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.episodeId] }),
    index("progress_user_updated_idx").on(t.userId, t.updatedAt),
  ],
);
