"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  const next = searchParams.get("next") ?? "/";

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      redirect: false,
    });
    setPending(false);
    if (result?.error) {
      setError("Email hoặc mật khẩu không đúng.");
      return;
    }
    router.push(next);
    router.refresh();
  };

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-10">
      <div className="animate-fade-up w-full max-w-md rounded-3xl border border-line bg-night-900/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
        <h1 className="text-center text-2xl font-extrabold text-ink">
          Đăng nhập <span className="text-logo italic">{SITE_NAME}</span>
        </h1>
        <p className="mt-1 text-center text-sm text-dim">Chào mừng bạn quay trở lại!</p>

        {registered && (
          <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            Đăng ký thành công! Hãy đăng nhập để bắt đầu xem phim.
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="ban@email.com"
              className="h-11 w-full rounded-xl border border-line bg-night-800 px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-dim/50 focus:border-neon"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Mật khẩu</span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11 w-full rounded-xl border border-line bg-night-800 px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-dim/50 focus:border-neon"
            />
          </label>

          {error && <p className="text-sm text-neon">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neon text-sm font-bold text-white shadow-lg shadow-neon/25 transition-all hover:brightness-110 disabled:opacity-60"
          >
            {pending && <Loader2 className="size-4 animate-spin" />} Đăng nhập
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-dim">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-semibold text-neon hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
