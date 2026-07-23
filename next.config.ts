import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Posters/backdrops may come from Vercel Blob, TMDB or other CDNs.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        // Locally generated artwork never changes — cache aggressively.
        source: "/:kind(posters|backdrops)/:file*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
