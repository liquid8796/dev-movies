"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, Copy, Pencil, X } from "lucide-react";
import {
  changePasswordAction,
  createInviteAction,
  updateProfileAction,
} from "@/server/actions/profile.actions";
import type { ActionState } from "@/server/actions/auth.actions";
import { formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AccountSettingsProps {
  user: {
    name: string;
    email: string;
    balance: number;
    inviteCode: string | null;
  };
}

export function AccountSettings({ user }: AccountSettingsProps) {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
      <EditableRow
        label="Tên"
        field="name"
        value={user.name}
        inputType="text"
        striped={false}
      />
      <EditableRow label="Email" field="email" value={user.email} inputType="email" striped />
      <PasswordRow />
      <div className="flex items-center gap-6 bg-night-900/60 px-5 py-4">
        <span className="w-28 shrink-0 text-sm font-bold text-ink md:w-40">Số dư</span>
        <span className="font-semibold text-gold">{formatMoney(user.balance)}</span>
      </div>
      <InviteRow initialCode={user.inviteCode} />
    </div>
  );
}

function RowShell({
  label,
  striped,
  children,
}: {
  label: string;
  striped: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4",
        striped && "bg-night-900/60",
      )}
    >
      <span className="w-28 shrink-0 text-sm font-bold text-ink md:w-40">{label}</span>
      {children}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-lg border border-line text-dim transition-colors hover:border-neon/50 hover:text-ink"
    >
      {children}
    </button>
  );
}

function Feedback({ state }: { state: ActionState }) {
  if (state.error) return <p className="w-full text-sm text-neon">{state.error}</p>;
  if (state.success) return <p className="w-full text-sm text-emerald-400">{state.success}</p>;
  return null;
}

function EditableRow({
  label,
  field,
  value,
  inputType,
  striped,
}: {
  label: string;
  field: "name" | "email";
  value: string;
  inputType: string;
  striped: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateProfileAction, {});

  return (
    <RowShell label={label} striped={striped}>
      {editing ? (
        <form action={formAction} className="flex flex-1 flex-wrap items-center gap-3">
          <input
            type={inputType}
            name={field}
            defaultValue={value}
            required
            autoFocus
            className="h-10 w-full max-w-sm rounded-lg border border-line bg-night-800 px-3 text-sm text-ink outline-none focus:border-neon"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-neon px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
          >
            Lưu
          </button>
          <IconButton label="Hủy" onClick={() => setEditing(false)}>
            <X className="size-4" />
          </IconButton>
          <Feedback state={state} />
        </form>
      ) : (
        <>
          <span className="text-dim">{value}</span>
          <IconButton label={`Sửa ${label.toLowerCase()}`} onClick={() => setEditing(true)}>
            <Pencil className="size-4" />
          </IconButton>
          {state.success && !editing && <Feedback state={state} />}
        </>
      )}
    </RowShell>
  );
}

function PasswordRow() {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(changePasswordAction, {});

  return (
    <RowShell label="Mật khẩu" striped={false}>
      {editing ? (
        <form action={formAction} className="flex flex-1 flex-wrap items-center gap-3">
          <input
            type="password"
            name="current"
            placeholder="Mật khẩu hiện tại"
            required
            className="h-10 w-full max-w-[220px] rounded-lg border border-line bg-night-800 px-3 text-sm text-ink outline-none focus:border-neon"
          />
          <input
            type="password"
            name="next"
            placeholder="Mật khẩu mới"
            required
            minLength={8}
            className="h-10 w-full max-w-[220px] rounded-lg border border-line bg-night-800 px-3 text-sm text-ink outline-none focus:border-neon"
          />
          <input
            type="password"
            name="confirm"
            placeholder="Nhập lại mật khẩu mới"
            required
            minLength={8}
            className="h-10 w-full max-w-[220px] rounded-lg border border-line bg-night-800 px-3 text-sm text-ink outline-none focus:border-neon"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-neon px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
          >
            Đổi mật khẩu
          </button>
          <IconButton label="Hủy" onClick={() => setEditing(false)}>
            <X className="size-4" />
          </IconButton>
          <Feedback state={state} />
        </form>
      ) : (
        <>
          <span className="tracking-widest text-dim">••••••••</span>
          <IconButton label="Đổi mật khẩu" onClick={() => setEditing(true)}>
            <Pencil className="size-4" />
          </IconButton>
          {state.success && <Feedback state={state} />}
        </>
      )}
    </RowShell>
  );
}

function InviteRow({ initialCode }: { initialCode: string | null }) {
  const [code, setCode] = useState(initialCode);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const generate = () => {
    startTransition(async () => {
      const result = await createInviteAction();
      if (result.code) setCode(result.code);
      else setError(result.error ?? "Có lỗi xảy ra.");
    });
  };

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="bg-night-900/60 px-5 py-5">
      <h2 className="text-lg font-bold text-ink">Mời bạn bè</h2>
      <p className="mt-1 text-sm text-dim">
        Tạo mã mời và chia sẻ cho bạn bè để cùng xem phim trên PhimVerse.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {code ? (
          <>
            <span className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 font-mono text-lg font-bold tracking-[0.2em] text-gold">
              {code}
            </span>
            <IconButton label="Sao chép mã" onClick={copy}>
              {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
            </IconButton>
          </>
        ) : (
          <button
            type="button"
            onClick={generate}
            disabled={pending}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-night-950 transition-all hover:bg-white disabled:opacity-50"
          >
            {pending ? "Đang tạo..." : "Tạo mã mời"}
          </button>
        )}
        {error && <p className="text-sm text-neon">{error}</p>}
      </div>
    </div>
  );
}
