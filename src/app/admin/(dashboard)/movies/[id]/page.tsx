import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MovieForm } from "@/components/admin/MovieForm";
import { requireAdmin } from "@/server/admin";
import { getMovieForAdmin } from "@/server/services/admin.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sửa phim" };

export default async function EditMoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getMovieForAdmin(id);
  if (!detail) notFound();

  return (
    <div>
      <h1 className="heading-section mb-5 text-xl">
        Sửa phim: <span className="normal-case text-ink">{detail.movie.title}</span>
      </h1>
      <MovieForm initial={detail} />
    </div>
  );
}
