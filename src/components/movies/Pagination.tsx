import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Builds the href for a given page, preserving current filters. */
  hrefFor: (page: number) => string;
}

/** Compact page list: 1 … p-1 p p+1 … N */
function pageList(page: number, totalPages: number): (number | "…")[] {
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

export function Pagination({ page, totalPages, hrefFor }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Phân trang">
      <PageLink href={page > 1 ? hrefFor(page - 1) : null} ariaLabel="Trang trước">
        <ChevronLeft className="size-4" />
      </PageLink>

      {pageList(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-dim">
            …
          </span>
        ) : (
          <PageLink key={p} href={p === page ? null : hrefFor(p)} active={p === page}>
            {p}
          </PageLink>
        ),
      )}

      <PageLink href={page < totalPages ? hrefFor(page + 1) : null} ariaLabel="Trang sau">
        <ChevronRight className="size-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  active,
  ariaLabel,
  children,
}: {
  href: string | null;
  active?: boolean;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  const className = cn(
    "grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-sm font-medium transition-colors",
    active
      ? "border-neon bg-neon/15 text-neon"
      : href
        ? "border-line text-dim hover:border-neon/50 hover:text-ink"
        : "cursor-default border-line/50 text-dim/40",
  );
  if (!href) {
    return (
      <span className={className} aria-label={ariaLabel} aria-current={active ? "page" : undefined}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
