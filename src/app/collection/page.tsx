import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Play } from "lucide-react";
import { auth } from "@/auth";
import { MovieGrid } from "@/components/movies/MovieGrid";
import { cn, formatClock } from "@/lib/utils";
import { getRepositories } from "@/server/repositories";
import type { CollectionStatus } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Danh sách của tôi" };

const TABS: { key: string; label: string; status?: CollectionStatus }[] = [
  { key: "updates", label: "Cập Nhật" },
  { key: "watching", label: "Đang Xem", status: "watching" },
  { key: "wishlist", label: "Mong Muốn", status: "wishlist" },
  { key: "watched", label: "Đã Xem", status: "watched" },
];

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [session, { tab = "watching" }] = await Promise.all([auth(), searchParams]);
  if (!session?.user?.id) redirect("/login?next=/collection");

  const activeTab = TABS.find((t) => t.key === tab) ?? TABS[1];

  return (
    <div className="container-page pb-8 pt-8">
      <h1 className="text-center text-3xl font-extrabold text-ink md:text-4xl">
        Danh sách của tôi
      </h1>

      {/* Tabs */}
      <div className="mt-6 border-b border-line">
        <nav className="scrollbar-hide mx-auto flex max-w-3xl items-center justify-between gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/collection?tab=${t.key}`}
              className={cn(
                "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold uppercase tracking-wide transition-colors md:px-8",
                t.key === activeTab.key
                  ? "border-ink text-ink"
                  : "border-transparent text-dim hover:text-ink",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-8">
        {activeTab.key === "updates" ? (
          <ContinueWatching userId={session.user.id} />
        ) : (
          <CollectionTab userId={session.user.id} status={activeTab.status!} />
        )}
      </div>
    </div>
  );
}

async function CollectionTab({ userId, status }: { userId: string; status: CollectionStatus }) {
  const entries = await getRepositories().collections.listByUser(userId, status);
  return (
    <MovieGrid
      movies={entries.map((e) => e.movie)}
      emptyMessage="Chưa có phim nào trong danh sách này. Hãy thêm phim từ trang chi tiết nhé!"
    />
  );
}

async function ContinueWatching({ userId }: { userId: string }) {
  const entries = await getRepositories().progress.continueWatching(userId, 24);

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line py-20 text-center text-dim">
        Chưa có phim đang xem dở. Bắt đầu xem một bộ phim để thấy tiến độ tại đây.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {entries.map((entry) => {
        const pct =
          entry.duration > 0 ? Math.min(100, (entry.position / entry.duration) * 100) : 0;
        const href =
          entry.movie.type === "series"
            ? `/watch/${entry.movie.slug}?ep=${entry.episode.number}`
            : `/watch/${entry.movie.slug}`;
        return (
          <Link
            key={entry.episodeId}
            href={href}
            className="group overflow-hidden rounded-2xl border border-line bg-night-900 transition-all hover:border-neon/50 hover:shadow-xl hover:shadow-black/40"
          >
            <div className="relative aspect-video overflow-hidden bg-night-800">
              <Image
                src={entry.movie.backdropUrl || entry.movie.posterUrl}
                alt={entry.movie.title}
                fill
                sizes="(max-width: 640px) 100vw, 360px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 grid place-items-center bg-night-950/40 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="grid size-12 place-items-center rounded-full bg-neon text-white shadow-lg">
                  <Play className="ml-0.5 size-5 fill-current" />
                </span>
              </div>
              {/* Progress bar */}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                <div className="h-full bg-neon" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="truncate font-semibold text-ink">{entry.movie.title}</p>
              <p className="mt-0.5 text-sm text-dim">
                {entry.movie.type === "series" ? `Tập ${entry.episode.number} · ` : ""}
                {formatClock(entry.position)} / {formatClock(entry.duration)}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
