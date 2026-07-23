import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isDemoMode } from "@/server/repositories";

/**
 * Admin authorization — a single source of truth for "who is an admin".
 *
 * Admins are listed in ADMIN_EMAILS (comma-separated). In demo mode (no
 * database configured) the built-in demo account is an admin by default so
 * the admin area can be tried without any setup.
 */

const DEMO_ADMIN = "demo@phimverse.dev";

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const configured = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (configured.length > 0) return configured.includes(email.toLowerCase());
  return isDemoMode() && email.toLowerCase() === DEMO_ADMIN;
}

/** Current session user if they are an admin, otherwise null. */
export async function currentAdmin() {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !isAdminEmail(user.email)) return null;
  return { id: user.id, name: user.name ?? "", email: user.email ?? "" };
}

/**
 * Page-level admin guard. MUST be called by every admin page (not only the
 * layout): App Router renders layouts and pages in parallel, so a layout-only
 * check would still stream the page's data to unauthorized clients.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");
  if (!isAdminEmail(session.user.email)) redirect("/admin/login?denied=1");
  return { id: session.user.id, name: session.user.name ?? "", email: session.user.email ?? "" };
}
