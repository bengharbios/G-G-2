// ============================================================
// اختلاف الصور (Spot the Difference) — Game Types
// ============================================================

export type GamePhase = 'landing' | 'setup' | 'playing' | 'game_over';

export type GameMode = 'classic' | 'diwaniya';

export type Difficulty = 'easy' | 'medium' | 'hard';

// Normalized coords (0..1, 0..1) relative to image bounds
// radius is also normalized (relative to image width)
export interface DifferenceSpot {
  id: string;
  x: number;
  y: number;
  radius: number;
  found: boolean;
}

export interface SpotDiffRound {
  id: string;
  title: string;        // Arabic title
  imageA: string;      // SVG data URL or path
  imageB: string;
  differences: DifferenceSpot[];
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
