import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolveStream } from "@/server/services/stream.service";

/**
 * GET /api/stream/:episodeId
 *
 * Resolves the episode to a playable URL and 302-redirects the player to it.
 * For OneDrive sources this points at Microsoft's CDN (pre-authenticated,
 * Range-capable), so 4K bytes never pass through this function — it only does
 * a cache lookup and a redirect.
 *
 * Set STREAM_REQUIRE_AUTH=1 to restrict playback to signed-in users
 * (recommended in production to prevent hotlinking).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ episodeId: string }> },
) {
  if (process.env.STREAM_REQUIRE_AUTH === "1") {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
  }

  const { episodeId } = await params;
  const source = await resolveStream(episodeId);
  if (!source) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  return NextResponse.redirect(source.url, {
    status: 302,
    headers: {
      // The redirect target rotates (~1h expiry) — never cache the redirect itself.
      "Cache-Control": "private, no-store",
      "X-Stream-Origin": source.origin,
    },
  });
}
