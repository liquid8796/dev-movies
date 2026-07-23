import { RESOLUTION_ORDER } from "@/lib/constants";
import { cached } from "@/server/cache";
import { getDownloadInfo, isOneDriveConfigured } from "@/server/onedrive/client";
import { getRepositories } from "@/server/repositories";
import type { Resolution, StreamSource } from "@/types";

/**
 * Streaming service — resolves an episode (+ preferred resolution) to a
 * playable URL. Each episode offers per-resolution variants (4K/1080p/720p/
 * 360p); the viewer picks one in the player, defaulting to the best available.
 *
 * Per variant the priority is:
 *  1. OneDrive (when configured and the variant has an item id / path):
 *     the pre-authenticated download URL is cached for 45 minutes (they are
 *     valid ~1 hour) and played straight from Microsoft's CDN with full Range
 *     support — bytes never pass through the serverless function, which is
 *     what makes 4K playback smooth.
 *  2. `fallbackUrl` — public demo/backup sources.
 */

const DOWNLOAD_URL_TTL = 45 * 60;

function sortByResolution<T extends { resolution: Resolution }>(sources: T[]): T[] {
  return [...sources].sort(
    (a, b) => RESOLUTION_ORDER.indexOf(a.resolution) - RESOLUTION_ORDER.indexOf(b.resolution),
  );
}

export async function resolveStream(
  episodeId: string,
  preferred?: Resolution,
): Promise<StreamSource | null> {
  const sources = sortByResolution(await getRepositories().movies.episodeSources(episodeId));
  if (sources.length === 0) return null;

  const available = sources.map((s) => ({
    resolution: s.resolution,
    sourceType: s.sourceType,
  }));

  // Preferred variant first, then best-to-worst as fallback candidates.
  const candidates = [
    ...sources.filter((s) => s.resolution === preferred),
    ...sources.filter((s) => s.resolution !== preferred),
  ];

  for (const source of candidates) {
    const hasOneDriveRef = Boolean(source.oneDriveItemId || source.oneDrivePath);
    if (isOneDriveConfigured() && hasOneDriveRef) {
      try {
        const info = await cached(
          `stream:url:v2:${episodeId}:${source.resolution}`,
          DOWNLOAD_URL_TTL,
          () => getDownloadInfo({ itemId: source.oneDriveItemId, path: source.oneDrivePath }),
        );
        return {
          url: info.downloadUrl,
          type: source.sourceType,
          origin: "onedrive",
          resolution: source.resolution,
          available,
        };
      } catch (error) {
        console.error(
          `OneDrive resolution failed for episode ${episodeId} (${source.resolution}):`,
          error,
        );
        // fall through to fallbackUrl / next candidate so playback degrades gracefully
      }
    }
    if (source.fallbackUrl) {
      return {
        url: source.fallbackUrl,
        type: source.sourceType,
        origin: "fallback",
        resolution: source.resolution,
        available,
      };
    }
  }
  return null;
}
