import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Star } from "lucide-react";
import { auth } from "@/auth";
import { EpisodeGrid } from "@/components/movie/EpisodeGrid";
import { MovieCarousel } from "@/components/movies/MovieCarousel";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { countryName, resolutionLabel } from "@/lib/constants";
import { formatDuration } from "@/lib/utils";
import { getRepositories } from "@/server/repositories";
import { getMovieBySlug, getRelatedMovies } from "@/server/services/movie.service";
import { recordView } from "@/server/services/trending.service";

export const dynamic = "force-dynamic";

interface WatchPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ep?: string }>;
}

export async function generateMetadata({ params, searchParams }: WatchPageProps): Promise<Metadata> {
  const [{ slug }, { ep }] = await Promise.all([params, searchParams]);
  const movie = await getMovieBySlug(slug);
  if (!movie) return { title: "Không tìm thấy phim" };
  const suffix = movie.type === "series" && ep ? ` - Tập ${ep}` : "";
  return { title: `Xem ${movie.title}${suffix}` };
}

export default async function WatchPage({ params, searchParams }: WatchPageProps) {
  const [{ slug }, { ep }, session] = await Promise.all([params, searchParams, auth()]);
  const movie = await getMovieBySlug(slug);
  if (!movie || movie.episodes.length === 0) notFound();

  const epNumber = Math.max(1, Number(ep) || 1);
  const episode =
    movie.episodes.find((e) => e.number === epNumber) ?? movie.episodes[0];
  const nextEpisode = movie.episodes.find((e) => e.number === episode.number + 1) ?? null;

  const userId = session?.user?.id;
  const [progress, related] = await Promise.all([
    userId
      ? getRepositories().progress.get(userId, episode.id)
      : Promise.resolve(null),
    getRelatedMovies(movie),
    recordView(movie.id),
  ]);

  const episodeLabel = movie.type === "series" ? `Tập ${episode.number}` : "";

  return (
    <div className="pb-8">
      <div className="container-page pt-4">
        <Link
          href={`/movie/${movie.slug}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-dim transition-colors hover:text-ink"
        >
          <ChevronLeft className="size-4" /> Về trang phim
        </Link>

        <VideoPlayer
          key={episode.id}
          episodeId={episode.id}
          movieId={movie.id}
          poster={movie.backdropUrl || undefined}
          title={movie.title}
          subtitle={episodeLabel || movie.originalTitle}
          initialPosition={progress?.position ?? 0}
          nextHref={nextEpisode ? `/watch/${movie.slug}?ep=${nextEpisode.number}` : null}
          saveProgress={Boolean(userId)}
        />

        <div className="mt-6 flex flex-col gap-8 lg:flex-row">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold text-ink md:text-3xl">
              {movie.title} {episodeLabel && <span className="text-gold">— {episodeLabel}</span>}
            </h1>
            <p className="mt-1 text-dim">{movie.originalTitle}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-dim">
              <span className="flex items-center gap-1 font-semibold text-gold">
                <Star className="size-4 fill-current" /> {movie.rating.toFixed(1)}
              </span>
              <span>{movie.year}</span>
              <span>{countryName(movie.country)}</span>
              <span>
                {movie.type === "series"
                  ? `${movie.episodeCount} tập · ${formatDuration(movie.duration)}/tập`
                  : formatDuration(movie.duration)}
              </span>
              <span className="rounded-md bg-night-800 px-2 py-0.5 text-xs font-bold text-gold">
                {movie.quality}
              </span>
              {episode.sources.length > 1 && (
                <span className="text-xs text-dim">
                  ({episode.sources.map((s) => resolutionLabel(s.resolution)).join(" · ")})
                </span>
              )}
            </div>

            <p className="mt-4 max-w-3xl leading-relaxed text-ink/75">{movie.description}</p>

            {!userId && (
              <p className="mt-4 rounded-xl border border-line bg-night-900/70 px-4 py-3 text-sm text-dim">
                <Link href="/login" className="font-semibold text-neon hover:underline">
                  Đăng nhập
                </Link>{" "}
                để lưu tiến độ xem và tiếp tục từ vị trí đang dở trên mọi thiết bị.
              </p>
            )}
          </div>

          {movie.type === "series" && (
            <div className="w-full shrink-0 lg:w-[420px]">
              <EpisodeGrid
                slug={movie.slug}
                episodes={movie.episodes}
                currentNumber={episode.number}
              />
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && <MovieCarousel title="Có Thể Bạn Thích" movies={related} />}
    </div>
  );
}
