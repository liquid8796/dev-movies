"use server";

import { redirect } from "next/navigation";
import { registerUser, UserServiceError } from "@/server/services/user.service";
import { signOut } from "@/auth";

export interface ActionState {
  error?: string;
  success?: string;
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password !== confirm) return { error: "Mật khẩu nhập lại không khớp." };

  try {
    await registerUser({ name, email, password });
  } catch (error) {
    if (error instanceof UserServiceError) return { error: error.message };
    console.error("registerAction failed:", error);
    return { error: "Đăng ký thất bại, vui lòng thử lại sau." };
  }
  redirect("/login?registered=1");
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
