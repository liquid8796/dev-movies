import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { formatDate } from "@/lib/utils";
import { getUserById } from "@/server/services/user.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Tài khoản" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/settings");

  const user = await getUserById(session.user.id);
  if (!user) redirect("/login");

  return (
    <div className="container-page max-w-5xl pb-8 pt-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-extrabold text-ink md:text-3xl">Tài khoản</h1>
        <p className="text-sm text-dim">[tham gia: {formatDate(user.createdAt)}]</p>
      </div>

      <div className="mt-6">
        <AccountSettings
          user={{
            name: user.name,
            email: user.email,
            balance: user.balance,
            inviteCode: user.inviteCode,
          }}
        />
      </div>
    </div>
  );
}
