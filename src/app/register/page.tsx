"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { registerAction } from "@/server/actions/auth.actions";
import { SITE_NAME } from "@/lib/constants";

const inputClass =
  "h-11 w-full rounded-xl border border-line bg-night-800 px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-dim/50 focus:border-neon";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, {});

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-10">
      <div className="animate-fade-up w-full max-w-md rounded-3xl border border-line bg-night-900/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
        <h1 className="text-center text-2xl font-extrabold text-ink">
          Tạo tài khoản <span className="text-logo italic">{SITE_NAME}</span>
        </h1>
        <p className="mt-1 text-center text-sm text-dim">
          Miễn phí — lưu danh sách phim và tiến độ xem của bạn.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Tên hiển thị</span>
            <input type="text" name="name" required minLength={2} placeholder="Nam Trần" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Email</span>
            <input type="email" name="email" required autoComplete="email" placeholder="ban@email.com" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Mật khẩu</span>
            <input type="password" name="password" required minLength={8} autoComplete="new-password" placeholder="Tối thiểu 8 ký tự" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Nhập lại mật khẩu</span>
            <input type="password" name="confirm" required minLength={8} autoComplete="new-password" placeholder="••••••••" className={inputClass} />
          </label>

          {state.error && <p className="text-sm text-neon">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neon text-sm font-bold text-white shadow-lg shadow-neon/25 transition-all hover:brightness-110 disabled:opacity-60"
          >
            {pending && <Loader2 className="size-4 animate-spin" />} Đăng ký
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-dim">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-semibold text-neon hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
