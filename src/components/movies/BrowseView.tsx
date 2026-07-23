import { Suspense } from "react";
import { FilterBar } from "@/components/movies/FilterBar";
import { MovieGrid } from "@/components/movies/MovieGrid";
import { Pagination } from "@/components/movies/Pagination";
import { listMovies } from "@/server/services/movie.service";
import type { ListParams, MovieType, SortKey } from "@/types";

export interface BrowseSearchParams {
  [key: string]: string | string[] | undefined;
}

interface BrowseViewProps {
  title: string;
  basePath: string;
  searchParams: BrowseSearchParams;
  /** Fixes the type (e.g. /movies, /series) and hides the type filter. */
  fixedType?: MovieType;
}

function str(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function parseListParams(
  searchParams: BrowseSearchParams,
  fixedType?: MovieType,
): ListParams {
  const type = fixedType ?? (str(searchParams.type) as MovieType | undefined);
  const sort = str(searchParams.sort) as SortKey | undefined;
  const year = Number(str(searchParams.year));
  const bucket = str(searchParams.duration);
  return {
    type: type === "single" || type === "series" ? type : undefined,
    genre: str(searchParams.genre),
    country: str(searchParams.country),
    year: Number.isFinite(year) && year > 1900 ? year : undefined,
    durationBucket:
      bucket === "short" || bucket === "medium" || bucket === "long" ? bucket : undefined,
    sort: sort === "year" || sort === "views" || sort === "rating" ? sort : "updated",
    page: Math.max(1, Number(str(searchParams.page)) || 1),
  };
}

export async function BrowseView({ title, basePath, searchParams, fixedType }: BrowseViewProps) {
  const params = parseListParams(searchParams, fixedType);
  const result = await listMovies(params);

  const hrefFor = (page: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === "string" && value && key !== "page") query.set(key, value);
    }
    if (page > 1) query.set("page", String(page));
    const qs = query.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="pb-8 pt-2">
      <Suspense>
        <FilterBar lockType={Boolean(fixedType)} basePath={basePath} />
      </Suspense>

      <div className="container-page mt-8">
        <div className="mb-5 flex items-baseline justify-between">
          <h1 className="heading-section text-2xl">{title}</h1>
          <p className="text-sm text-dim">{result.total} phim</p>
        </div>

        <MovieGrid movies={result.items} emptyMessage="Không tìm thấy phim phù hợp với bộ lọc." />
        <Pagination page={result.page} totalPages={result.totalPages} hrefFor={hrefFor} />
      </div>
    </div>
  );
}
