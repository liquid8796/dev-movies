import Image from "next/image";
import Link from "next/link";
import { Play, Star } from "lucide-react";
import type { Movie } from "@/types";
import { cn } from "@/lib/utils";

interface MovieCardProps {
  movie: Movie;
  /** Rendering hint for next/image priority above the fold. */
  priority?: boolean;
  className?: string;
}

export function MovieCard({ movie, priority, className }: MovieCardProps) {
  return (
    <Link
      href={`/movie/${movie.slug}`}
      className={cn("group block outline-none", className)}
      aria-label={movie.title}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-night-800 ring-1 ring-line/60 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-black/50 group-hover:ring-neon/50 group-focus-visible:ring-2 group-focus-visible:ring-neon">
        <Image
          src={movie.posterUrl}
          alt={movie.title}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-107"
        />

        {/* Hover overlay with play button */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-night-950/90 via-night-950/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="grid size-14 scale-75 place-items-center rounded-full bg-neon/90 text-white shadow-xl shadow-neon/40 transition-transform duration-300 group-hover:scale-100">
            <Play className="ml-0.5 size-6 fill-current" />
          </span>
        </div>

        {/* Badges */}
        <div className="absolute left-2 top-2 flex gap-1.5">
          <span className="rounded-md bg-night-950/80 px-1.5 py-0.5 text-[11px] font-bold text-gold backdrop-blur-sm">
            {movie.quality}
          </span>
        </div>
        <div className="absolute right-2 top-2">
          <span className="flex items-center gap-1 rounded-md bg-night-950/80 px-1.5 py-0.5 text-[11px] font-semibold text-ink backdrop-blur-sm">
            <Star className="size-3 fill-gold text-gold" />
            {movie.rating.toFixed(1)}
          </span>
        </div>

        {/* Episode/year ribbon */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-night-950/95 to-transparent px-2.5 pb-2 pt-8 text-[11px] font-medium text-ink/90">
          <span>
            {movie.type === "series"
              ? `${movie.episodeCount} tập`
              : `${movie.duration} phút`}
          </span>
          <span>{movie.year}</span>
        </div>
      </div>

      <div className="mt-2.5 px-0.5">
        <p className="truncate text-sm font-semibold text-ink transition-colors group-hover:text-gold">
          {movie.title}
        </p>
        <p className="truncate text-[13px] text-dim">{movie.originalTitle}</p>
      </div>
    </Link>
  );
}
