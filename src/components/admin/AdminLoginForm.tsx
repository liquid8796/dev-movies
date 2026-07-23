"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, ShieldCheck } from "lucide-react";

interface AdminLoginFormProps {
  demoHint: boolean;
  denied: boolean;
}

export function AdminLoginForm({ demoHint, denied }: AdminLoginFormProps) {
  const router = useRouter();
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
    // Authorization (admin or not) is enforced server-side by the /admin layout.
    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-10">
      <div className="animate-fade-up w-full max-w-md rounded-3xl border border-gold/30 bg-night-900/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-gold/15 text-gold">
          <ShieldCheck className="size-7" />
        </div>
        <h1 className="mt-4 text-center text-2xl font-extrabold text-ink">Khu vực quản trị</h1>
        <p className="mt-1 text-center text-sm text-dim">
          Đăng nhập bằng tài khoản có quyền quản trị để quản lý kho phim.
        </p>

        {denied && (
          <p className="mt-4 rounded-xl border border-neon/30 bg-neon/10 px-4 py-3 text-sm text-neon">
            Tài khoản của bạn không có quyền quản trị. Hãy đăng nhập bằng tài khoản admin.
          </p>
        )}
        {demoHint && (
          <p className="mt-4 rounded-xl border border-line bg-night-800/70 px-4 py-3 text-sm text-dim">
            Chế độ demo — tài khoản admin: <span className="font-mono text-gold">demo@phimverse.dev</span>{" "}
            / <span className="font-mono text-gold">demo1234</span>
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Email quản trị</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="admin@email.com"
              className="h-11 w-full rounded-xl border border-line bg-night-800 px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-dim/50 focus:border-gold"
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
              className="h-11 w-full rounded-xl border border-line bg-night-800 px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-dim/50 focus:border-gold"
            />
          </label>

          {error && <p className="text-sm text-neon">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gold text-sm font-bold text-night-950 shadow-lg shadow-gold/20 transition-all hover:brightness-110 disabled:opacity-60"
          >
            {pending && <Loader2 className="size-4 animate-spin" />} Đăng nhập quản trị
          </button>
        </form>
      </div>
    </div>
  );
}
