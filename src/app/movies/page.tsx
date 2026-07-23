import type { Metadata } from "next";
import { BrowseView, type BrowseSearchParams } from "@/components/movies/BrowseView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Phim Lẻ",
  description: "Tuyển tập phim lẻ mới nhất, chất lượng 4K, cập nhật liên tục.",
};

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<BrowseSearchParams>;
}) {
  return (
    <BrowseView
      title="Phim Lẻ"
      basePath="/movies"
      fixedType="single"
      searchParams={await searchParams}
    />
  );
}
