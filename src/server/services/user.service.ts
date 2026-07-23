import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { getRepositories } from "@/server/repositories";
import type { UserRecord } from "@/server/repositories/types";

/** User account service — registration, credential checks, profile updates. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class UserServiceError extends Error {}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<UserRecord | null> {
  const user = await getRepositories().users.byEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}): Promise<UserRecord> {
  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();

  if (name.length < 2) throw new UserServiceError("Tên phải có ít nhất 2 ký tự.");
  if (!EMAIL_RE.test(email)) throw new UserServiceError("Email không hợp lệ.");
  if (data.password.length < 8) throw new UserServiceError("Mật khẩu phải có ít nhất 8 ký tự.");

  const repo = getRepositories().users;
  if (await repo.byEmail(email)) throw new UserServiceError("Email này đã được đăng ký.");

  const passwordHash = await bcrypt.hash(data.password, 10);
  return repo.create({ name, email, passwordHash });
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  return getRepositories().users.byId(id);
}

export async function updateProfile(
  userId: string,
  data: { name?: string; email?: string },
): Promise<void> {
  const repo = getRepositories().users;
  if (data.name !== undefined && data.name.trim().length < 2) {
    throw new UserServiceError("Tên phải có ít nhất 2 ký tự.");
  }
  if (data.email !== undefined) {
    const email = data.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) throw new UserServiceError("Email không hợp lệ.");
    const existing = await repo.byEmail(email);
    if (existing && existing.id !== userId) {
      throw new UserServiceError("Email này đã được sử dụng.");
    }
    data.email = email;
  }
  await repo.updateProfile(userId, { name: data.name?.trim(), email: data.email });
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const repo = getRepositories().users;
  const user = await repo.byId(userId);
  if (!user) throw new UserServiceError("Không tìm thấy tài khoản.");
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw new UserServiceError("Mật khẩu hiện tại không đúng.");
  if (newPassword.length < 8) throw new UserServiceError("Mật khẩu mới phải có ít nhất 8 ký tự.");
  await repo.updatePassword(userId, await bcrypt.hash(newPassword, 10));
}

export async function ensureInviteCode(userId: string): Promise<string> {
  const repo = getRepositories().users;
  const user = await repo.byId(userId);
  if (!user) throw new UserServiceError("Không tìm thấy tài khoản.");
  if (user.inviteCode) return user.inviteCode;
  const code = randomBytes(4).toString("hex").toUpperCase();
  await repo.setInviteCode(userId, code);
  return code;
}
