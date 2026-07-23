import type { Metadata } from "next";
import { BrowseView, type BrowseSearchParams } from "@/components/movies/BrowseView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Duyệt phim" };

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<BrowseSearchParams>;
}) {
  return <BrowseView title="Duyệt Phim" basePath="/browse" searchParams={await searchParams} />;
}
