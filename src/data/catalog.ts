/**
 * Demo catalog — the single source of truth used by:
 *  - the in-memory repositories (zero-config demo mode)
 *  - `npm run db:seed` (inserts the same data into Postgres)
 *  - `npm run posters` (generates local poster/backdrop artwork)
 *
 * Episode sources use public sample videos as `fallbackUrl`. When you connect
 * OneDrive, set `oneDrivePath` (path of the file inside your drive) and the
 * streaming service will prefer it automatically.
 */

import type { MovieType, StreamType } from "@/types";

export interface CatalogEpisode {
  season: number;
  number: number;
  title: string;
  duration: number;
  sourceType: StreamType;
  /** Path inside OneDrive, e.g. "Movies/silo/e01.mp4". Optional in demo mode. */
  oneDrivePath?: string;
  /** Public demo URL used when OneDrive is not configured. */
  fallbackUrl: string;
}

export interface CatalogMovie {
  slug: string;
  title: string;
  originalTitle: string;
  description: string;
  type: MovieType;
  year: number;
  duration: number;
  country: string;
  quality: "4K" | "FHD" | "HD" | "CAM";
  rating: number;
  views: number;
  featured: boolean;
  genres: string[];
  episodes: CatalogEpisode[];
}

const SAMPLE_MP4 = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
];

const SAMPLE_HLS = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

let sampleCursor = 0;
function nextSample(): string {
  return SAMPLE_MP4[sampleCursor++ % SAMPLE_MP4.length];
}

function singleEpisode(duration: number): CatalogEpisode[] {
  return [
    {
      season: 1,
      number: 1,
      title: "Bản Full",
      duration,
      sourceType: "mp4",
      fallbackUrl: nextSample(),
    },
  ];
}

function seriesEpisodes(count: number, duration: number, useHls = false): CatalogEpisode[] {
  return Array.from({ length: count }, (_, i) => ({
    season: 1,
    number: i + 1,
    title: `Tập ${i + 1}`,
    duration,
    sourceType: (useHls && i === 0 ? "hls" : "mp4") as StreamType,
    fallbackUrl: useHls && i === 0 ? SAMPLE_HLS : nextSample(),
  }));
}

