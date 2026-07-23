import { NextResponse } from "next/server";
import { searchMovies } from "@/server/services/movie.service";

/** GET /api/search?q= — lightweight payload for the live search overlay. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.trim().length < 2) return NextResponse.json({ items: [] });

  const movies = await searchMovies(q, 8);
  return NextResponse.json(
    {
      items: movies.map((m) => ({
        slug: m.slug,
        title: m.title,
        originalTitle: m.originalTitle,
        posterUrl: m.posterUrl,
        year: m.year,
        type: m.type,
        quality: m.quality,
      })),
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
