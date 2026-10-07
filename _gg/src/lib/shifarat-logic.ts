// ============================================================
// SHIFARAT LOGIC - Pure game logic functions for Codenames
// ============================================================
//
// All functions are pure — they take state and return new state.
// No side effects, no external dependencies (except word lists).
//
// KEY RULES:
// 1. Board has 25 cards: 9 for starting team, 8 for opponent,
//    7 neutral, 1 assassin
// 2. Starting team (red) gets 9 words and goes first
// 3. Spymaster gives clue: one word + one number (1-9)
// 4. Team can guess up to (clueNumber + 1) words — the +1 is
//    a "free" wrong guess
// 5. Correct guess → team can keep guessing (up to limit)
// 6. Opponent's word → turn ends, card revealed
// 7. Neutral → turn ends, card revealed
// 8. Assassin → INSTANT LOSS for the guessing team
// 9. Team can stop guessing before using all guesses
// 10. Game ends when all team words found, or assassin revealed
// 11. Clue word CANNOT be any word currently on the board
// ============================================================

import type {
  BoardCard,
  CardColor,
  Clue,
  GameLogEntry,
  ShifaratGameState,
  TeamColor,
  TeamInfo,
} from './shifarat-types';

// ─── Constants ──────────────────────────────────────────────

/** Total cards on the board */
const BOARD_SIZE = 25;

/** Word counts per color for the starting team (gets 1 extra) */
const STARTING_TEAM_COUNT = 9;
const OTHER_TEAM_COUNT = 8;
const NEUTRAL_COUNT = 7;
const ASSASSIN_COUNT = 1;

/** Maximum guess number a spymaster can give */
const MAX_CLUE_NUMBER = 9;

// ─── Board Generation ───────────────────────────────────────

/**
 * Generate a new 5×5 board.
 *
 * - 9 cards for startingTeam (typically red)
 * - 8 cards for the other team
 * - 7 neutral cards
 * - 1 assassin card
 * - Words come from the provided word list
 *
 * @param words  Array of { w, cat } objects (at least 25 needed)
 * @param startingTeam  Which team goes first (gets 9 cards)
 * @returns A shuffled array of 25 BoardCard objects
 * @throws Error if fewer than 25 words are provided
 */
export function generateBoard(
  words: Array<{ w: string; cat: string }>,
  startingTeam: TeamColor
): BoardCard[] {
  if (words.length < BOARD_SIZE) {
    throw new Error(
      `Need at least ${BOARD_SIZE} words to generate a board, got ${words.length}`
    );
  }

  // Determine team colors
  const startingColor: CardColor = startingTeam;
  const otherColor: CardColor = startingTeam === 'red' ? 'blue' : 'red';

  // Build the color assignment array: 9 starting, 8 other, 7 neutral, 1 assassin
  const colorAssignments: CardColor[] = [
    ...Array(STARTING_TEAM_COUNT).fill(startingColor),
    ...Array(OTHER_TEAM_COUNT).fill(otherColor),
    ...Array(NEUTRAL_COUNT).fill('neutral' as CardColor),
    ...Array(ASSASSIN_COUNT).fill('assassin' as CardColor),
  ];

  // Shuffle both words and color assignments independently
  const shuffledWords = shuffleArray([...words]).slice(0, BOARD_SIZE);
  const shuffledColors = shuffleArray([...colorAssignments]);

  // Build board cards
  return shuffledWords.map((word, index) => ({
    id: index,
    word: word.w,
    category: word.cat,
    color: shuffledColors[index],
    isRevealed: false,
    guessedBy: null,
  }));
}

// ─── Initial State ──────────────────────────────────────────

/**
 * Create the initial game state before the first turn begins.
 *
 * @param settings  Game configuration
 * @returns A fresh ShifaratGameState with phase = 'spymaster_view'
 */
