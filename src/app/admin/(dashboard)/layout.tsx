import Link from "next/link";
import { Clapperboard, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/server/admin";

/**
 * Admin dashboard shell. Note: this layout redirects unauthorized visitors,
 * but every admin PAGE also calls requireAdmin() itself — layouts and pages
 * render in parallel, so a layout-only guard would still leak page data.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="container-page pb-8 pt-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/25 bg-night-900/70 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-gold/15 text-gold">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="font-bold text-ink">Bảng điều khiển quản trị</p>
            <p className="text-xs text-dim">{admin.email}</p>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-dim transition-colors hover:border-night-600 hover:text-ink"
        >
          <Clapperboard className="size-4" /> Về trang xem phim
        </Link>
      </div>
      {children}
    </div>
  );
}
