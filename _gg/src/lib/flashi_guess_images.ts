// ════════════════════════════════════════════════════════════════════════
// Flashi.me Guess-the-Image (Memory / Match-2) Image Catalog
// 890 images at /img/guess/pics/{1..890}.png
// 6 themes at /img/guess/themes/theme{1..6}.png + theme{1..6}/0.png
// Auxiliary: /img/guess/empty.png + /img/guess/new_image.png
//
// Original source: https://www.flashi.me/cuba/ship (server JS at
// /flashi-js/guess.js — 33 KB, obfuscated)
// All images bundled locally — zero runtime dependency on flashi.me.
// ════════════════════════════════════════════════════════════════════════

// Total number of bundled images (indices 1..890)
export const GUESS_IMAGE_COUNT = 890;
// Total number of themes
export const GUESS_THEME_COUNT = 6;

// ─── Build the local URL for a guess image ──────────────────────────────
// Returns: /img/guess/pics/{n}.png
export function buildGuessImageUrl(n: number): string {
  return `/img/guess/pics/${n}.png`;
}

// ─── Build the local URL for a theme preview ────────────────────────────
// Returns: /img/guess/themes/theme{n}.png
export function buildGuessThemeUrl(themeNumber: number): string {
  return `/img/guess/themes/theme${themeNumber}.png`;
}

// ─── Build the local URL for a theme's card-back (0.png) ────────────────
// Returns: /img/guess/themes/theme{n}/0.png
export function buildGuessCardBackUrl(themeNumber: number): string {
  return `/img/guess/themes/theme${themeNumber}/0.png`;
}

// ─── Auxiliary images ───────────────────────────────────────────────────
export const GUESS_EMPTY_IMAGE_URL = '/img/guess/empty.png';
export const GUESS_NEW_IMAGE_URL = '/img/guess/new_image.png';

// ─── A single image entry in the catalog ─────────────────────────────────
export interface GuessImage {
  id: number;       // 1..890
  url: string;      // /img/guess/pics/{id}.png
}

// ─── A theme entry ──────────────────────────────────────────────────────
export interface GuessTheme {
  id: number;       // 1..6
  previewUrl: string;     // /img/guess/themes/theme{n}.png
  cardBackUrl: string;    // /img/guess/themes/theme{n}/0.png
}

// ─── Build the full image catalog (statically — no fetch needed) ─────────
// All 890 images exist as simple sequentially-numbered files (1..890.png).
export function getGuessImageCatalog(): GuessImage[] {
  const all: GuessImage[] = [];
  for (let i = 1; i <= GUESS_IMAGE_COUNT; i++) {
    all.push({ id: i, url: buildGuessImageUrl(i) });
  }
  return all;
}

// ─── Build the theme catalog (statically) ────────────────────────────────
export function getGuessThemeCatalog(): GuessTheme[] {
  const themes: GuessTheme[] = [];
  for (let i = 1; i <= GUESS_THEME_COUNT; i++) {
    themes.push({
      id: i,
      previewUrl: buildGuessThemeUrl(i),
      cardBackUrl: buildGuessCardBackUrl(i),
    });
  }
  return themes;
}

// ─── Pick N random images from the catalog (for a Memory game round) ────
// Returns N unique random image IDs.
export function pickRandomGuessImages(catalog: GuessImage[], count: number): GuessImage[] {
  const pool = [...catalog];
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

// ─── Summary stats (for display in the UI) ──────────────────────────────
export const GUESS_CATALOG_STATS = {
  totalImages: GUESS_IMAGE_COUNT,
  totalThemes: GUESS_THEME_COUNT,
  originalSource: 'https://www.flashi.me/cuba/ship (archived — now bundled locally)',
  bundledLocallyAt: '/public/img/guess/pics/{id}.png + /public/img/guess/themes/theme{n}/',
  extractedAt: '2026-10-17',
};

// ─── Memory game round config ───────────────────────────────────────────
// numberOfSquares: total cards in the grid (must be even, since each image
//                  appears exactly twice in a Memory match-2 game)
// numberOfRows:    grid dimension (4×4=16, 5×5=25, 6×6=36, 7×7=49)
//                    Note: 5×5=25 is ODD — so for memory match, we use 24
//                    cards (one cell stays empty). flashi's original code
//                    handled this by leaving the center cell blank.
export const GUESS_GRID_OPTIONS: Array<{
  squares: number;
  rows: number;
  label: string;
  pairs: number;  // number of unique images needed (squares/2)
}> = [
  { squares: 16, rows: 4, label: '4×4 (16 بطاقة)', pairs: 8 },
  { squares: 25, rows: 5, label: '5×5 (24 بطاقة + 1 فارغة)', pairs: 12 },
  { squares: 36, rows: 6, label: '6×6 (36 بطاقة)', pairs: 18 },
  { squares: 49, rows: 7, label: '7×7 (48 بطاقة + 1 فارغة)', pairs: 24 },
];