export function createInitialState(settings: {
  gameMode: 'godfather' | 'diwaniya';
  timerDuration: number;
  selectedCategories: string[];
  firstTeam: TeamColor;
  redTeamName: string;
  blueTeamName: string;
  roomCode?: string;
  hostName?: string;
}): ShifaratGameState {
  const {
    gameMode,
    timerDuration,
    selectedCategories,
    firstTeam,
    redTeamName,
    blueTeamName,
    roomCode,
    hostName,
  } = settings;

  // Build default team info
  const redTeam: TeamInfo = {
    name: redTeamName || 'الفريق الأحمر',
    score: 0,
    spymaster: null,
    wordsRemaining: firstTeam === 'red' ? STARTING_TEAM_COUNT : OTHER_TEAM_COUNT,
  };

  const blueTeam: TeamInfo = {
    name: blueTeamName || 'الفريق الأزرق',
    score: 0,
    spymaster: null,
    wordsRemaining: firstTeam === 'blue' ? STARTING_TEAM_COUNT : OTHER_TEAM_COUNT,
  };

  return {
    // Board — will be populated when startGame is called with actual words
    board: [],

    // Teams
    redTeam,
    blueTeam,

    // Turn management
    startingTeam: firstTeam,
    currentTeam: firstTeam,
    phase: 'setup',
    roundNumber: 1,

    // Current clue & guessing
    currentClue: null,
    guessesThisTurn: 0,
    guessesAllowed: 0,

    // Timer
    timerDuration,
    timerRemaining: timerDuration,
    isTimerActive: false,

    // Game history
    clues: [],
    gameLog: [],

    // Game mode
    gameMode,
    roomCode: roomCode ?? null,
    hostName: hostName ?? null,

    // Result
    winner: null,
    winReason: null,

    // Categories used
    selectedCategories,
  };
}

// ─── Clue Giving ────────────────────────────────────────────

/**
 * Give a clue (spymaster action).
 *
 * Transitions the game from 'spymaster_view' → 'clue_given'.
 *
 * @param state      Current game state
 * @param clueWord   The clue word (must be valid)
 * @param clueNumber How many words the team can guess (1-9)
 * @returns Updated game state
 * @throws Error if the clue is invalid
 */
export function giveClue(
  state: ShifaratGameState,
  clueWord: string,
  clueNumber: number
): ShifaratGameState {
  // Validate inputs
  if (!clueWord.trim()) {
    throw new Error('كلمة الدليل لا يمكن أن تكون فارغة');
  }

  if (clueNumber < 1 || clueNumber > MAX_CLUE_NUMBER) {
    throw new Error(
      `رقم الدليل يجب أن يكون بين 1 و ${MAX_CLUE_NUMBER}`
    );
  }

  // Clue word cannot match any word currently on the board
  if (!isValidClue(clueWord, state.board)) {
    throw new Error('كلمة الدليل موجودة بالفعل على اللوحة');
  }

  const trimmedWord = clueWord.trim();
  const now = Date.now();

  const clue: Clue = {
    word: trimmedWord,
    number: clueNumber,
    team: state.currentTeam,
    timestamp: now,
  };

  // Build log entry
  const teamName =
    state.currentTeam === 'red' ? state.redTeam.name : state.blueTeam.name;
  const logEntry: GameLogEntry = {
    type: 'clue',
    team: state.currentTeam,
    message: `جاسوس ${teamName}: "${trimmedWord}" — ${clueNumber}`,
    timestamp: now,
  };

  return {
    ...state,
    currentClue: clue,
    guessesThisTurn: 0,
    guessesAllowed: clueNumber + 1, // +1 bonus guess
    phase: 'clue_given',
    timerRemaining: state.timerDuration,
    isTimerActive: state.timerDuration > 0,
    clues: [...state.clues, clue],
    gameLog: [...state.gameLog, logEntry],
  };
}

// ─── Word Guessing ──────────────────────────────────────────

/**
 * Guess a word on the board (team action).
 *
 * Reveals the card and determines the outcome.
 *
 * @param state   Current game state
 * @param cardId  The ID (0-24) of the card being guessed
 * @returns Updated state + the result of the guess + whether the game ended
 * @throws Error if the card is already revealed or game is in wrong phase
 */
