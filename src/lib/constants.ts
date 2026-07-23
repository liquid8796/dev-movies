import type { SortKey } from "@/types";

export const SITE_NAME = "PhimVerse";
export const SITE_TAGLINE = "Xem phim online chất lượng cao, tốc độ 4K";

export const GENRES: { slug: string; name: string }[] = [
  { slug: "hanh-dong", name: "Hành Động" },
  { slug: "vien-tuong", name: "Viễn Tưởng" },
  { slug: "kinh-di", name: "Kinh Dị" },
  { slug: "hai", name: "Hài" },
  { slug: "tinh-cam", name: "Tình Cảm" },
  { slug: "co-trang", name: "Cổ Trang" },
  { slug: "hoat-hinh", name: "Hoạt Hình" },
  { slug: "tam-ly", name: "Tâm Lý" },
  { slug: "phieu-luu", name: "Phiêu Lưu" },
  { slug: "chinh-kich", name: "Chính Kịch" },
  { slug: "tai-lieu", name: "Tài Liệu" },
  { slug: "gia-dinh", name: "Gia Đình" },
];

export const COUNTRIES: Record<string, string> = {
  us: "Âu Mỹ",
  kr: "Hàn Quốc",
  cn: "Trung Quốc",
  jp: "Nhật Bản",
  vn: "Việt Nam",
  th: "Thái Lan",
  fr: "Pháp",
  gb: "Anh",
};

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "updated", label: "Ngày cập nhật" },
  { value: "year", label: "Năm sản xuất" },
  { value: "views", label: "Lượt xem" },
  { value: "rating", label: "Điểm đánh giá" },
];

export const DURATION_BUCKETS: { value: string; label: string }[] = [
  { value: "short", label: "Dưới 90 phút" },
  { value: "medium", label: "90 - 120 phút" },
  { value: "long", label: "Trên 120 phút" },
];

export const YEARS: number[] = (() => {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current + 1; y >= 2000; y--) years.push(y);
  return years;
})();

export const PAGE_SIZE = 24;

export function genreName(slug: string): string {
  return GENRES.find((g) => g.slug === slug)?.name ?? slug;
}

export function countryName(code: string): string {
  return COUNTRIES[code] ?? code;
}
