"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ListChecks, LogOut, Settings } from "lucide-react";
import { signOutAction } from "@/server/actions/auth.actions";

interface UserMenuProps {
  user: { name: string; email: string };
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Menu tài khoản"
        className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-bold text-white ring-2 ring-transparent transition-all hover:ring-neon/60"
      >
        {initials(user.name)}
      </button>

      {open && (
        <div className="animate-fade-up absolute right-0 top-12 w-72 overflow-hidden rounded-2xl border border-line bg-night-900/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="border-b border-line px-5 py-4">
            <p className="font-semibold text-ink">{user.name}</p>
            <p className="mt-0.5 truncate text-sm text-dim">{user.email}</p>
          </div>
          <nav className="p-2">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink transition-colors hover:bg-night-700"
            >
              <Settings className="size-4.5 text-dim" /> Tài khoản
            </Link>
            <Link
              href="/collection"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink transition-colors hover:bg-night-700"
            >
              <ListChecks className="size-4.5 text-dim" /> Danh sách của tôi
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neon transition-colors hover:bg-neon/10"
              >
                <LogOut className="size-4.5" /> Đăng xuất
              </button>
            </form>
          </nav>
        </div>
      )}
    </div>
  );
}
