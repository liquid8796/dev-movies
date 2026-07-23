import { cached } from "@/server/cache";
import { getDownloadInfo, isOneDriveConfigured } from "@/server/onedrive/client";
import { getRepositories } from "@/server/repositories";
import type { StreamSource } from "@/types";

/**
 * Streaming service — resolves an episode to a playable URL.
 *
 * Priority:
 *  1. OneDrive (when configured and the episode has an item id / path):
 *     the pre-authenticated download URL is cached for 45 minutes (they are
 *     valid ~1 hour) and the player is 302-redirected to it. Bytes flow from
 *     Microsoft's CDN straight to the viewer with full Range support — the
 *     serverless function only does a cache lookup, which is what makes 4K
 *     playback smooth.
 *  2. `fallbackUrl` — public demo sources, used until OneDrive is connected.
 */

const DOWNLOAD_URL_TTL = 45 * 60;

export async function resolveStream(episodeId: string): Promise<StreamSource | null> {
  const source = await getRepositories().movies.episodeSource(episodeId);
  if (!source) return null;

  const hasOneDriveRef = Boolean(source.oneDriveItemId || source.oneDrivePath);
  if (isOneDriveConfigured() && hasOneDriveRef) {
    try {
      const info = await cached(`stream:url:v1:${episodeId}`, DOWNLOAD_URL_TTL, () =>
        getDownloadInfo({ itemId: source.oneDriveItemId, path: source.oneDrivePath }),
      );
      return { url: info.downloadUrl, type: source.sourceType, origin: "onedrive" };
    } catch (error) {
      console.error(`OneDrive resolution failed for episode ${episodeId}:`, error);
      // fall through to fallbackUrl so playback degrades gracefully
    }
  }

  if (source.fallbackUrl) {
    return { url: source.fallbackUrl, type: source.sourceType, origin: "fallback" };
  }
  return null;
}
