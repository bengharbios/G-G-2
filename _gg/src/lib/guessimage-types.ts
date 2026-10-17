// ============================================================
// خمن الصورة (Guess the Image) — Game Types
// ============================================================

export type GamePhase = 'landing' | 'setup' | 'playing' | 'game_over';

export type GameMode = 'classic' | 'diwaniya';

export type Difficulty = 'easy' | 'medium' | 'hard';

// ─── Normalized coords (0..1, 0..1) relative to image bounds ──────────
// Used by legacy SVG rounds (GUESSIMAGE_ROUNDS) — kept for fallback.
export interface DifferenceSpot {
  id: string;
  x: number;
  y: number;
  radius: number;
  found: boolean;
}

// ─── Flashi diff coords (top/left in vmin units relative to a 100vmin × 100vmin viewport frame) ──
// Per flashi source: a single flashi image bundles TWO stacked photos
// (image A on top, image B on bottom, shifted by `imageShift` vmin).
// Each difference appears once in image A (top/left) and once in image B
// (top + imageShift / left). User clicks on image B.
export interface FlashiDiffCoords {
  topVmin: number;     // top position in vmin (image A coords)
  leftVmin: number;    // left position in vmin
}

// ─── A single round (either SVG-style or flashi-style) ──────────────────
export interface GuessImageRound {
  id: string;
  title: string;        // Arabic title
  // Legacy: separate SVG imageA / imageB data URLs
  imageA: string;
  imageB: string;
  differences: DifferenceSpot[];
  // Flashi-style: single bundled image (A + B stacked) + vmin coords
  imageUrl?: string;            // path to flashi image (contains A on top + B on bottom)
  imageShift?: number;          // vertical vmin offset between A and B (53.5 / 67.5 / 68.5)
  flashiDiffs?: FlashiDiffCoords[]; // decoded from filename — top/left in vmin
  flashiCategory?: string;      // 'photo' | 'vmisc' | 'vscenes' | 'vphoto' | 'photo3' | 'vector3'
  // Guess-the-Image specific:
  answer?: string;              // the correct answer (the word the player must guess)
  hint?: string;                // a hint shown to the player (e.g., 'مكان للنزهة')
}

// ─── Per-difficulty config ───
export const DIFFICULTY_CONFIG: Record<Difficulty, {
  label: string;
  timePerRoundSec: number;
  scorePerHit: number;
  penaltyPerMiss: number;
  hintRadiusMultiplier: number;
}> = {
  easy: {
    label: 'سهل',
    timePerRoundSec: 90,
    scorePerHit: 100,
    penaltyPerMiss: 10,
    hintRadiusMultiplier: 1.0,
  },
  medium: {
    label: 'متوسط',
    timePerRoundSec: 60,
    scorePerHit: 150,
    penaltyPerMiss: 20,
    hintRadiusMultiplier: 1.0,
  },
  hard: {
    label: 'صعب',
    timePerRoundSec: 40,
    scorePerHit: 250,
    penaltyPerMiss: 35,
    hintRadiusMultiplier: 1.0,
  },
};

export interface RoundCountOption {
  value: number;
  label: string;
}

export const ROUND_COUNT_OPTIONS: RoundCountOption[] = [
  { value: 3, label: '3 جولات' },
  { value: 5, label: '5 جولات' },
  { value: 10, label: '10 جولات' },
];

export interface GameLogEntry {
  round: number;
  message: string;
  type: 'info' | 'success' | 'danger' | 'system';
  timestamp: number;
}

// ─── Flashi category metadata ───────────────────────────────────────────
export const FLASHI_CATEGORY_LABELS: Record<string, string> = {
  random: 'عشوائي',
  photo: 'فوتوغرافي',
  vmisc: 'رسوم (منوعات)',
  vscenes: 'رسوم (مشاهد)',
  vphoto: 'فوتوغرافي 2',
  photo3: 'فوتوغرافي 3',
  vector3: 'رسوم 3',
};

// Hit radius (in vmin) — half of the visible circle (9.5 vmin) plus tolerance
export const FLASHI_HIT_RADIUS_VMIN = 5.5;
