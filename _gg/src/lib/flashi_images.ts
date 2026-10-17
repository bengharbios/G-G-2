// ════════════════════════════════════════════════════════════════════════
// Spot-the-Difference Image Catalog (7,005 images)
// Originally extracted from https://www.flashi.me/f10/diff — now bundled locally
// under /public/img/spotdiff/images/{category}/<filename>.jpg
// Zero runtime dependency on flashi.me.
//
// Each image contains TWO stacked versions of the same photo:
//   - Image A on top
//   - Image B on bottom (shifted down by imageShift = 53.9 vmin)
// Differences between A and B are encoded IN THE FILENAME as coordinates.
//
// Filename format: <top1>z<left1>x<top2>z<left2>y<top3>z<left3>x...y...
//   - Split by 'y' → each part is one difference
//   - Each part: split by 'x' → [topStr, leftStr]
//   - Replace 'z' with '.' to get decimal vmin coordinates
//
// Example: -0z20x43z51y27z54x29z94y23z35x67z27y13z97x5z59y56z29x19z16
//   → 5 differences:
//     #1: top=-0.2 vmin, left=43.51 vmin
//     #2: top=27.54 vmin, left=29.94 vmin
//     ...
// ════════════════════════════════════════════════════════════════════════

export type FlashiCategory = 'photo' | 'vmisc' | 'vscenes' | 'vphoto' | 'photo3' | 'vector3';

export interface FlashiImage {
  category: FlashiCategory;
  filename: string;
  url: string;
  dirname: string;
  basename: string;
  extension: string;
}

export interface FlashiDiff {
  top: number;   // vmin (vertical position in image A)
  left: number;  // vmin (horizontal position)
  // For image B (bottom), top = top + IMAGE_SHIFT
}

export const FLASHI_IMAGE_SHIFT = 53.9; // vmin — vertical offset between image A and image B

// ─── Local image root (served from /public/img/spotdiff/images) ───────
// All 7,005 flashi images are bundled with our app — zero dependency on flashi.me.
// Originals were .png on flashi.me; we re-saved them as .jpg to cut size
// from ~3 GB -> ~966 MB with no visible quality loss at typical game sizes.
export const FLASHI_BASE_URL = '/img/spotdiff/images';

// ─── Decode a flashi filename into difference coordinates ──────────────
export function decodeFlashiFilename(filename: string): FlashiDiff[] {
  const parts = filename.split('y');
  const diffs: FlashiDiff[] = [];
  for (const part of parts) {
    const [topStr, leftStr] = part.split('x');
    if (topStr === undefined || leftStr === undefined) continue;
    const top = parseFloat(topStr.replace(/z/g, '.'));
    const left = parseFloat(leftStr.replace(/z/g, '.'));
    if (Number.isFinite(top) && Number.isFinite(left)) {
      diffs.push({ top, left });
    }
  }
  return diffs;
}

// ─── Build the local URL for a flashi image ────────────────────────────
// Returns a path like: /img/spotdiff/images/photo3/<filename>.jpg
// This path is resolved against our Next.js public/ folder at runtime.
export function buildFlashiUrl(category: FlashiCategory, filename: string): string {
  return `${FLASHI_BASE_URL}/${category}/${filename}.jpg`;
}

// ─── Load the catalog from our local JSON manifests ────────────────────
// Catalog files live at /public/img/spotdiff/catalog/{category}Array.json
// and were extracted from the original flashi source. Each entry contains:
//   { filename, dirname, basename, extension } — only `filename` is used at runtime.
export async function loadFlashiCatalog(): Promise<FlashiImage[]> {
  const categories: FlashiCategory[] = ['photo', 'vmisc', 'vscenes', 'vphoto', 'photo3', 'vector3'];
  const all: FlashiImage[] = [];
  for (const category of categories) {
    try {
      const response = await fetch(`/img/spotdiff/catalog/${category}Array.json`);
      if (!response.ok) continue;
      const arr = await response.json() as Array<{ filename: string; dirname: string; basename: string; extension: string }>;
      for (const item of arr) {
        all.push({
          category,
          filename: item.filename,
          url: buildFlashiUrl(category, item.filename),
          dirname: item.dirname,
          basename: item.basename,
          extension: item.extension,
        });
      }
    } catch (e) {
      console.warn(`Failed to load flashi category ${category}:`, e);
    }
  }
  return all;
}

// ─── Pick N random images from a category (for a game round) ───────────
export function pickRandomImages(catalog: FlashiImage[], category: FlashiCategory | 'random', count: number): FlashiImage[] {
  let pool: FlashiImage[];
  if (category === 'random') {
    pool = [...catalog];
  } else {
    pool = catalog.filter(img => img.category === category);
  }
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

// ─── Summary stats (for display in the UI) ──────────────────────────────
export const FLASHI_CATALOG_STATS = {
  totalImages: 7005,
  categories: {
    photo: 1499,
    vmisc: 4841,
    vscenes: 525,
    vphoto: 98,
    photo3: 23,
    vector3: 19,
  } as Record<FlashiCategory, number>,
  // Original source archived locally — no runtime dependency on flashi.me
  originalSource: 'https://www.flashi.me/f10/diff (archived — now bundled locally)',
  bundledLocallyAt: '/public/img/spotdiff/images/{category}/<filename>.jpg',
  extractedAt: '2026-10-17',
};
