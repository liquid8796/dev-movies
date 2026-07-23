"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteMovieAction } from "@/server/actions/admin.actions";

interface DeleteMovieButtonProps {
  movieId: string;
  title: string;
}

export function DeleteMovieButton({ movieId, title }: DeleteMovieButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onDelete = () => {
    if (!window.confirm(`Xóa phim "${title}"?\nHành động này không thể hoàn tác.`)) return;
    startTransition(async () => {
      const result = await deleteMovieAction(movieId);
      if (!result.ok) setError(result.error ?? "Xóa thất bại.");
      else router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        aria-label={`Xóa ${title}`}
        title="Xóa phim"
        className="grid size-9 place-items-center rounded-lg border border-line text-dim transition-colors hover:border-neon/60 hover:text-neon disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      </button>
      {error && <span className="text-xs text-neon">{error}</span>}
    </div>
  );
}
