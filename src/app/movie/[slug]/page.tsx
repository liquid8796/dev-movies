import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, Eye, Globe, Play, Star } from "lucide-react";
import { auth } from "@/auth";
import { CollectionMenu } from "@/components/movie/CollectionMenu";
import { EpisodeGrid } from "@/components/movie/EpisodeGrid";
import { MovieCarousel } from "@/components/movies/MovieCarousel";
import { countryName } from "@/lib/constants";
import { formatDuration, formatViews } from "@/lib/utils";
import { getRepositories } from "@/server/repositories";
import { getMovieBySlug, getRelatedMovies } from "@/server/services/movie.service";

export const dynamic = "force-dynamic";

interface MoviePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);
  if (!movie) return { title: "Không tìm thấy phim" };
  return {
    title: `${movie.title} (${movie.originalTitle})`,
    description: movie.description.slice(0, 160),
    openGraph: { images: [movie.posterUrl] },
  };
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { slug } = await params;
  const [movie, session] = await Promise.all([getMovieBySlug(slug), auth()]);
  if (!movie) notFound();

  const userId = session?.user?.id;
  const [related, collectionStatus] = await Promise.all([
    getRelatedMovies(movie),
    userId ? getRepositories().collections.get(userId, movie.id) : Promise.resolve(null),
  ]);

  const facts = [
    { icon: Calendar, label: String(movie.year) },
    {
      icon: Clock,
      label:
        movie.type === "series" ? `${movie.episodeCount} tập` : formatDuration(movie.duration),
    },
    { icon: Globe, label: countryName(movie.country) },
    { icon: Eye, label: `${formatViews(movie.views)} lượt xem` },
  ];

  return (
    <div className="pb-8">
      {/* Backdrop hero */}
      <div className="relative h-[300px] w-full overflow-hidden md:h-[420px]">
        <Image
          src={movie.backdropUrl || movie.posterUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night-950 via-night-950/40 to-night-950/20" />
      </div>

      <div className="container-page relative z-10 -mt-36 md:-mt-44">
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Poster */}
          <div className="mx-auto w-52 shrink-0 md:mx-0 md:w-64">
            <div className="animate-fade-up relative aspect-[2/3] overflow-hidden rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-line">
              <Image
                src={movie.posterUrl}
                alt={movie.title}
                fill
                priority
                sizes="(max-width: 768px) 208px, 256px"
                className="object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div className="animate-fade-up flex-1 md:pt-24" style={{ animationDelay: "80ms" }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-neon px-2 py-0.5 text-xs font-bold text-white">
                {movie.quality}
              </span>
              <span className="rounded-md bg-night-800 px-2 py-0.5 text-xs font-semibold text-dim">
                {movie.type === "series" ? "Phim Bộ" : "Phim Lẻ"}
              </span>
              <span className="flex items-center gap-1 text-sm font-bold text-gold">
                <Star className="size-4 fill-current" /> {movie.rating.toFixed(1)}
                <span className="font-normal text-dim">/10</span>
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-extrabold text-ink md:text-4xl">{movie.title}</h1>
            <p className="mt-1 text-lg text-dim">{movie.originalTitle}</p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-dim">
              {facts.map((fact) => (
                <span key={fact.label} className="flex items-center gap-1.5">
                  <fact.icon className="size-4" /> {fact.label}
                </span>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <Link
                  key={genre.slug}
                  href={`/browse?genre=${genre.slug}`}
                  className="rounded-full border border-line bg-night-900/70 px-3 py-1 text-xs text-dim transition-colors hover:border-neon/50 hover:text-ink"
                >
                  {genre.name}
                </Link>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={`/watch/${movie.slug}`}
                className="flex items-center gap-2 rounded-full bg-neon px-6 py-3 text-sm font-bold text-white shadow-xl shadow-neon/30 transition-all hover:scale-105 hover:brightness-110"
              >
                <Play className="size-4.5 fill-current" /> Xem Ngay
              </Link>
              <CollectionMenu
                movieId={movie.id}
                initialStatus={collectionStatus}
                isAuthenticated={Boolean(userId)}
              />
            </div>

            <div className="mt-7 max-w-3xl">
              <h2 className="heading-section mb-2 text-lg">Nội dung phim</h2>
              <p className="leading-relaxed text-ink/80">{movie.description}</p>
            </div>
          </div>
        </div>

        {/* Episodes */}
        {movie.type === "series" && (
          <div className="mt-10">
            <EpisodeGrid slug={movie.slug} episodes={movie.episodes} />
          </div>
        )}
      </div>

      {related.length > 0 && <MovieCarousel title="Có Thể Bạn Thích" movies={related} />}
    </div>
  );
}
