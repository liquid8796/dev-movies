"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  COUNTRIES,
  DURATION_BUCKETS,
  GENRES,
  SORT_OPTIONS,
  YEARS,
} from "@/lib/constants";

/**
 * PhimFox-style filter bar. Every change updates the URL (shareable,
 * back-button friendly) and re-renders the server component list.
 */

interface FilterBarProps {
  /** Hide the type select on pages that already fix the type. */
  lockType?: boolean;
  /** Base path to push filters to (defaults to current path). */
  basePath?: string;
}

const FIELDS = [
  { key: "type", label: "Loại phim:" },
  { key: "genre", label: "Thể loại:" },
  { key: "country", label: "Quốc gia:" },
  { key: "year", label: "Năm:" },
  { key: "duration", label: "Thời lượng:" },
  { key: "sort", label: "Sắp xếp:" },
] as const;

export function FilterBar({ lockType, basePath }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = (key: string) => searchParams.get(key) ?? "";

  const apply = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    const target = basePath ?? pathname;
    startTransition(() => {
      router.push(`${target}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div
      className={`container-page mt-6 transition-opacity ${isPending ? "opacity-60" : ""}`}
      role="search"
      aria-label="Bộ lọc phim"
    >
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-line bg-night-900/80 p-4 backdrop-blur-sm sm:grid-cols-3 lg:grid-cols-6">
        {FIELDS.filter((f) => !(lockType && f.key === "type")).map((field) => (
          <label key={field.key} className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-ink">{field.label}</span>
            <select
              value={current(field.key)}
              onChange={(e) => apply(field.key, e.target.value)}
              className="h-10 w-full cursor-pointer rounded-lg border border-line bg-night-800 px-2.5 text-sm text-ink outline-none transition-colors hover:border-night-600 focus:border-neon"
            >
              {field.key === "sort" ? (
                SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value === "updated" ? "" : o.value}>
                    {o.label}
                  </option>
                ))
              ) : (
                <>
                  <option value="">- Tất cả -</option>
                  {field.key === "type" && (
                    <>
                      <option value="single">Phim Lẻ</option>
                      <option value="series">Phim Bộ</option>
                    </>
                  )}
                  {field.key === "genre" &&
                    GENRES.map((g) => (
                      <option key={g.slug} value={g.slug}>
                        {g.name}
                      </option>
                    ))}
                  {field.key === "country" &&
                    Object.entries(COUNTRIES).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  {field.key === "year" &&
                    YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  {field.key === "duration" &&
                    DURATION_BUCKETS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                </>
              )}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}
