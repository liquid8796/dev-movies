import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { MovieGrid } from "@/components/movies/MovieGrid";
import { searchMovies } from "@/server/services/movie.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Tìm kiếm" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const movies = query ? await searchMovies(query, 48) : [];

  return (
    <div className="container-page pb-8 pt-8">
      <h1 className="heading-section text-2xl">Tìm kiếm</h1>
      <p className="mt-1 text-sm text-dim">
        {query ? (
          <>
            {movies.length} kết quả cho “<span className="text-ink">{query}</span>”
          </>
        ) : (
          "Nhập từ khóa để tìm phim."
        )}
      </p>

      <div className="mt-6">
        {query && movies.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-line py-20 text-center">
            <SearchX className="size-10 text-dim" />
            <p className="mt-3 text-dim">Không tìm thấy phim nào. Thử từ khóa khác nhé.</p>
          </div>
        ) : (
          <MovieGrid movies={movies} emptyMessage="Nhập từ khóa vào ô tìm kiếm phía trên." />
        )}
      </div>
    </div>
  );
}
