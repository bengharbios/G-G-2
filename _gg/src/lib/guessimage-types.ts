// ════════════════════════════════════════════════════════════════════════
// خمن الصورة (Guess the Image) — Game Types
// Logic: image is covered by a grid of squares. Player reveals squares
// one at a time (limited reveals per round). After each reveal, player
// can submit a guess. If correct → score based on remaining reveals.
// If wrong → penalty + continue. Round ends on correct guess OR
// reveals exhausted OR time runs out.
// ════════════════════════════════════════════════════════════════════════

export type GamePhase = 'landing' | 'setup' | 'playing' | 'game_over';
export type GameMode = 'classic' | 'diwaniya';

export type Difficulty = 'easy' | 'medium' | 'hard';

// Per-difficulty config
export const DIFFICULTY_CONFIG: Record<Difficulty, {
  label: string;
  timePerRoundSec: number;
  scorePerCorrect: number;       // base score for correct guess
  penaltyPerWrong: number;       // penalty per wrong guess
  maxReveals: number;            // max squares player can reveal
  gridRows: number;              // grid size (NxN)
}> = {
  easy:   { label: 'سهل',   timePerRoundSec: 90,  scorePerCorrect: 500, penaltyPerWrong: 20, maxReveals: 12, gridRows: 4 },
  medium: { label: 'متوسط', timePerRoundSec: 60,  scorePerCorrect: 700, penaltyPerWrong: 30, maxReveals: 10, gridRows: 5 },
  hard:   { label: 'صعب',   timePerRoundSec: 40,  scorePerCorrect: 1000, penaltyPerWrong: 50, maxReveals: 8,  gridRows: 6 },
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

// A single revealed square in the grid
export interface RevealSquare {
  id: number;          // 1..N (N = gridRows × gridRows)
  row: number;
  col: number;
  revealed: boolean;   // is this square currently shown?
}

// A single round
export interface GuessImageRound {
  id: string;
  title: string;
  imageId: number;        // 1..890
  imageUrl: string;       // /img/guess/pics/{id}.png
  themeId: number;        // 1..6
  gridRows: number;       // 4/5/6
  maxReveals: number;     // 8/10/12
  squares: RevealSquare[];
  revealedCount: number;  // how many squares revealed so far
  guessed: boolean;       // did player guess correctly?
  wrongGuesses: number;  // count of wrong guesses
  // Multi-choice fields (NEW — replaces text-input submitGuess):
  choices: string[];              // 4 multi-choice labels
  correctChoiceIndex: number;     // 0..3 — index into choices[] of the correct answer
  answer: string;                  // the actual correct label (for verification/logging)
}

// Flashi category labels (compat — only 'random' for guessimage)
export const FLASHI_CATEGORY_LABELS: Record<string, string> = {
  random: 'عشوائي',
};

export const FLASHI_HIT_RADIUS_VMIN = 5.5;
