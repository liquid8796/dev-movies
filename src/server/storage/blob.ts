import { put, del, list } from "@vercel/blob";

/**
 * Vercel Blob wrapper — fast object storage for posters, backdrops and
 * subtitles. Movie files themselves live on OneDrive; Blob holds the small,
 * hot, CDN-cacheable assets.
 */

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function uploadImage(
  pathname: string,
  body: Blob | ArrayBuffer | Buffer,
  contentType: string,
): Promise<string> {
  const result = await put(pathname, body, {
    access: "public",
    contentType,
    addRandomSuffix: false,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });
  return result.url;
}

export async function deleteBlob(url: string): Promise<void> {
  await del(url);
}

export async function listBlobs(prefix: string) {
  return list({ prefix });
}
