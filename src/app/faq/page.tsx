import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ - Câu hỏi thường gặp",
  description: "Giải đáp các câu hỏi thường gặp khi xem phim trên PhimVerse.",
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "PhimVerse có miễn phí không?",
    a: "Có. Bạn có thể xem toàn bộ phim miễn phí. Đăng ký tài khoản (cũng miễn phí) để lưu danh sách phim yêu thích và tiến độ xem trên mọi thiết bị.",
  },
  {
    q: "Chất lượng phim tối đa là bao nhiêu?",
    a: "Hệ thống hỗ trợ phát tới độ phân giải 4K. Video được truyền trực tiếp từ CDN với hỗ trợ tua nhanh (HTTP Range), nên bạn có thể nhảy tới bất kỳ đoạn nào mà không phải chờ tải lại từ đầu.",
  },
  {
    q: "Vì sao video thỉnh thoảng dừng để tải (buffering)?",
    a: "Với phim 4K, tốc độ mạng khuyến nghị tối thiểu là 25 Mbps. Nếu mạng chậm, hãy thử tạm dừng vài giây cho video tải trước, hoặc chuyển sang thiết bị/mạng khác ổn định hơn.",
  },
  {
    q: "Làm sao để tiếp tục xem phim đang dở?",
    a: "Khi đã đăng nhập, tiến độ xem của bạn được lưu tự động. Vào mục 'Danh sách của tôi' → tab 'Cập Nhật' để xem lại các phim đang dở và tiếp tục đúng từ vị trí đã dừng.",
  },
  {
    q: "Thêm phim vào danh sách cá nhân như thế nào?",
    a: "Ở trang chi tiết phim, bấm nút 'Thêm vào danh sách' và chọn một trong ba trạng thái: Đang xem, Mong muốn, hoặc Đã xem. Bạn có thể đổi hoặc xóa trạng thái bất cứ lúc nào.",
  },
  {
    q: "Phím tắt của trình phát video?",
    a: "Space/K: phát–tạm dừng · ←/→: tua 10 giây · ↑/↓: âm lượng · M: tắt tiếng · F: toàn màn hình. Nhấn đúp vào video cũng bật/tắt toàn màn hình.",
  },
  {
    q: "Tôi gặp lỗi 'Không tải được nguồn phát'?",
    a: "Liên kết phát video có thời hạn và được làm mới tự động. Nếu vẫn lỗi, bấm 'Thử lại', tải lại trang, hoặc quay lại sau ít phút. Nếu lỗi kéo dài hãy báo cho quản trị viên.",
  },
  {
    q: "Mã mời bạn bè dùng để làm gì?",
    a: "Trong trang 'Tài khoản', bạn có thể tạo mã mời để chia sẻ cho bạn bè. Các chương trình ưu đãi dành cho người giới thiệu sẽ được cập nhật trong thời gian tới.",
  },
];

export default function FaqPage() {
  return (
    <div className="container-page max-w-3xl pb-8 pt-8">
      <h1 className="heading-section text-2xl">Câu Hỏi Thường Gặp</h1>
      <p className="mt-1 text-sm text-dim">
        Không tìm thấy câu trả lời? Hãy liên hệ với chúng tôi qua trang hỗ trợ.
      </p>

      <div className="mt-6 space-y-3">
        {FAQS.map((faq) => (
          <details
            key={faq.q}
            className="group rounded-2xl border border-line bg-night-900/70 transition-colors open:border-neon/40"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
              {faq.q}
              <ChevronDown className="size-5 shrink-0 text-dim transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <p className="px-5 pb-5 text-sm leading-relaxed text-dim">{faq.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
