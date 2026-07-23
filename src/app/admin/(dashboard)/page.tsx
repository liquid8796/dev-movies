import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Pencil, Plus, Search, Star } from "lucide-react";
import { DeleteMovieButton } from "@/components/admin/DeleteMovieButton";
import { countryName } from "@/lib/constants";
import { formatViews } from "@/lib/utils";
import { requireAdmin } from "@/server/admin";
import { listMoviesForAdmin } from "@/server/services/admin.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Quản lý phim" };

export default async function AdminMoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; saved?: string }>;
}) {
  await requireAdmin();
  const { q = "", saved } = await searchParams;
  const movies = await listMoviesForAdmin(q);

  return (
    <div>
      {saved === "1" && (
        <p className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          <CheckCircle2 className="size-4.5" /> Đã lưu phim thành công.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="heading-section text-xl">Quản lý phim ({movies.length})</h1>
        <div className="flex items-center gap-3">
          <form action="/admin" className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dim" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Tìm phim theo tên..."
              className="h-10 w-64 rounded-full border border-line bg-night-800 pl-9 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-dim/50 focus:border-gold"
            />
          </form>
          <Link
            href="/admin/movies/new"
            className="flex items-center gap-2 rounded-full bg-gold px-4 py-2.5 text-sm font-bold text-night-950 transition-all hover:brightness-110"
          >
            <Plus className="size-4.5" /> Thêm phim
          </Link>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-line bg-night-900/80 text-left text-xs uppercase tracking-wide text-dim">
              <th className="px-4 py-3 font-semibold">Phim</th>
              <th className="px-4 py-3 font-semibold">Loại</th>
              <th className="px-4 py-3 font-semibold">Năm</th>
              <th className="px-4 py-3 font-semibold">Quốc gia</th>
              <th className="px-4 py-3 font-semibold">Chất lượng</th>
              <th className="px-4 py-3 font-semibold">Điểm</th>
              <th className="px-4 py-3 font-semibold">Lượt xem</th>
              <th className="px-4 py-3 font-semibold">Đề cử</th>
              <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {movies.map((movie) => (
              <tr key={movie.id} className="transition-colors hover:bg-night-900/60">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-night-800">
                      <Image
                        src={movie.posterUrl}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/movie/${movie.slug}`}
                        className="block max-w-[260px] truncate font-semibold text-ink hover:text-gold"
                      >
                        {movie.title}
                      </Link>
                      <p className="max-w-[260px] truncate text-xs text-dim">
                        {movie.originalTitle}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-dim">
                  {movie.type === "series" ? `Bộ · ${movie.episodeCount} tập` : "Lẻ"}
                </td>
                <td className="px-4 py-2.5 text-dim">{movie.year}</td>
                <td className="px-4 py-2.5 text-dim">{countryName(movie.country)}</td>
                <td className="px-4 py-2.5">
                  <span className="rounded-md bg-night-800 px-2 py-0.5 text-xs font-bold text-gold">
                    {movie.quality}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-dim">
                  <span className="flex items-center gap-1">
                    <Star className="size-3.5 fill-gold text-gold" /> {movie.rating.toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-dim">{formatViews(movie.views)}</td>
                <td className="px-4 py-2.5">{movie.featured ? "✓" : "—"}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/movies/${movie.id}`}
                      aria-label={`Sửa ${movie.title}`}
                      title="Sửa phim"
                      className="grid size-9 place-items-center rounded-lg border border-line text-dim transition-colors hover:border-gold/60 hover:text-gold"
                    >
                      <Pencil className="size-4" />
                    </Link>
                    <DeleteMovieButton movieId={movie.id} title={movie.title} />
                  </div>
                </td>
              </tr>
            ))}
            {movies.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-14 text-center text-dim">
                  {q ? `Không tìm thấy phim nào cho “${q}”.` : "Chưa có phim nào."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
