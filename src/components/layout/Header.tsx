"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SearchOverlay } from "./SearchOverlay";
import { UserMenu } from "./UserMenu";

const NAV_LINKS = [
  { href: "/trending", label: "Trending" },
  { href: "/movies", label: "Phim Lẻ" },
  { href: "/series", label: "Phim Bộ" },
  { href: "/faq", label: "FAQ" },
];

interface HeaderProps {
  user: { name: string; email: string } | null;
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Global "/" shortcut opens search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 transition-all duration-300",
          scrolled
            ? "border-b border-line bg-night-950/85 shadow-lg shadow-black/20 backdrop-blur-xl"
            : "bg-transparent",
        )}
      >
        <div className="container-page flex h-16 items-center gap-6">
          <Link
            href="/"
            className="text-logo text-2xl tracking-wide transition-opacity hover:opacity-80"
            style={{ fontFamily: "var(--font-logo), cursive" }}
          >
            {SITE_NAME}
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "text-ink" : "text-dim hover:bg-night-800 hover:text-ink",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Tìm kiếm phim"
              className="grid size-10 place-items-center rounded-full text-dim transition-colors hover:bg-night-800 hover:text-ink"
            >
              <Search className="size-5" />
            </button>
            {user ? (
              <UserMenu user={user} />
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-neon px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-neon/25 transition-all hover:brightness-110"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="scrollbar-hide flex items-center gap-1 overflow-x-auto px-4 pb-2 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-sm",
                pathname === link.href ? "bg-night-700 text-ink" : "text-dim",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