export function guessWord(
  state: ShifaratGameState,
  cardId: number
): {
  state: ShifaratGameState;
  result: 'correct' | 'wrong' | 'neutral' | 'assassin';
  gameEnded: boolean;
} {
  // ── DEFENSIVE: Validate state before anything ──
  if (!state || !state.board || !Array.isArray(state.board)) {
    console.error('[guessWord] Invalid state:', { hasState: !!state, hasBoard: !!state?.board, boardType: typeof state?.board });
    throw new Error(`حالة اللعبة غير صالحة: ${!state ? 'state is null' : !state.board ? 'board is missing' : 'board is not array'}`);
  }
  if (!state.redTeam || !state.blueTeam) {
    console.error('[guessWord] Missing teams:', { hasRed: !!state.redTeam, hasBlue: !!state.blueTeam });
    throw new Error('حالة اللعبة غير صالحة: الفريق مفقود');
  }
  if (!state.gameLog || !Array.isArray(state.gameLog)) {
    console.error('[guessWord] Missing gameLog:', { gameLog: state.gameLog });
    throw new Error('حالة اللعبة غير صالحة: سجل اللعبة مفقود');
  }

  // Find the card
  const card = state.board.find((c) => c.id === cardId);
  if (!card) {
    throw new Error(`البطاقة رقم ${cardId} غير موجودة`);
  }

  // Card must not already be revealed or previously guessed
  if (card.isRevealed || card.guessedBy) {
    throw new Error(`البطاقة "${card.word}" تم تخمينها بالفعل`);
  }

  // Game must be in guessing phase
  if (state.phase !== 'clue_given' && state.phase !== 'team_guessing') {
    throw new Error('اللعبة ليست في مرحلة التخمين');
  }

  // Check if guesses are exhausted
  if (state.guessesThisTurn >= state.guessesAllowed) {
    throw new Error('استنفدتم عدد التخمينات المسموح');
  }

  // Determine result based on card color vs current team
  let result: 'correct' | 'wrong' | 'neutral' | 'assassin';

  if (card.color === 'assassin') {
    result = 'assassin';
  } else if (card.color === state.currentTeam) {
    result = 'correct';
  } else if (card.color === 'neutral') {
    result = 'neutral';
  } else {
    // Opponent's card
    result = 'wrong';
  }

  // ── Build new board ──
  const newBoard: BoardCard[] = state.board.map((c) => {
    if (c.id !== cardId) return c;
    if (result === 'correct' || result === 'assassin') {
      return { ...c, isRevealed: true, guessedBy: state.currentTeam };
    } else {
      return { ...c, isRevealed: false, guessedBy: state.currentTeam };
    }
  });

  // ── Update team scores ──
  const newRedTeam: TeamInfo = { ...state.redTeam };
  const newBlueTeam: TeamInfo = { ...state.blueTeam };

  if (result === 'correct') {
    if (state.currentTeam === 'red') {
      newRedTeam.score = (newRedTeam.score || 0) + 1;
      newRedTeam.wordsRemaining = Math.max(0, (newRedTeam.wordsRemaining || 0) - 1);
    } else {
      newBlueTeam.score = (newBlueTeam.score || 0) + 1;
      newBlueTeam.wordsRemaining = Math.max(0, (newBlueTeam.wordsRemaining || 0) - 1);
    }
  } else if (result === 'wrong') {
    const opponentTeam: TeamColor = state.currentTeam === 'red' ? 'blue' : 'red';
    if (opponentTeam === 'red') {
      newRedTeam.wordsRemaining = Math.max(0, (newRedTeam.wordsRemaining || 0) - 1);
    } else {
      newBlueTeam.wordsRemaining = Math.max(0, (newBlueTeam.wordsRemaining || 0) - 1);
    }
  }

  // ── Build log entry ──
  const now = Date.now();
  const teamName =
    state.currentTeam === 'red' ? state.redTeam.name : state.blueTeam.name;

  let logMessage: string;
  switch (result) {
    case 'correct':
      logMessage = `${teamName}: "${card.word}" ✓ صحيح`;
      break;
    case 'wrong':
      logMessage = `${teamName}: "${card.word}" ✗ خطأ — انتهى الدور`;
      break;
    case 'neutral':
      logMessage = `${teamName}: "${card.word}" ✗ خطأ — انتهى الدور`;
      break;
    case 'assassin':
      logMessage = `${teamName}: "${card.word}" 💀 القاتل! خسارة فورية!`;
      break;
  }

  const logEntry: GameLogEntry = {
    type: result,
    team: state.currentTeam,
    word: card.word,
    message: logMessage,
    timestamp: now,
  };

  // ── Check game end ──
  const gameCheck = checkGameEnd(
    { board: newBoard, redTeam: newRedTeam, blueTeam: newBlueTeam, currentTeam: state.currentTeam },
    result
  );

  const newGuessesThisTurn = state.guessesThisTurn + 1;

  if (gameCheck.isOver) {
    const gameOverLog: GameLogEntry = {
      type: 'game_over',
      team: gameCheck.winner ?? undefined,
      message: gameCheck.winner
        ? `فاز ${gameCheck.winner === 'red' ? state.redTeam.name : state.blueTeam.name}!`
        : 'انتهت اللعبة!',
      timestamp: now,
    };

    const newState: ShifaratGameState = {
      ...state,
      board: newBoard,
      redTeam: newRedTeam,
      blueTeam: newBlueTeam,
      guessesThisTurn: newGuessesThisTurn,
      phase: 'game_over',
      isTimerActive: false,
      winner: gameCheck.winner,
      winReason: gameCheck.reason,
      gameLog: [...(state.gameLog || []), logEntry, gameOverLog],
    };

    return { state: newState, result, gameEnded: true };
  }

  // ── Determine next phase ──
  let nextPhase: ShifaratGameState['phase'];
  let switchTeam = false;

  if (result === 'correct' && newGuessesThisTurn < state.guessesAllowed) {
    nextPhase = 'team_guessing';
  } else {
    nextPhase = 'turn_result';
    switchTeam = true;
  }

  // Build game log
  const newGameLog = [...(state.gameLog || []), logEntry];

  if (switchTeam) {
    const switchLog: GameLogEntry = {
      type: 'turn_end',
      team: state.currentTeam,
      message: `انتهى دور ${teamName}`,
      timestamp: now,
    };
    newGameLog.push(switchLog);
  }

  const newState: ShifaratGameState = {
    ...state,
    board: newBoard,
    redTeam: newRedTeam,
    blueTeam: newBlueTeam,
    guessesThisTurn: newGuessesThisTurn,
    phase: nextPhase,
    gameLog: newGameLog,
    isTimerActive: nextPhase === 'team_guessing' ? state.isTimerActive : false,
  };

  return { state: newState, result, gameEnded: false };
}

