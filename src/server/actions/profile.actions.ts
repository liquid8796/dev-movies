"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  changePassword,
  ensureInviteCode,
  updateProfile,
  UserServiceError,
} from "@/server/services/user.service";
import type { ActionState } from "./auth.actions";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new UserServiceError("Bạn cần đăng nhập.");
  return session.user.id;
}

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const name = formData.get("name");
    const email = formData.get("email");
    await updateProfile(userId, {
      name: typeof name === "string" ? name : undefined,
      email: typeof email === "string" ? email : undefined,
    });
    revalidatePath("/settings");
    return { success: "Đã cập nhật thông tin." };
  } catch (error) {
    if (error instanceof UserServiceError) return { error: error.message };
    console.error("updateProfileAction failed:", error);
    return { error: "Cập nhật thất bại, vui lòng thử lại." };
  }
}

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const current = String(formData.get("current") ?? "");
    const next = String(formData.get("next") ?? "");
    const confirm = String(formData.get("confirm") ?? "");
    if (next !== confirm) return { error: "Mật khẩu nhập lại không khớp." };
    await changePassword(userId, current, next);
    return { success: "Đã đổi mật khẩu." };
  } catch (error) {
    if (error instanceof UserServiceError) return { error: error.message };
    console.error("changePasswordAction failed:", error);
    return { error: "Đổi mật khẩu thất bại, vui lòng thử lại." };
  }
}

export async function createInviteAction(): Promise<{ code?: string; error?: string }> {
  try {
    const userId = await requireUserId();
    const code = await ensureInviteCode(userId);
    revalidatePath("/settings");
    return { code };
  } catch (error) {
    if (error instanceof UserServiceError) return { error: error.message };
    console.error("createInviteAction failed:", error);
    return { error: "Không tạo được mã mời." };
  }
}
