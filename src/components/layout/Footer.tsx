import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line/60">
      <div className="container-page flex flex-col items-center gap-4 py-10 text-center md:flex-row md:justify-between md:text-left">
        <p className="text-logo text-xl font-bold italic">{SITE_NAME}</p>
        <nav className="flex items-center gap-5 text-sm text-dim">
          <Link href="/trending" className="transition-colors hover:text-ink">
            Trending
          </Link>
          <Link href="/movies" className="transition-colors hover:text-ink">
            Phim Lẻ
          </Link>
          <Link href="/series" className="transition-colors hover:text-ink">
            Phim Bộ
          </Link>
          <Link href="/faq" className="transition-colors hover:text-ink">
            FAQ
          </Link>
        </nav>
      </div>
    </footer>
  );
}
