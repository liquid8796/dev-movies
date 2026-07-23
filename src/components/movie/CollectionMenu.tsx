"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Bookmark, Check, ChevronDown, Eye, Heart, Trash2 } from "lucide-react";
import { setCollectionAction } from "@/server/actions/collection.actions";
import type { CollectionStatus } from "@/types";
import { cn } from "@/lib/utils";

interface CollectionMenuProps {
  movieId: string;
  initialStatus: CollectionStatus | null;
  isAuthenticated: boolean;
}

const OPTIONS: { value: CollectionStatus; label: string; icon: typeof Eye }[] = [
  { value: "watching", label: "Đang xem", icon: Eye },
  { value: "wishlist", label: "Mong muốn", icon: Heart },
  { value: "watched", label: "Đã xem", icon: Check },
];

/** "Add to my list" dropdown with optimistic updates. */
export function CollectionMenu({ movieId, initialStatus, isAuthenticated }: CollectionMenuProps) {
  const router = useRouter();
  const [status, setStatus] = useState<CollectionStatus | null>(initialStatus);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const select = (next: CollectionStatus | null) => {
    setOpen(false);
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    const previous = status;
    setStatus(next);
    startTransition(async () => {
      const result = await setCollectionAction(movieId, next);
      if (!result.ok) setStatus(previous);
    });
  };

  const active = OPTIONS.find((o) => o.value === status);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-colors",
          active
            ? "border-gold/60 bg-gold/10 text-gold"
            : "border-line bg-night-800 text-ink hover:border-night-600",
        )}
      >
        {active ? <active.icon className="size-4.5" /> : <Bookmark className="size-4.5" />}
        {active ? active.label : "Thêm vào danh sách"}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="animate-fade-up absolute left-0 top-14 z-20 w-56 overflow-hidden rounded-2xl border border-line bg-night-900/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => select(option.value)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-night-700",
                status === option.value ? "text-gold" : "text-ink",
              )}
            >
              <option.icon className="size-4.5" />
              {option.label}
              {status === option.value && <Check className="ml-auto size-4" />}
            </button>
          ))}
          {status && (
            <>
              <div className="my-1 border-t border-line" />
              <button
                type="button"
                onClick={() => select(null)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neon transition-colors hover:bg-neon/10"
              >
                <Trash2 className="size-4.5" /> Xóa khỏi danh sách
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
