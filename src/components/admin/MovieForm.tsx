"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { saveMovieAction, type AdminActionState } from "@/server/actions/admin.actions";
import type { AdminEpisodeInput, AdminMovieDetail } from "@/server/repositories/types";
import { COUNTRIES, GENRES } from "@/lib/constants";
import { cn, slugify } from "@/lib/utils";

interface MovieFormProps {
  /** Existing movie for edit mode; null for create mode. */
  initial: AdminMovieDetail | null;
}

const inputClass =
  "h-10 w-full rounded-lg border border-line bg-night-800 px-3 text-sm text-ink outline-none transition-colors placeholder:text-dim/40 focus:border-gold";
const labelClass = "mb-1.5 block text-[13px] font-semibold text-ink";

function newEpisode(number: number): AdminEpisodeInput {
  return {
    season: 1,
    number,
    title: "",
    duration: 0,
    sourceType: "mp4",
    oneDrivePath: null,
    fallbackUrl: null,
  };
}

export function MovieForm({ initial }: MovieFormProps) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    saveMovieAction,
    {},
  );

  const movie = initial?.movie ?? null;
  const [title, setTitle] = useState(movie?.title ?? "");
  const [slug, setSlug] = useState(movie?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(movie));
  const [type, setType] = useState<"single" | "series">(movie?.type ?? "single");
  const [episodes, setEpisodes] = useState<AdminEpisodeInput[]>(
    initial?.episodes?.length ? initial.episodes : [newEpisode(1)],
  );

  const effectiveSlug = slugTouched && slug ? slug : slugify(title);
  const episodesJson = useMemo(() => JSON.stringify(episodes), [episodes]);

  const updateEpisode = (index: number, patch: Partial<AdminEpisodeInput>) => {
    setEpisodes((prev) => prev.map((ep, i) => (i === index ? { ...ep, ...patch } : ep)));
  };

  const addEpisode = () => {
    setEpisodes((prev) => [...prev, newEpisode(prev.length + 1)]);
  };

  const removeEpisode = (index: number) => {
    setEpisodes((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const switchType = (next: "single" | "series") => {
    setType(next);
    // A single movie has exactly one "Bản Full" episode.
    if (next === "single") setEpisodes((prev) => [prev[0] ?? newEpisode(1)]);
  };

  return (
    <form action={formAction} className="space-y-8">
      {movie && <input type="hidden" name="id" value={movie.id} />}
      <input type="hidden" name="episodes" value={episodesJson} />

      {/* Basic info */}
      <section className="rounded-2xl border border-line bg-night-900/60 p-5">
        <h2 className="heading-section mb-4 text-base">Thông tin phim</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Tên phim (tiếng Việt) *</span>
            <input
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Phàm Nhân Tu Tiên Truyện"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Tên gốc</span>
            <input
              name="originalTitle"
              defaultValue={movie?.originalTitle ?? ""}
              placeholder="The Immortal Ascension"
              className={inputClass}
            />
          </label>
          <label className="block md:col-span-2">
            <span className={labelClass}>Slug (đường dẫn)</span>
            <input
              name="slug"
              value={effectiveSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="tự tạo từ tên phim"
              className={cn(inputClass, "font-mono")}
            />
          </label>
          <label className="block md:col-span-2">
            <span className={labelClass}>Nội dung phim</span>
            <textarea
              name="description"
              rows={4}
              defaultValue={movie?.description ?? ""}
              placeholder="Tóm tắt nội dung..."
              className={cn(inputClass, "h-auto py-2.5 leading-relaxed")}
            />
          </label>

          <label className="block">
            <span className={labelClass}>Loại phim *</span>
            <select
              name="type"
              value={type}
              onChange={(e) => switchType(e.target.value as "single" | "series")}
              className={inputClass}
            >
              <option value="single">Phim Lẻ</option>
              <option value="series">Phim Bộ</option>
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Quốc gia *</span>
            <select name="country" defaultValue={movie?.country ?? "us"} className={inputClass}>
              {Object.entries(COUNTRIES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Năm sản xuất *</span>
            <input
              name="year"
              type="number"
              required
              min={1900}
              max={2100}
              defaultValue={movie?.year ?? new Date().getFullYear()}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Thời lượng (phút{type === "series" ? "/tập" : ""})</span>
            <input
              name="duration"
              type="number"
              min={0}
              defaultValue={movie?.duration ?? 0}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Chất lượng</span>
            <select name="quality" defaultValue={movie?.quality ?? "FHD"} className={inputClass}>
              {["4K", "FHD", "HD", "CAM"].map((quality) => (
                <option key={quality} value={quality}>
                  {quality}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Điểm đánh giá (0–10)</span>
            <input
              name="rating"
              type="number"
              step="0.1"
              min={0}
              max={10}
              defaultValue={movie?.rating ?? 7}
              className={inputClass}
            />
          </label>
        </div>

        <label className="mt-4 flex items-center gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={movie?.featured ?? false}
            className="size-4 accent-gold"
          />
          Đưa vào mục <span className="font-semibold text-gold">Phim Đề Cử</span> (hero banner)
        </label>
      </section>

      {/* Genres */}
      <section className="rounded-2xl border border-line bg-night-900/60 p-5">
        <h2 className="heading-section mb-4 text-base">Thể loại *</h2>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <label
              key={genre.slug}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-night-800 px-3.5 py-2 text-sm text-dim transition-colors has-checked:border-gold/60 has-checked:text-gold"
            >
              <input
                type="checkbox"
                name="genres"
                value={genre.slug}
                defaultChecked={movie?.genres.some((g) => g.slug === genre.slug) ?? false}
                className="size-3.5 accent-gold"
              />
              {genre.name}
            </label>
          ))}
        </div>
      </section>

      {/* Artwork */}
      <section className="rounded-2xl border border-line bg-night-900/60 p-5">
        <h2 className="heading-section mb-4 text-base">Hình ảnh</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className={labelClass}>URL Poster (dọc 2:3)</span>
            <input
              name="posterUrl"
              defaultValue={movie?.posterUrl ?? ""}
              placeholder="/posters/ten-phim.jpg hoặc URL Blob/CDN"
              className={cn(inputClass, "font-mono text-xs")}
            />
          </label>
          <label className="block">
            <span className={labelClass}>URL Backdrop (ngang 16:9)</span>
            <input
              name="backdropUrl"
              defaultValue={movie?.backdropUrl ?? ""}
              placeholder="/backdrops/ten-phim.jpg hoặc URL Blob/CDN"
              className={cn(inputClass, "font-mono text-xs")}
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-dim">
          Để trống sẽ dùng ảnh mặc định. Có thể upload lên Vercel Blob qua{" "}
          <code className="rounded bg-night-800 px-1.5 py-0.5">POST /api/upload</code> rồi dán URL.
        </p>
      </section>

      {/* Episodes */}
      <section className="rounded-2xl border border-line bg-night-900/60 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="heading-section text-base">
            {type === "series" ? `Danh sách tập (${episodes.length})` : "Nguồn phát"}
          </h2>
          {type === "series" && (
            <button
              type="button"
              onClick={addEpisode}
              className="flex items-center gap-1.5 rounded-full border border-gold/50 px-3.5 py-1.5 text-sm font-semibold text-gold transition-colors hover:bg-gold/10"
            >
              <Plus className="size-4" /> Thêm tập
            </button>
          )}
        </div>

        <div className="space-y-3">
          {episodes.map((ep, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-xl border border-line/70 bg-night-800/50 p-3 md:grid-cols-[70px_1fr_90px_100px_1fr_1fr_40px]"
            >
              <label className="block">
                <span className={labelClass}>Tập</span>
                <input
                  type="number"
                  min={1}
                  value={ep.number}
                  onChange={(e) => updateEpisode(index, { number: Number(e.target.value) })}
                  className={inputClass}
                  disabled={type === "single"}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Tiêu đề tập</span>
                <input
                  value={ep.title}
                  onChange={(e) => updateEpisode(index, { title: e.target.value })}
                  placeholder={type === "series" ? `Tập ${ep.number}` : "Bản Full"}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Phút</span>
                <input
                  type="number"
                  min={0}
                  value={ep.duration || ""}
                  onChange={(e) => updateEpisode(index, { duration: Number(e.target.value) })}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Định dạng</span>
                <select
                  value={ep.sourceType}
                  onChange={(e) =>
                    updateEpisode(index, { sourceType: e.target.value as "mp4" | "hls" })
                  }
                  className={inputClass}
                >
                  <option value="mp4">MP4</option>
                  <option value="hls">HLS</option>
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>OneDrive path</span>
                <input
                  value={ep.oneDrivePath ?? ""}
                  onChange={(e) => updateEpisode(index, { oneDrivePath: e.target.value || null })}
                  placeholder="Movies/ten-phim/e01.mp4"
                  className={cn(inputClass, "font-mono text-xs")}
                />
              </label>
              <label className="block">
                <span className={labelClass}>URL dự phòng</span>
                <input
                  value={ep.fallbackUrl ?? ""}
                  onChange={(e) => updateEpisode(index, { fallbackUrl: e.target.value || null })}
                  placeholder="https://..."
                  className={cn(inputClass, "font-mono text-xs")}
                />
              </label>
              <div className="flex items-end pb-0.5">
                {type === "series" && (
                  <button
                    type="button"
                    onClick={() => removeEpisode(index)}
                    disabled={episodes.length <= 1}
                    aria-label={`Xóa tập ${ep.number}`}
                    className="grid size-10 place-items-center rounded-lg border border-line text-dim transition-colors hover:border-neon/60 hover:text-neon disabled:opacity-40"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-dim">
          Mỗi tập cần <span className="text-ink">OneDrive path</span> (ưu tiên) hoặc{" "}
          <span className="text-ink">URL dự phòng</span>. Khi OneDrive được cấu hình, hệ thống tự
          stream từ OneDrive.
        </p>
      </section>

      {state.error && (
        <p className="rounded-xl border border-neon/30 bg-neon/10 px-4 py-3 text-sm text-neon">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-night-950 shadow-lg shadow-gold/20 transition-all hover:brightness-110 disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {movie ? "Lưu thay đổi" : "Thêm phim"}
        </button>
        <Link
          href="/admin"
          className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-dim transition-colors hover:border-night-600 hover:text-ink"
        >
          Hủy
        </Link>
      </div>
    </form>
  );
}
