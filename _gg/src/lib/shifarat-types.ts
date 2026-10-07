// ============================================================
// SHIFARAT TYPES - Comprehensive types for Codenames board game
// ============================================================

// ─── Card & Board ───────────────────────────────────────────

/** Card colors on the board */
export type CardColor = 'red' | 'blue' | 'neutral' | 'assassin';

/** Team colors */
export type TeamColor = 'red' | 'blue';

/** A single card on the 5×5 board */
export interface BoardCard {
  /** 0-24 (position) */
  id: number;
  /** Arabic word displayed on the card */
  word: string;
  /** Category key this word belongs to */
  category: string;
  /** Hidden color — only the spymaster sees this */
  color: CardColor;
  /** true after the card has been guessed */
  isRevealed: boolean;
  /** Which team revealed this card (null if not yet revealed) */
  guessedBy: TeamColor | null;
}

// ─── Clues ──────────────────────────────────────────────────

/** Clue given by the spymaster */
export interface Clue {
  /** The clue word */
  word: string;
  /** How many words the team can guess */
  number: number;
  /** Which team gave this clue */
  team: TeamColor;
  /** Unix timestamp */
  timestamp: number;
}

// ─── Game Phases ────────────────────────────────────────────

/**
 * Game phases for the new Codenames flow.
 *
 * Flow: setup → spymaster_view → clue_given → team_guessing → turn_result
 *       ↳ turn_switch → spymaster_view (next team)
 *       ↳ game_over
 */
export type GamePhase =
  | 'setup'            // Before the game starts
  | 'spymaster_view'   // Spymaster sees the board + gives clue
  | 'clue_given'       // Clue is displayed, team prepares to guess
  | 'team_guessing'    // Team is selecting words on the board
  | 'turn_result'      // Show result of the last guess
  | 'turn_switch'      // Switching turns between teams
  | 'game_over';       // Game has ended

// ─── Team Info ──────────────────────────────────────────────

/** Information about a team */
export interface TeamInfo {
  name: string;
  /** Words found so far */
  score: number;
  /** Spymaster player name (null if not set) */
  spymaster: string | null;
  /** How many of the team's words remain hidden on the board */
  wordsRemaining: number;
}

// ─── Game Settings ──────────────────────────────────────────

/** Configurable game settings */
export interface GameSettings {
  /** Seconds per turn (30/60/90/120/unlimited=0) */
  timerDuration: number;
  /** Which categories to draw words from */
  selectedCategories: string[];
  /** Which team starts (red always gets 9 words, blue gets 8) */
  firstTeam: TeamColor;
}

// ─── Full Game State ────────────────────────────────────────

/** Complete state of a Shifarat / Codenames game */
export interface ShifaratGameState {
  // ── Board ──
  board: BoardCard[];

  // ── Teams ──
  redTeam: TeamInfo;
  blueTeam: TeamInfo;

  // ── Turn management ──
  startingTeam: TeamColor;
  currentTeam: TeamColor;
  phase: GamePhase;
  roundNumber: number;

  // ── Current clue & guessing ──
  currentClue: Clue | null;
  /** How many guesses the team has made this turn */
  guessesThisTurn: number;
  /** Max guesses allowed (clueNumber + 1 bonus) */
  guessesAllowed: number;

  // ── Timer ──
  timerDuration: number;
  timerRemaining: number;
  isTimerActive: boolean;

  // ── Game history ──
  clues: Clue[];
  gameLog: GameLogEntry[];

  // ── Game mode ──
  gameMode: 'godfather' | 'diwaniya';
  roomCode: string | null;
  hostName: string | null;

  // ── Result ──
  winner: TeamColor | null;
  /** 'all_found' | 'assassin' | 'opponent_finished' */
  winReason: string | null;

  // ── Categories used ──
  selectedCategories: string[];
}

// ─── Game Log ───────────────────────────────────────────────

/** A single entry in the game log */
export interface GameLogEntry {
  type:
    | 'clue'
    | 'correct'
    | 'wrong'
    | 'neutral'
    | 'assassin'
    | 'turn_start'
    | 'turn_end'
    | 'game_over';
  team?: TeamColor;
  word?: string;
  message: string;
  timestamp: number;
}

// ─── View Mode ──────────────────────────────────────────────

/** View mode for Godfather (which role currently sees the screen) */
export type ViewMode = 'spymaster' | 'team' | 'transition';

// ============================================================
// LEGACY TYPES — Kept for backward compatibility with
// shifarat-words.ts, shifarat-store.ts, and existing components.
// These will be removed once all consumers are migrated.
// ============================================================

/** @legacy Used by shifarat-words.ts and shifarat-store.ts */
export type ShifaratGameMode = 'godfather' | 'diwaniya' | null;

/** @legacy Used by shifarat-store.ts */
export type ShifaratGamePhase = 'setup' | 'playing' | 'round_end' | 'game_over';

/** @legacy Used by shifarat-store.ts */
export type ShifaratRoundStatus = 'active' | 'correct' | 'wrong' | 'time_up';

/** @legacy Used by shifarat-words.ts */
export interface WordEntry {
  w: string;
  hint: string;
}

/** @legacy Used by shifarat-store.ts */
export interface ShifaratTeam {
  name: string;
  score: number;
}