export const CATALOG: CatalogMovie[] = [
  {
    slug: "pham-nhan-tu-tien-truyen",
    title: "Phàm Nhân Tu Tiên Truyện",
    originalTitle: "The Immortal Ascension",
    description:
      "Hàn Lập, một thiếu niên xuất thân bần hàn, tình cờ bước chân vào thế giới tu tiên đầy hiểm ác. Không có thiên phú xuất chúng, cậu phải dựa vào ý chí sắt đá và sự cẩn trọng tuyệt đối để từng bước vươn lên trong thế giới cường giả như mây.",
    type: "series",
    year: 2025,
    duration: 45,
    country: "cn",
    quality: "4K",
    rating: 9.1,
    views: 1250000,
    featured: true,
    genres: ["co-trang", "vien-tuong", "phieu-luu"],
    episodes: seriesEpisodes(10, 45, true),
  },
  {
    slug: "silo",
    title: "Silo",
    originalTitle: "Silo",
    description:
      "Trong một tương lai hậu tận thế, mười nghìn con người cuối cùng sống trong một hầm trú ẩn khổng lồ sâu dưới lòng đất. Không ai biết vì sao silo được xây, và những ai tìm cách khám phá sự thật đều phải trả giá đắt.",
    type: "series",
    year: 2023,
    duration: 55,
    country: "us",
    quality: "4K",
    rating: 8.7,
    views: 2140000,
    featured: true,
    genres: ["vien-tuong", "tam-ly", "chinh-kich"],
    episodes: seriesEpisodes(10, 55),
  },
  {
    slug: "the-than-ngu-khi-su-cuoi-cung",
    title: "Thế Thần: Ngự Khí Sư Cuối Cùng",
    originalTitle: "Avatar: The Last Airbender",
    description:
      "Aang, Thế Thần cuối cùng của Khí Tộc, thức tỉnh sau một trăm năm ngủ vùi trong băng để đối mặt với Hỏa Quốc hùng mạnh đang muốn thống trị thế giới. Cùng những người bạn đồng hành, cậu phải làm chủ tứ đại nguyên tố để lập lại cân bằng.",
    type: "series",
    year: 2024,
    duration: 50,
    country: "us",
    quality: "FHD",
    rating: 8.2,
    views: 1830000,
    featured: true,
    genres: ["phieu-luu", "vien-tuong", "gia-dinh"],
    episodes: seriesEpisodes(8, 50),
  },
  {
    slug: "project-hail-mary",
    title: "Dự Án Hail Mary",
    originalTitle: "Project Hail Mary",
    description:
      "Ryland Grace tỉnh dậy trên một con tàu vũ trụ cách Trái Đất hàng năm ánh sáng, không nhớ mình là ai hay vì sao ở đó. Dần dần, anh nhận ra mình là hy vọng cuối cùng của nhân loại trước một thảm họa diệt vong đang tới gần.",
    type: "single",
    year: 2026,
    duration: 138,
    country: "us",
    quality: "4K",
    rating: 8.9,
    views: 980000,
    featured: true,
    genres: ["vien-tuong", "phieu-luu", "chinh-kich"],
    episodes: singleEpisode(138),
  },
  {
    slug: "xam-lang",
    title: "Xâm Lăng",
    originalTitle: "Invasion",
    description:
      "Cuộc xâm lăng của người ngoài hành tinh được kể qua góc nhìn của những con người bình thường ở khắp các châu lục, khi thế giới quen thuộc của họ sụp đổ từng ngày.",
    type: "series",
    year: 2021,
    duration: 52,
    country: "us",
    quality: "FHD",
    rating: 7.4,
    views: 890000,
    featured: true,
    genres: ["vien-tuong", "tam-ly"],
    episodes: seriesEpisodes(10, 52),
  },
  {
    slug: "he-man-va-nhung-chien-binh-vu-tru",
    title: "He-Man Và Những Chiến Binh Vũ Trụ",
    originalTitle: "Masters of the Universe",
    description:
      "Hoàng tử Adam của hành tinh Eternia sở hữu thanh gươm quyền năng biến anh thành He-Man — người đàn ông mạnh nhất vũ trụ. Anh phải bảo vệ bí mật của lâu đài Grayskull trước Skeletor độc ác.",
    type: "single",
    year: 2026,
    duration: 126,
    country: "us",
    quality: "4K",
    rating: 7.8,
    views: 640000,
    featured: true,
    genres: ["hanh-dong", "vien-tuong", "phieu-luu"],
    episodes: singleEpisode(126),
  },
  {
    slug: "cua-hang-sat-thu",
    title: "Cửa Hàng Sát Thủ",
    originalTitle: "A Shop for Killers",
    description:
      "Sau cái chết bí ẩn của người chú, Jeong Ji-an phát hiện trung tâm mua sắm mà chú để lại thực chất là một cửa hàng cung cấp vũ khí cho sát thủ — và giờ đây cô trở thành mục tiêu của tất cả.",
    type: "series",
    year: 2024,
    duration: 60,
    country: "kr",
    quality: "FHD",
    rating: 8.5,
    views: 1120000,
    featured: true,
    genres: ["hanh-dong", "tam-ly"],
    episodes: seriesEpisodes(8, 60),
  },
  {
    slug: "phim-hai-kinh-di-6",
    title: "Phim Hài Kinh Dị 6",
    originalTitle: "Scary Movie 6",
    description:
      "Thương hiệu hài nhại kinh dị đình đám trở lại, châm biếm tất cả những bộ phim kinh dị ăn khách nhất thập kỷ với phong cách hài hước không giới hạn.",
    type: "single",
    year: 2026,
    duration: 95,
    country: "us",
    quality: "FHD",
    rating: 6.9,
    views: 720000,
    featured: true,
    genres: ["hai", "kinh-di"],
    episodes: singleEpisode(95),
  },
  {
    slug: "loi-nguyen-dong-cung",
    title: "Lời Nguyền Đông Cung",
    originalTitle: "The East Palace",
    description:
      "Chốn thâm cung đầy quyền mưu, một lời nguyền truyền đời đeo bám Đông Cung khiến mọi thái tử đều không thể sống qua tuổi ba mươi. Vị thái tử trẻ quyết tâm phá giải bí ẩn trước khi định mệnh gọi tên.",
    type: "series",
    year: 2025,
    duration: 45,
    country: "cn",
    quality: "FHD",
    rating: 8.0,
    views: 560000,
    featured: true,
    genres: ["co-trang", "tinh-cam", "tam-ly"],
    episodes: seriesEpisodes(12, 45),
  },
  {
    slug: "backrooms-thuc-the-quy-di",
    title: "Backrooms: Thực Thể Quỷ Dị",
    originalTitle: "The Backrooms",
    description:
      "Một nhóm bạn trẻ vô tình 'noclip' khỏi thực tại và rơi vào Backrooms — mê cung văn phòng vàng úa vô tận, nơi những thực thể quỷ dị săn lùng bất kỳ ai lạc bước.",
    type: "single",
    year: 2025,
    duration: 102,
    country: "us",
    quality: "HD",
    rating: 7.1,
    views: 430000,
    featured: false,
    genres: ["kinh-di", "vien-tuong"],
    episodes: singleEpisode(102),
  },
  {
    slug: "con-thinh-no",
    title: "Cơn Thịnh Nộ",
    originalTitle: "The Furious",
    description:
      "Một cựu đặc vụ buộc phải tái xuất khi gia đình bị đe dọa. Những pha hành động nghẹt thở nối tiếp nhau trong hành trình báo thù đẫm máu xuyên qua thế giới ngầm.",
    type: "single",
    year: 2025,
    duration: 118,
    country: "cn",
    quality: "4K",
    rating: 7.6,
    views: 380000,
    featured: false,
    genres: ["hanh-dong", "tam-ly"],
    episodes: singleEpisode(118),
  },
  {
    slug: "nguoi-nhen-thanh-paris",
    title: "Người Nhện Thành Paris",
    originalTitle: "The Spider-Man of Paris",
    description:
      "Câu chuyện có thật về Vjeran Tomic — siêu trộm khét tiếng leo tường như người nhện, kẻ đứng sau vụ trộm tranh 100 triệu euro chấn động Bảo tàng Nghệ thuật Hiện đại Paris.",
    type: "single",
    year: 2025,
    duration: 98,
    country: "fr",
    quality: "FHD",
    rating: 7.3,
    views: 210000,
    featured: false,
    genres: ["tai-lieu", "tam-ly"],
    episodes: singleEpisode(98),
  },
  {
    slug: "tinh-yeu-o-thanh-pho-lon",
    title: "Tình Yêu Ở Thành Phố Lớn",
    originalTitle: "Love in the Big City",
    description:
      "Jae-hee và Heung-soo — hai tâm hồn tự do giữa Seoul hoa lệ — cùng nhau trải qua tuổi trẻ rực rỡ, những mối tình vụng dại và hành trình tìm kiếm chính mình.",
    type: "single",
    year: 2024,
    duration: 118,
    country: "kr",
    quality: "FHD",
    rating: 7.9,
    views: 340000,
    featured: false,
    genres: ["tinh-cam", "hai", "chinh-kich"],
    episodes: singleEpisode(118),
  },
  {
    slug: "ngay-tiet-lo",
    title: "Ngày Tiết Lộ",
    originalTitle: "Disclosure Day",
    description:
      "Khi chính phủ tuyên bố sẽ công bố toàn bộ sự thật về người ngoài hành tinh vào đúng một ngày, cả thế giới rơi vào 24 giờ hỗn loạn, đức tin và hy vọng đan xen.",
    type: "single",
    year: 2026,
    duration: 109,
    country: "us",
    quality: "FHD",
    rating: 7.2,
    views: 190000,
    featured: false,
    genres: ["vien-tuong", "tam-ly", "chinh-kich"],
    episodes: singleEpisode(109),
  },
  {
    slug: "cai-chet-trang",
    title: "Cái Chết Trắng",
    originalTitle: "The Death",
    description:
      "Giữa mùa đông khắc nghiệt vùng Bắc Âu, một điều tra viên lần theo chuỗi án mạng bí ẩn mà mọi manh mối đều tan biến trong tuyết trắng.",
    type: "single",
    year: 2025,
    duration: 112,
    country: "gb",
    quality: "HD",
    rating: 7.0,
    views: 150000,
    featured: false,
    genres: ["kinh-di", "tam-ly", "chinh-kich"],
    episodes: singleEpisode(112),
  },
  {
    slug: "dac-vu-kim",
    title: "Đặc Vụ Kim",
    originalTitle: "Agent Kim",
    description:
      "Đặc vụ Kim — huyền thoại đã giải nghệ của tình báo Hàn Quốc — bị kéo trở lại nhiệm vụ cuối cùng khi quá khứ chưa từng buông tha ông.",
    type: "single",
    year: 2025,
    duration: 105,
    country: "kr",
    quality: "FHD",
    rating: 7.5,
    views: 280000,
    featured: false,
    genres: ["hanh-dong", "hai"],
    episodes: singleEpisode(105),
  },
  {
    slug: "hanh-tinh-cat-phan-hai",
    title: "Hành Tinh Cát: Phần Hai",
    originalTitle: "Dune: Part Two",
    description:
      "Paul Atreides hợp nhất với người Fremen trên hành trình báo thù những kẻ đã hủy diệt gia tộc mình, đồng thời đối mặt với lựa chọn giữa tình yêu và số phận của cả vũ trụ.",
    type: "single",
    year: 2024,
    duration: 166,
    country: "us",
    quality: "4K",
    rating: 8.8,
    views: 1650000,
    featured: false,
    genres: ["vien-tuong", "phieu-luu", "chinh-kich"],
    episodes: singleEpisode(166),
  },
  {
    slug: "ke-trom-mat-trang-4",
    title: "Kẻ Trộm Mặt Trăng 4",
    originalTitle: "Despicable Me 4",
    description:
      "Gru cùng gia đình và biệt đội Minion tinh nghịch bước vào chương mới đầy hỗn loạn khi phải đối đầu với kẻ thù mới Maxime Le Mal.",
    type: "single",
    year: 2024,
    duration: 94,
    country: "us",
    quality: "FHD",
    rating: 7.4,
    views: 920000,
    featured: false,
    genres: ["hoat-hinh", "hai", "gia-dinh"],
    episodes: singleEpisode(94),
  },
  {
    slug: "vung-dat-cam-lang-ngay-mot",
    title: "Vùng Đất Câm Lặng: Ngày Một",
    originalTitle: "A Quiet Place: Day One",
    description:
      "Ngày đầu tiên của cuộc xâm lăng — New York chìm trong im lặng chết chóc khi những sinh vật săn mồi bằng âm thanh đổ bộ xuống Trái Đất.",
    type: "single",
    year: 2024,
    duration: 99,
    country: "us",
    quality: "4K",
    rating: 7.7,
    views: 780000,
    featured: false,
    genres: ["kinh-di", "vien-tuong"],
    episodes: singleEpisode(99),
  },
  {
    slug: "bi-kip-luyen-rong",
    title: "Bí Kíp Luyện Rồng",
    originalTitle: "How to Train Your Dragon",
    description:
      "Phiên bản live-action của huyền thoại hoạt hình: cậu bé Hiccup người Viking kết bạn với chú rồng Răng Sún và thay đổi vĩnh viễn mối quan hệ giữa người và rồng.",
    type: "single",
    year: 2025,
    duration: 125,
    country: "us",
    quality: "4K",
    rating: 8.1,
    views: 860000,
    featured: false,
    genres: ["phieu-luu", "gia-dinh", "vien-tuong"],
    episodes: singleEpisode(125),
  },
  {
    slug: "tro-choi-con-muc-3",
    title: "Trò Chơi Con Mực 3",
    originalTitle: "Squid Game 3",
    description:
      "Gi-hun trở lại đấu trường sinh tử lần cuối cùng với quyết tâm chấm dứt trò chơi tàn khốc, trong khi Front Man chuẩn bị những nước cờ nghiệt ngã nhất.",
    type: "series",
    year: 2025,
    duration: 58,
    country: "kr",
    quality: "4K",
    rating: 8.4,
    views: 2450000,
    featured: false,
    genres: ["tam-ly", "hanh-dong", "chinh-kich"],
    episodes: seriesEpisodes(6, 58),
  },
];
