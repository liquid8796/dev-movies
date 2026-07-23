import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { currentAdmin } from "@/server/admin";
import { isDemoMode } from "@/server/repositories";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Đăng nhập quản trị" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const [{ denied }, admin] = await Promise.all([searchParams, currentAdmin()]);
  if (admin) redirect("/admin");

  return <AdminLoginForm demoHint={isDemoMode()} denied={denied === "1"} />;
}
