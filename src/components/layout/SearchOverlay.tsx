"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

interface SearchResult {
  slug: string;
  title: string;
  originalTitle: string;
  posterUrl: string;
  year: number;
  type: string;
  quality: string;
}

interface SearchOverlayProps {
  onClose: () => void;
}

/** Mounted only while open — state resets naturally on close. */
export function SearchOverlay({ onClose }: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Lock page scroll + focus the input while the overlay is up.
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, []);

  // Debounced live search (all state updates happen async, after the delay).
  useEffect(() => {
    const q = query.trim();
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (q.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { items: SearchResult[] };
        setResults(data.items);
        setLoading(false);
      } catch {
        /* aborted or network error — keep previous results */
      }
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = () => {
    const q = query.trim();
    if (!q) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-night-950/80 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="container-page animate-fade-up mx-auto max-w-3xl pt-[10vh]">
        <div className="overflow-hidden rounded-2xl border border-line bg-night-900 shadow-2xl shadow-black/60">
          <div className="flex items-center gap-3 border-b border-line px-5">
            <Search className="size-5 shrink-0 text-dim" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Tìm phim theo tên tiếng Việt hoặc tên gốc..."
              className="h-14 w-full bg-transparent text-base text-ink outline-none placeholder:text-dim/60"
            />
            {loading && <Loader2 className="size-5 animate-spin text-dim" />}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng tìm kiếm"
              className="grid size-8 shrink-0 place-items-center rounded-full text-dim hover:bg-night-700 hover:text-ink"
            >
              <X className="size-5" />
            </button>
          </div>

          {results.length > 0 && (
            <ul className="max-h-[55vh] overflow-y-auto p-2">
              {results.map((movie) => (
                <li key={movie.slug}>
                  <Link
                    href={`/movie/${movie.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-4 rounded-xl p-2.5 transition-colors hover:bg-night-700"
                  >
                    <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-night-800">
                      <Image
                        src={movie.posterUrl}
                        alt={movie.title}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{movie.title}</p>
                      <p className="truncate text-sm text-dim">
                        {movie.originalTitle} · {movie.year} ·{" "}
                        {movie.type === "series" ? "Phim Bộ" : "Phim Lẻ"}
                      </p>
                    </div>
                    <span className="ml-auto shrink-0 rounded-md bg-night-700 px-2 py-0.5 text-xs font-semibold text-gold">
                      {movie.quality}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {query.trim().length >= 2 && !loading && results.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-dim">
              Không tìm thấy phim nào cho “{query.trim()}”.
            </p>
          )}

          <div className="border-t border-line px-5 py-3 text-xs text-dim">
            Nhấn <kbd className="rounded bg-night-700 px-1.5 py-0.5 font-sans">Enter</kbd> để xem
            tất cả kết quả · <kbd className="rounded bg-night-700 px-1.5 py-0.5 font-sans">Esc</kbd>{" "}
            để đóng
          </div>
        </div>
      </div>
    </div>
  );
}
