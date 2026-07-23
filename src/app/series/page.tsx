import type { Metadata } from "next";
import { BrowseView, type BrowseSearchParams } from "@/components/movies/BrowseView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Phim Bộ",
  description: "Tuyển tập phim bộ hot nhất, trọn bộ vietsub, chất lượng cao.",
};

export default async function SeriesPage({
  searchParams,
}: {
  searchParams: Promise<BrowseSearchParams>;
}) {
  return (
    <BrowseView
      title="Phim Bộ"
      basePath="/series"
      fixedType="series"
      searchParams={await searchParams}
    />
  );
}
