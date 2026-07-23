import { Suspense } from "react";
import { HeroBanner } from "@/components/home/HeroBanner";
import { FilterBar } from "@/components/movies/FilterBar";
import { MovieCarousel } from "@/components/movies/MovieCarousel";
import { getHomeSections } from "@/server/services/movie.service";
import { getTrending } from "@/server/services/trending.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [sections, trending] = await Promise.all([getHomeSections(), getTrending(18)]);

  return (
    <div className="pb-8">
      <HeroBanner movies={sections.featured} />

      <Suspense>
        <FilterBar basePath="/browse" />
      </Suspense>

      <MovieCarousel title="Phim Đề Cử" movies={sections.featured} priority />
      <MovieCarousel title="Phim Lẻ Mới" movies={sections.latestSingles} />
      <MovieCarousel title="Phim Bộ Mới" movies={sections.latestSeries} />
      <MovieCarousel title="Xem Nhiều Trong Tuần" movies={trending} />
      <MovieCarousel title="Đánh Giá Cao" movies={sections.topRated} />
    </div>
  );
}
