import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isBlobConfigured, uploadImage } from "@/server/storage/blob";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_SIZE = 8 * 1024 * 1024;

function isAdmin(email: string | null | undefined): boolean {
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email && admins.includes(email.toLowerCase()));
}

/**
 * POST /api/upload — admin-only poster/backdrop upload into Vercel Blob.
 * multipart/form-data: file=<image>, kind=posters|backdrops, name=<slug>
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!isBlobConfigured()) {
    return NextResponse.json({ error: "blob-not-configured" }, { status: 503 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "posters");
  const name = String(form.get("name") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing-file" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "unsupported-type" }, { status: 415 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "file-too-large" }, { status: 413 });
  }
  if (!/^[a-z0-9-]+$/.test(name) || !["posters", "backdrops"].includes(kind)) {
    return NextResponse.json({ error: "invalid-name" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const url = await uploadImage(`${kind}/${name}.${ext}`, file, file.type);
  return NextResponse.json({ url });
}
