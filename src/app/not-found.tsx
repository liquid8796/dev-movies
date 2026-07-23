import Link from "next/link";
import { Clapperboard } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-16 text-center">
      <div className="animate-fade-up">
        <Clapperboard className="mx-auto size-14 text-dim" />
        <h1 className="mt-4 text-4xl font-extrabold text-ink">404</h1>
        <p className="mt-2 text-dim">Trang bạn tìm không tồn tại hoặc phim đã bị gỡ.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-neon px-6 py-3 text-sm font-bold text-white shadow-lg shadow-neon/25 transition-all hover:brightness-110"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
