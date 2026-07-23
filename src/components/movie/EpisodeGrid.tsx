import Link from "next/link";
import type { Episode } from "@/types";
import { cn } from "@/lib/utils";

interface EpisodeGridProps {
  slug: string;
  episodes: Episode[];
  currentNumber?: number;
}

export function EpisodeGrid({ slug, episodes, currentNumber }: EpisodeGridProps) {
  if (episodes.length <= 1) return null;

  return (
    <div>
      <h2 className="heading-section mb-3 text-lg">Danh sách tập</h2>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
        {episodes.map((ep) => {
          const active = ep.number === currentNumber;
          return (
            <Link
              key={ep.id}
              href={`/watch/${slug}?ep=${ep.number}`}
              aria-current={active ? "true" : undefined}
              className={cn(
                "grid h-10 place-items-center rounded-lg border text-sm font-semibold transition-all",
                active
                  ? "border-neon bg-neon text-white shadow-lg shadow-neon/30"
                  : "border-line bg-night-800 text-dim hover:border-neon/50 hover:text-ink",
              )}
            >
              {ep.number}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
