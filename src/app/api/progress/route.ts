import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRepositories } from "@/server/repositories";

/**
 * Watch-progress endpoints.
 *
 * POST accepts both JSON fetch calls and `navigator.sendBeacon` payloads
 * (sent as text/plain on page unload), so progress survives tab closes.
 */

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  let body: unknown;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }

  const { episodeId, movieId, position, duration } = (body ?? {}) as Record<string, unknown>;
  if (
    typeof episodeId !== "string" ||
    typeof movieId !== "string" ||
    typeof position !== "number" ||
    typeof duration !== "number" ||
    !Number.isFinite(position) ||
    !Number.isFinite(duration)
  ) {
    return NextResponse.json({ ok: false, error: "invalid-payload" }, { status: 400 });
  }

  await getRepositories().progress.upsert(session.user.id, {
    episodeId,
    movieId,
    position: Math.max(0, position),
    duration: Math.max(0, duration),
  });
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ position: 0 });

  const episodeId = new URL(req.url).searchParams.get("episodeId");
  if (!episodeId) return NextResponse.json({ position: 0 });

  const progress = await getRepositories().progress.get(session.user.id, episodeId);
  return NextResponse.json({ position: progress?.position ?? 0 });
}
