// ════════════════════════════════════════════════════════════════════════
// سفن (Battleship / Memory Match-2) — Game Types
// Mirrors spotdiff-types.ts structure but adapted for Memory game.
//
// Game flow:
//   1. Host picks grid size (16/25/36/49 squares) + theme (1..6)
//   2. N pairs of images are placed face-down in the grid (2 of each)
//   3. Player flips 2 cards per turn — if they match, stays revealed (+1 score)
//   4. If no match, cards flip back after 1s
//   5. Round ends when all pairs are found OR time runs out
//   6. Score = matches × scorePerMatch - misses × penaltyPerMiss
// ════════════════════════════════════════════════════════════════════════

export type GamePhase = 'landing' | 'setup' | 'playing' | 'game_over';
export type GameMode = 'classic' | 'diwaniya';

export type Difficulty = 'easy' | 'medium' | 'hard';

// A single card in the grid
export interface GuessCard {
  id: number;          // card ID (1..N)
  imageId: number;     // which image (1..890) is on this card
  imageUrl: string;    // pre-built URL for performance
  flipped: boolean;    // currently face-up (showing image)
  matched: boolean;    // permanently revealed (matched pair)
}

// A pair that has been matched (for the score log)
export interface MatchedPair {
  imageId: number;
  cardIds: [number, number];
  matchedAt: number;
}

// Per-difficulty config
export const DIFFICULTY_CONFIG: Record<Difficulty, {
  label: string;
  timePerRoundSec: number;
  scorePerMatch: number;
  penaltyPerMiss: number;
}> = {
  easy: { label: 'سهل', timePerRoundSec: 90, scorePerMatch: 100, penaltyPerMiss: 10 },
  medium: { label: 'متوسط', timePerRoundSec: 60, scorePerMatch: 150, penaltyPerMiss: 20 },
  hard: { label: 'صعب', timePerRoundSec: 40, scorePerMatch: 250, penaltyPerMiss: 35 },
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

// ─── A single round ──────────────────────────────────────────────────────
export interface BattleshipRound {
  id: string;
  title: string;
  // Grid config (set by host in GameSetup)
  gridSquares: number;     // 16/25/36/49
  gridRows: number;        // 4/5/6/7
  pairsCount: number;      // 8/12/18/24
  themeId: number;         // 1..6
  // Cards (shuffled into the grid)
  cards: GuessCard[];
  // Matched pairs (for game-over display)
  matchedPairs: MatchedPair[];
}

// Flashi category labels (kept for compat with the spotdiff-style setup UI)
export const FLASHI_CATEGORY_LABELS: Record<string, string> = {
  random: 'عشوائي',
};

// Hit radius (kept for compat — unused in Memory game)
export const FLASHI_HIT_RADIUS_VMIN = 5.5;