// ─── Pass Turn ──────────────────────────────────────────────

/**
 * Pass the remaining guesses (team gives up).
 *
 * Ends the current turn and transitions to 'turn_switch'.
 *
 * @param state  Current game state
 * @returns Updated game state
 */
export function passTurn(state: ShifaratGameState): ShifaratGameState {
  if (state.phase !== 'clue_given' && state.phase !== 'team_guessing') {
    throw new Error('لا يمكن التخطي في هذه المرحلة');
  }

  const now = Date.now();
  const teamName =
    state.currentTeam === 'red' ? state.redTeam.name : state.blueTeam.name;

  const logEntry: GameLogEntry = {
    type: 'turn_end',
    team: state.currentTeam,
    message: `${teamName} تنازل عن التخمينات المتبقية`,
    timestamp: now,
  };

  return {
    ...state,
    phase: 'turn_switch',
    isTimerActive: false,
    gameLog: [...state.gameLog, logEntry],
  };
}

// ─── Timer ──────────────────────────────────────────────────

/**
 * Tick the timer down by 1 second.
 *
 * Called every second while the timer is active.
 * When the timer reaches 0, the turn ends automatically.
 *
 * @param state  Current game state
 * @returns Updated game state (timer reduced by 1, or turn ended if time is up)
 */
