import type { Metadata } from "next";
import { Flame } from "lucide-react";
import { MovieGrid } from "@/components/movies/MovieGrid";
import { getTrending } from "@/server/services/trending.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trending",
  description: "Những bộ phim được xem nhiều nhất tuần này.",
};

export default async function TrendingPage() {
  const movies = await getTrending(24);

  return (
    <div className="container-page pb-8 pt-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-neon/15 text-neon">
          <Flame className="size-6" />
        </span>
        <div>
          <h1 className="heading-section text-2xl">Trending</h1>
          <p className="text-sm text-dim">Được xem nhiều nhất trong tuần</p>
        </div>
      </div>
      <MovieGrid movies={movies} />
    </div>
  );
}
