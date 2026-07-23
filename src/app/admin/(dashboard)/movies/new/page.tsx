import type { Metadata } from "next";
import { MovieForm } from "@/components/admin/MovieForm";
import { requireAdmin } from "@/server/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Thêm phim" };

export default async function NewMoviePage() {
  await requireAdmin();
  return (
    <div>
      <h1 className="heading-section mb-5 text-xl">Thêm phim mới</h1>
      <MovieForm initial={null} />
    </div>
  );
}