export function tickTimer(state: ShifaratGameState): ShifaratGameState {
  if (!state.isTimerActive || state.timerRemaining <= 0) {
    return state;
  }

  const newRemaining = state.timerRemaining - 1;

  if (newRemaining <= 0) {
    // Time is up — end the turn
    const now = Date.now();
    const teamName =
      state.currentTeam === 'red' ? state.redTeam.name : state.blueTeam.name;

    const logEntry: GameLogEntry = {
      type: 'turn_end',
      team: state.currentTeam,
      message: `انتهى وقت ${teamName}!`,
      timestamp: now,
    };

    return {
      ...state,
      timerRemaining: 0,
      isTimerActive: false,
      phase: 'turn_switch',
      gameLog: [...state.gameLog, logEntry],
    };
  }

  return {
    ...state,
    timerRemaining: newRemaining,
  };
}

// ─── Game End Check ─────────────────────────────────────────

/**
 * Check if the game should end after a guess.
 *
 * @param state        Current game state (with updated board/teams)
 * @param guessResult  The result of the most recent guess
 * @returns Whether the game is over, who won, and why
 */
export function checkGameEnd(
  state: ShifaratGameState,
  guessResult: 'correct' | 'wrong' | 'neutral' | 'assassin'
): {
  isOver: boolean;
  winner: TeamColor | null;
  reason: string | null;
} {
  // Rule 8: Assassin = instant loss for the guessing team
  if (guessResult === 'assassin') {
    const loser = state.currentTeam;
    const winner: TeamColor = loser === 'red' ? 'blue' : 'red';
    return {
      isOver: true,
      winner,
      reason: 'assassin',
    };
  }

  // Rule 10: Check if current team found all their words
  if (guessResult === 'correct') {
    if (state.currentTeam === 'red' && state.redTeam.wordsRemaining <= 0) {
      return {
        isOver: true,
        winner: 'red',
        reason: 'all_found',
      };
    }
    if (state.currentTeam === 'blue' && state.blueTeam.wordsRemaining <= 0) {
      return {
        isOver: true,
        winner: 'blue',
        reason: 'all_found',
      };
    }
  }

  // Rule 6/10: If wrong guess revealed opponent's last word, opponent wins
  if (guessResult === 'wrong') {
    const opponentTeam: TeamColor =
      state.currentTeam === 'red' ? 'blue' : 'red';
    if (
      opponentTeam === 'red' && state.redTeam.wordsRemaining <= 0
    ) {
      return {
        isOver: true,
        winner: 'red',
        reason: 'opponent_finished',
      };
    }
    if (
      opponentTeam === 'blue' && state.blueTeam.wordsRemaining <= 0
    ) {
      return {
        isOver: true,
        winner: 'blue',
        reason: 'opponent_finished',
      };
    }
  }

  return {
    isOver: false,
    winner: null,
    reason: null,
  };
}

// ─── Team Words Remaining ───────────────────────────────────

/**
 * Get the count of remaining (unrevealed) words for a given team.
 *
 * @param board  The current board
 * @param team   Which team to count for
 * @returns Number of unrevealed cards belonging to the team
 */
export function getTeamWordsRemaining(board: BoardCard[], team: TeamColor): number {
  return board.filter(
    (card) => card.color === team && !card.isRevealed
  ).length;
}

// ─── Turn Switching ─────────────────────────────────────────

/**
 * Switch to the next team's turn.
 *
 * Transitions from 'turn_result' or 'turn_switch' → 'spymaster_view'
 * for the opposing team.
 *
 * @param state  Current game state
 * @returns Updated game state with currentTeam flipped
 */
export function switchTurn(state: ShifaratGameState): ShifaratGameState {
  const nextTeam: TeamColor =
    state.currentTeam === 'red' ? 'blue' : 'red';

  const now = Date.now();
  const teamName =
    nextTeam === 'red' ? state.redTeam.name : state.blueTeam.name;

  const logEntry: GameLogEntry = {
    type: 'turn_start',
    team: nextTeam,
    message: `دور ${teamName} — جاسوس ${teamName} أعد الدليل`,
    timestamp: now,
  };

  return {
    ...state,
    currentTeam: nextTeam,
    phase: 'spymaster_view',
    roundNumber: state.roundNumber + 1,
    currentClue: null,
    guessesThisTurn: 0,
    guessesAllowed: 0,
    timerRemaining: state.timerDuration,
    isTimerActive: false,
    gameLog: [...state.gameLog, logEntry],
  };
}

