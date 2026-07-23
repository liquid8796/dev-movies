/**
 * Generates deterministic poster (400x600) and backdrop (1280x720) artwork for
 * every catalog entry as JPEG files in /public. Pure placeholder art — replace
 * with real artwork (or Blob URLs) whenever you like.
 *
 * Run: npm run posters
 */
import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { CATALOG } from "../src/data/catalog";

const PALETTES: [string, string, string][] = [
  ["#0f2027", "#203a43", "#2c5364"],
  ["#232526", "#414345", "#6b2d5c"],
  ["#1a2a6c", "#b21f1f", "#fdbb2d"],
  ["#0f0c29", "#302b63", "#24243e"],
  ["#42275a", "#734b6d", "#2c1e3f"],
  ["#141e30", "#243b55", "#3a6073"],
  ["#2c3e50", "#4ca1af", "#1f3b4d"],
  ["#3a1c71", "#d76d77", "#ffaf7b"],
  ["#000428", "#004e92", "#001f4d"],
  ["#134e5e", "#71b280", "#0d3b3f"],
  ["#5f2c82", "#49a09d", "#2b1a4a"],
  ["#1e130c", "#9a8478", "#3e2b23"],
];

function hashIndex(seed: string, mod: number): number {
  const hex = createHash("md5").update(seed).digest("hex");
  return parseInt(hex.slice(0, 8), 16) % mod;
}

function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Naive word-wrap for SVG text. */
function wrap(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > maxChars && line) {
      lines.push(line.trim());
      line = word;
    } else {
      line = `${line} ${word}`;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.slice(0, 4);
}

function posterSvg(title: string, year: number, quality: string, seed: string): string {
  const [c1, c2, c3] = PALETTES[hashIndex(seed, PALETTES.length)];
  const angle = hashIndex(`${seed}:a`, 360);
  const cx = 15 + hashIndex(`${seed}:x`, 70);
  const cy = 15 + hashIndex(`${seed}:y`, 40);
  const lines = wrap(title.toUpperCase(), 14);
  const lineHeight = 44;
  const startY = 470 - (lines.length - 1) * lineHeight;
  const text = lines
    .map(
      (line, i) =>
        `<text x="36" y="${startY + i * lineHeight}" font-family="Arial Black, Arial, sans-serif" font-size="38" font-weight="900" fill="#ffffff" opacity="0.95">${escapeXml(line)}</text>`,
    )
    .join("");

  return `<svg width="400" height="600" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" gradientTransform="rotate(${angle} 0.5 0.5)">
      <stop offset="0%" stop-color="${c1}"/><stop offset="55%" stop-color="${c2}"/><stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
    <radialGradient id="glow" cx="${cx}%" cy="${cy}%" r="60%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="45%" stop-color="#000000" stop-opacity="0"/><stop offset="100%" stop-color="#000000" stop-opacity="0.72"/>
    </linearGradient>
  </defs>
  <rect width="400" height="600" fill="url(#bg)"/>
  <rect width="400" height="600" fill="url(#glow)"/>
  <circle cx="${330 - hashIndex(`${seed}:c`, 60)}" cy="${90 + hashIndex(`${seed}:d`, 80)}" r="${60 + hashIndex(`${seed}:r`, 70)}" fill="#ffffff" opacity="0.06"/>
  <circle cx="${60 + hashIndex(`${seed}:e`, 60)}" cy="${420 + hashIndex(`${seed}:f`, 100)}" r="${90 + hashIndex(`${seed}:g`, 80)}" fill="#000000" opacity="0.14"/>
  <rect width="400" height="600" fill="url(#shade)"/>
  <rect x="36" y="${startY - 74}" width="46" height="5" rx="2.5" fill="#d9b45b"/>
  ${text}
  <text x="36" y="${startY + (lines.length - 1) * lineHeight + 40}" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="#d9b45b">${year}</text>
  <rect x="308" y="24" width="66" height="30" rx="6" fill="#000000" opacity="0.55"/>
  <text x="341" y="45" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="800" fill="#d9b45b">${escapeXml(quality)}</text>
</svg>`;
}

function backdropSvg(title: string, seed: string): string {
  const [c1, c2, c3] = PALETTES[hashIndex(seed, PALETTES.length)];
  const lines = wrap(title.toUpperCase(), 26);
  const text = lines
    .map(
      (line, i) =>
        `<text x="80" y="${560 + i * 62}" font-family="Arial Black, Arial, sans-serif" font-size="54" font-weight="900" fill="#ffffff" opacity="0.92">${escapeXml(line)}</text>`,
    )
    .join("");

  return `<svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/><stop offset="55%" stop-color="${c2}"/><stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
    <radialGradient id="glow" cx="75%" cy="25%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="40%" stop-color="#000000" stop-opacity="0"/><stop offset="100%" stop-color="#000000" stop-opacity="0.7"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect width="1280" height="720" fill="url(#glow)"/>
  <circle cx="${900 + hashIndex(`${seed}:h`, 200)}" cy="${150 + hashIndex(`${seed}:i`, 150)}" r="${140 + hashIndex(`${seed}:j`, 120)}" fill="#ffffff" opacity="0.05"/>
  <circle cx="${200 + hashIndex(`${seed}:k`, 200)}" cy="${500 + hashIndex(`${seed}:l`, 120)}" r="${180 + hashIndex(`${seed}:m`, 100)}" fill="#000000" opacity="0.12"/>
  <rect width="1280" height="720" fill="url(#shade)"/>
  ${text}
</svg>`;
}

async function main() {
  const posterDir = path.join(process.cwd(), "public", "posters");
  const backdropDir = path.join(process.cwd(), "public", "backdrops");
  mkdirSync(posterDir, { recursive: true });
  mkdirSync(backdropDir, { recursive: true });

  for (const movie of CATALOG) {
    await sharp(Buffer.from(posterSvg(movie.title, movie.year, movie.quality, movie.slug)))
      .jpeg({ quality: 85 })
      .toFile(path.join(posterDir, `${movie.slug}.jpg`));
    await sharp(Buffer.from(backdropSvg(movie.title, movie.slug)))
      .jpeg({ quality: 82 })
      .toFile(path.join(backdropDir, `${movie.slug}.jpg`));
    console.log(`✓ ${movie.slug}`);
  }

  // Generic fallback artwork for admin-created movies without images yet.
  await sharp(Buffer.from(posterSvg("PhimVerse", new Date().getFullYear(), "HD", "_placeholder")))
    .jpeg({ quality: 85 })
    .toFile(path.join(posterDir, "_placeholder.jpg"));
  await sharp(Buffer.from(backdropSvg("PhimVerse", "_placeholder")))
    .jpeg({ quality: 82 })
    .toFile(path.join(backdropDir, "_placeholder.jpg"));
  console.log("✓ _placeholder");

  console.log(`\nDone: ${CATALOG.length + 1} posters + backdrops in /public.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
