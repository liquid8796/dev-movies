"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Info, Play, Star } from "lucide-react";
import type { Movie } from "@/types";
import { countryName } from "@/lib/constants";
import { cn, formatDuration } from "@/lib/utils";

interface HeroBannerProps {
  movies: Movie[];
}

const ROTATE_MS = 6500;

/** Auto-rotating hero spotlight for featured movies. */
export function HeroBanner({ movies }: HeroBannerProps) {
  const items = movies.slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % items.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [paused, items.length]);

  if (items.length === 0) return null;

  return (
    <section
      className="relative h-[62vh] min-h-[420px] w-full overflow-hidden md:h-[70vh]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Phim nổi bật"
    >
      {items.map((movie, i) => (
        <div
          key={movie.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            i === index ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <Image
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover"
          />
          {/* Cinematic gradient stack */}
          <div className="absolute inset-0 bg-gradient-to-r from-night-950 via-night-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-night-950 via-transparent to-night-950/40" />

          <div className="container-page absolute inset-0 flex flex-col justify-center">
            <div className={cn("max-w-xl", i === index && "animate-fade-up")}>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-md bg-neon px-2 py-0.5 text-xs font-bold text-white">
                  {movie.quality}
                </span>
                <span className="flex items-center gap-1 font-semibold text-gold">
                  <Star className="size-4 fill-current" /> {movie.rating.toFixed(1)}
                </span>
                <span className="text-dim">{movie.year}</span>
                <span className="text-dim">·</span>
                <span className="text-dim">
                  {movie.type === "series"
                    ? `${movie.episodeCount} tập`
                    : formatDuration(movie.duration)}
                </span>
                <span className="text-dim">·</span>
                <span className="text-dim">{countryName(movie.country)}</span>
              </div>

              <h1 className="text-3xl font-extrabold leading-tight text-ink md:text-5xl">
                {movie.title}
              </h1>
              <p className="mt-1 text-base font-medium text-dim md:text-lg">
                {movie.originalTitle}
              </p>

              <p className="mt-4 line-clamp-3 max-w-lg text-sm leading-relaxed text-ink/80 md:text-base">
                {movie.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {movie.genres.slice(0, 4).map((g) => (
                  <Link
                    key={g.slug}
                    href={`/browse?genre=${g.slug}`}
                    className="rounded-full border border-line bg-night-900/60 px-3 py-1 text-xs text-dim backdrop-blur-sm transition-colors hover:border-neon/50 hover:text-ink"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <Link
                  href={`/watch/${movie.slug}`}
                  className="flex items-center gap-2 rounded-full bg-neon px-6 py-3 text-sm font-bold text-white shadow-xl shadow-neon/30 transition-all hover:scale-105 hover:brightness-110"
                >
                  <Play className="size-4.5 fill-current" /> Xem Ngay
                </Link>
                <Link
                  href={`/movie/${movie.slug}`}
                  className="flex items-center gap-2 rounded-full border border-line bg-night-900/70 px-6 py-3 text-sm font-semibold text-ink backdrop-blur-sm transition-colors hover:border-night-600 hover:bg-night-800"
                >
                  <Info className="size-4.5" /> Chi Tiết
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Dots */}
      {items.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {items.map((movie, i) => (
            <button
              key={movie.id}
              type="button"
              aria-label={`Chuyển đến ${movie.title}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-8 bg-gold" : "w-3 bg-white/30 hover:bg-white/50",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
