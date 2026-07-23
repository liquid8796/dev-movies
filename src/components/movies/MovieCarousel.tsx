"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Movie } from "@/types";
import { cn } from "@/lib/utils";
import { MovieCard } from "./MovieCard";

interface MovieCarouselProps {
  title: string;
  movies: Movie[];
  /** Prioritize first images (above-the-fold section). */
  priority?: boolean;
}

export function MovieCarousel({ title, movies, priority }: MovieCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, movies.length]);

  const scrollBy = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  };

  if (movies.length === 0) return null;

  return (
    <section className="container-page mt-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="heading-section text-xl md:text-2xl">{title}</h2>
        <div className="hidden items-center gap-2 md:flex">
          <CarouselArrow dir={-1} disabled={!canPrev} onClick={() => scrollBy(-1)} />
          <CarouselArrow dir={1} disabled={!canNext} onClick={() => scrollBy(1)} />
        </div>
      </div>

      <div className="group/track relative">
        <div
          ref={trackRef}
          className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-2"
        >
          {movies.map((movie, index) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              priority={priority && index < 6}
              className="w-[45vw] shrink-0 snap-start sm:w-[30vw] md:w-[200px] lg:w-[210px]"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CarouselArrow({
  dir,
  disabled,
  onClick,
}: {
  dir: 1 | -1;
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = dir === 1 ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 1 ? "Cuộn sang phải" : "Cuộn sang trái"}
      className={cn(
        "grid size-9 place-items-center rounded-full border border-line bg-night-800 text-ink transition-all",
        disabled ? "cursor-default opacity-30" : "hover:border-neon/60 hover:text-neon",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