// ─── Clue Validation ────────────────────────────────────────

/**
 * Validate that a clue word is not already on the board.
 *
 * The clue word is compared case-insensitively and with trimmed
 * whitespace against all unrevealed words on the board.
 *
 * Additionally, the clue word cannot be a substring of any board
 * word, nor can any board word be a substring of the clue.
 *
 * @param clueWord  The proposed clue word
 * @param board     The current board
 * @returns true if the clue is valid
 */
export function isValidClue(clueWord: string, board: BoardCard[]): boolean {
  const normalized = clueWord.trim().toLowerCase();

  if (!normalized) return false;

  for (const card of board) {
    const boardWord = card.word.trim().toLowerCase();

    // Exact match (even if revealed)
    if (normalized === boardWord) {
      return false;
    }

    // Substring check (either direction) — prevents cheating
    if (normalized.length >= 2 && boardWord.length >= 2) {
      if (normalized.includes(boardWord) || boardWord.includes(normalized)) {
        return false;
      }
    }
  }

  return true;
}

// ─── Timer Formatting ───────────────────────────────────────

/**
 * Format seconds into a MM:SS display string.
 *
 * @param seconds  Number of seconds (can be 0 or negative)
 * @returns Formatted string like "01:30" or "00:00"
 */
export function formatTimer(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ─── Utility: Shuffle Array ─────────────────────────────────

/**
 * Fisher-Yates shuffle — in-place, returns the same array reference.
 * Used internally for randomizing board cards and color assignments.
 */
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ============================================================
// LEGACY FUNCTIONS — Kept for backward compatibility with
// shifarat-store.ts and existing components.
// These will be removed once all consumers are migrated.
// ============================================================

import type { WordEntry } from './shifarat-types';
import { SHIFARAT_WORDS } from './shifarat-words';

/**
 * @legacy Pick a random word from the selected categories.
 */
export function getRandomWord(
  selectedCategories: string[],
  usedWords: Set<string>
): WordEntry | null {
  const available: Array<{ word: WordEntry; category: string }> = [];

  for (const category of selectedCategories) {
    const wordsInCategory = SHIFARAT_WORDS[category];
    if (!wordsInCategory) continue;

    for (const entry of wordsInCategory) {
      if (!usedWords.has(entry.w)) {
        available.push({ word: entry, category });
      }
    }
  }

  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)].word;
}

/**
 * @legacy Get the category for a given word.
 */
export function getWordCategory(
  word: string,
  selectedCategories: string[]
): string | null {
  for (const category of selectedCategories) {
    const wordsInCategory = SHIFARAT_WORDS[category];
    if (!wordsInCategory) continue;
    if (wordsInCategory.find((entry) => entry.w === word)) return category;
  }
  return null;
}

/**
 * @legacy Check if a team has reached the target score.
 */
export function checkGameWin(score: number, target: number): boolean {
  return score >= target;
}

/**
 * @legacy Get the opponent team index.
 */
export function getOpponentTeam(index: 0 | 1): 0 | 1 {
  return index === 0 ? 1 : 0;
}

/**
 * @legacy Count unused words across selected categories.
 */
export function getRemainingWordsCount(
  selectedCategories: string[],
  usedWords: Set<string>
): number {
  let count = 0;
  for (const category of selectedCategories) {
    const wordsInCategory = SHIFARAT_WORDS[category];
    if (!wordsInCategory) continue;
    for (const entry of wordsInCategory) {
      if (!usedWords.has(entry.w)) count++;
    }
  }
  return count;
}

/**
 * @legacy Get all words from selected categories.
 */
export function getAllWordsInCategories(selectedCategories: string[]): string[] {
  const words: string[] = [];
  for (const category of selectedCategories) {
    const wordsInCategory = SHIFARAT_WORDS[category];
    if (!wordsInCategory) continue;
    for (const entry of wordsInCategory) words.push(entry.w);
  }
  return words;
}
