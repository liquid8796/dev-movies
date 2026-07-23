import type { Movie } from "@/types";
import { MovieCard } from "./MovieCard";

interface MovieGridProps {
  movies: Movie[];
  emptyMessage?: string;
}

export function MovieGrid({ movies, emptyMessage = "Không có phim nào." }: MovieGridProps) {
  if (movies.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line py-20 text-center text-dim">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
