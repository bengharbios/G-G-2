// ════════════════════════════════════════════════════════════════════════
// خمن الصورة (Guess the Image) — Zustand Store
// Game flow:
//   1. Pick random image from catalog (1..890)
//   2. Cover it with NxN grid of squares (N from difficulty)
//   3. Player reveals squares (max maxReveals per round)
//   4. After each reveal, player can submit a guess
//   5. Correct guess → score = scorePerCorrect - (revealedCount × 50) - (wrongGuesses × penalty)
//   6. Wrong guess → penalty + continue
//   7. Round ends on: correct guess OR reveals exhausted OR time runs out
// ════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  GamePhase,
  GameMode,
  Difficulty,
  GuessImageRound,
  RevealSquare,
  GameLogEntry,
  DIFFICULTY_CONFIG,
  ROUND_COUNT_OPTIONS,
} from './guessimage-types';
import {
  getGuessImageCatalog,
  GUESS_IMAGE_COUNT,
  type GuessImage,
} from './flashi_guess_images';

export interface GuessImageState {
  phase: GamePhase;
  gameMode: GameMode;
  difficulty: Difficulty;
  totalRounds: number;
  roomCode: string | null;
  hostName: string | null;
  playerName: string | null;

  timerValueSec: number;
  themeId: number;
  gridSquares: number;  // user-configurable grid size (16/25/36/49)

  currentRound: number;
  currentRoundData: GuessImageRound | null;
  squares: RevealSquare[];
  revealedCount: number;
  guessed: boolean;
  wrongGuesses: number;
  score: number;
  timeLeft: number;
  totalFound: number;       // rounds won
  totalDifferences: number; // = totalRounds (compat)
  totalMisses: number;
  roundsPlayed: number;

  gameLog: GameLogEntry[];
  lastAction: string | null;
  lastActionAt: number | null;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setGameMode: (mode: GameMode) => void;
  setDifficulty: (d: Difficulty) => void;
  setTotalRounds: (n: number) => void;
  setRoomCode: (code: string | null) => void;
  setHostName: (name: string | null) => void;
  setPlayerName: (name: string | null) => void;
  setTimerValueSec: (n: number) => void;
  setThemeId: (n: number) => void;
  setGridSquares: (n: number) => void;

  startGame: () => void;
  loadRound: (index: number) => void;
  revealSquare: (squareId: number) => void;
  submitChoice: (choiceIndex: number) => boolean;  // multi-choice — returns true if correct
  nextRound: () => void;
  newImage: () => void;  // pick a different image (skip current)
  resetGame: () => void;
  tickTimer: () => void;

  syncToRoom: () => void;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function makeLog(round: number, message: string, type: GameLogEntry['type'] = 'info'): GameLogEntry {
  return { round, message, type, timestamp: Date.now() };
}

// In-memory cache of labels.json (loaded on first buildRound call in classic mode)
// In diwaniya mode, the host's GameSetup (DiwaniyaApprovalCard) loads labels
// explicitly via /img/guess/labels.json fetch and passes them to startGuessImageBattle.
let _labelsCache: Record<string, string> | null = null;
async function loadLabels(): Promise<Record<string, string>> {
  if (_labelsCache) return _labelsCache;
  try {
    const res = await fetch('/img/guess/labels.json');
    if (!res.ok) return _labelsCache = {};
    const data = await res.json();
    if (data && typeof data === 'object') {
      _labelsCache = data as Record<string, string>;
      return _labelsCache;
    }
  } catch { /* silent */ }
  _labelsCache = {};
  return _labelsCache;
}

// Build a round: pick random LABELED image + generate 4 multi-choice options
// + create grid of squares based on user's gridSquares setting (16/25/36/49).
async function buildRoundAsync(state: GuessImageState): Promise<GuessImageRound> {
  const cfg = DIFFICULTY_CONFIG[state.difficulty];
  const labels = await loadLabels();
  const labeledIds = Object.keys(labels)
    .map(k => parseInt(k, 10))
    .filter(n => !isNaN(n) && n >= 1 && n <= GUESS_IMAGE_COUNT);
  // Fallback: if no labels yet, use any imageId and generic placeholder label
  const imageId = labeledIds.length > 0
    ? labeledIds[Math.floor(Math.random() * labeledIds.length)]
    : Math.floor(Math.random() * GUESS_IMAGE_COUNT) + 1;
  const correctLabel = labels[String(imageId)] || `صورة ${imageId}`;

  // Build 4 multi-choice options (1 correct + 3 random distractors)
  const allLabels = Array.from(new Set(Object.values(labels))).filter(l => l !== correctLabel);
  const distractors: string[] = [];
  while (distractors.length < 3 && allLabels.length > 0) {
    const idx = Math.floor(Math.random() * allLabels.length);
    distractors.push(allLabels[idx]);
    allLabels.splice(idx, 1);
  }
  while (distractors.length < 3) {
    distractors.push(`صورة ${Math.floor(Math.random() * GUESS_IMAGE_COUNT) + 1}`);
  }
  const choices = [correctLabel, ...distractors];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  const correctChoiceIndex = choices.indexOf(correctLabel);

  // Determine grid size: prefer user-configured gridSquares, fall back to difficulty's gridRows×gridRows
  const gridRows = state.gridSquares
    ? Math.round(Math.sqrt(state.gridSquares))
    : cfg.gridRows;
  const totalSquares = gridRows * gridRows;

  const squares: RevealSquare[] = [];
  let sqId = 1;
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridRows; c++) {
      squares.push({ id: sqId, row: r, col: c, revealed: false });
      sqId++;
    }
  }

  return {
    id: `round-${state.currentRound}-${Date.now()}`,
    title: `الجولة ${state.currentRound + 1}`,
    imageId,
    imageUrl: `/img/guess/pics/${imageId}.png`,
    themeId: state.themeId,
    gridRows,
    maxReveals: cfg.maxReveals,
    squares,
    revealedCount: 0,
    guessed: false,
    wrongGuesses: 0,
    choices,
    correctChoiceIndex,
    answer: correctLabel,
  };
}

// Synchronous buildRound for backward compat (used by old loadRound signature)
// — picks a random image without labels and uses generic placeholders
function buildRound(state: GuessImageState): GuessImageRound {
  const cfg = DIFFICULTY_CONFIG[state.difficulty];
  const catalog = getGuessImageCatalog();
  const pick = catalog[Math.floor(Math.random() * catalog.length)];
  const gridRows = state.gridSquares
    ? Math.round(Math.sqrt(state.gridSquares))
    : cfg.gridRows;
  const totalSquares = gridRows * gridRows;

  const squares: RevealSquare[] = [];
  let sqId = 1;
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridRows; c++) {
      squares.push({ id: sqId, row: r, col: c, revealed: false });
      sqId++;
    }
  }

  // Multi-choice placeholder — will be replaced by buildRoundAsync when loadRoundAsync is called
  const correctLabel = `صورة ${pick.id}`;
  const choices = [
    correctLabel,
    `صورة ${Math.floor(Math.random() * GUESS_IMAGE_COUNT) + 1}`,
    `صورة ${Math.floor(Math.random() * GUESS_IMAGE_COUNT) + 1}`,
    `صورة ${Math.floor(Math.random() * GUESS_IMAGE_COUNT) + 1}`,
  ];

  return {
    id: `round-${state.currentRound}-${Date.now()}`,
    title: `الجولة ${state.currentRound + 1}`,
    imageId: pick.id,
    imageUrl: pick.url,
    themeId: state.themeId,
    gridRows,
    maxReveals: cfg.maxReveals,
    squares,
    revealedCount: 0,
    guessed: false,
    wrongGuesses: 0,
    choices,
    correctChoiceIndex: 0,
    answer: correctLabel,
  };
}

const initialState = {
  phase: 'landing' as GamePhase,
  gameMode: 'classic' as GameMode,
  difficulty: 'medium' as Difficulty,
  totalRounds: 5,
  roomCode: null as string | null,
  hostName: null as string | null,
  playerName: null as string | null,
  timerValueSec: 60,
  themeId: 1,
  gridSquares: 25 as number,  // default 5×5
  currentRound: 0,
  currentRoundData: null as GuessImageRound | null,
  squares: [] as RevealSquare[],
  revealedCount: 0,
  guessed: false,
  wrongGuesses: 0,
  score: 0,
  timeLeft: 0,
  totalFound: 0,
  totalDifferences: 5,
  totalMisses: 0,
  roundsPlayed: 0,
  gameLog: [] as GameLogEntry[],
  lastAction: null as string | null,
  lastActionAt: null as number | null,
};

export const useGuessImageStore = create<GuessImageState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPhase: (phase) => { set({ phase }); get().syncToRoom(); },
      setGameMode: (gameMode) => set({ gameMode }),
      setDifficulty: (difficulty) => set({ difficulty }),
      setTotalRounds: (totalRounds) => set({ totalRounds, totalDifferences: totalRounds }),
      setRoomCode: (roomCode) => set({ roomCode }),
      setHostName: (hostName) => set({ hostName }),
      setPlayerName: (playerName) => set({ playerName }),
      setTimerValueSec: (timerValueSec) => set({ timerValueSec }),
      setThemeId: (themeId) => set({ themeId }),
      setGridSquares: (gridSquares) => set({ gridSquares }),

      startGame: async () => {
        const state = get();
        const round = await buildRoundAsync(state);
        const timeForRound = state.timerValueSec || DIFFICULTY_CONFIG[state.difficulty].timePerRoundSec;
        set({
          phase: 'playing',
          currentRound: 0,
          currentRoundData: round,
          squares: round.squares,
          revealedCount: 0,
          guessed: false,
          wrongGuesses: 0,
          score: 0,
          timeLeft: timeForRound,
          totalDifferences: state.totalRounds,
          totalFound: 0,
          totalMisses: 0,
          roundsPlayed: 0,
          gameLog: [makeLog(0, `🎯 بدأت اللعبة — ${state.totalRounds} جولات`, 'system')],
          lastAction: '🎯 بدأت اللعبة',
          lastActionAt: Date.now(),
        });
        get().syncToRoom();
      },

      loadRound: async (index) => {
        const state = get();
        const next = { ...state, currentRound: index };
        const round = await buildRoundAsync(next);
        const timeForRound = state.timerValueSec || DIFFICULTY_CONFIG[state.difficulty].timePerRoundSec;
        set({
          currentRound: index,
          currentRoundData: round,
          squares: round.squares,
          revealedCount: 0,
          guessed: false,
          wrongGuesses: 0,
          timeLeft: timeForRound,
          gameLog: [...state.gameLog, makeLog(index + 1, `🖼️ الجولة ${index + 1}`, 'info')],
          lastAction: `🖼️ الجولة ${index + 1}`,
          lastActionAt: Date.now(),
        });
        get().syncToRoom();
      },

      revealSquare: (squareId) => {
        const state = get();
        if (!state.currentRoundData || state.guessed) return;
        const cfg = DIFFICULTY_CONFIG[state.difficulty];
        if (state.revealedCount >= cfg.maxReveals) return; // no more reveals

        const newSquares = state.squares.map(sq =>
          sq.id === squareId && !sq.revealed ? { ...sq, revealed: true } : sq
        );
        const newRevealedCount = state.revealedCount + 1;
        const newRoundData = { ...state.currentRoundData, squares: newSquares, revealedCount: newRevealedCount };

        set({
          squares: newSquares,
          revealedCount: newRevealedCount,
          currentRoundData: newRoundData,
          lastAction: `🔍 كشفت ${newRevealedCount}/${cfg.maxReveals} مربعات`,
          lastActionAt: Date.now(),
        });

        // If reveals exhausted → end round (player didn't guess)
        if (newRevealedCount >= cfg.maxReveals) {
          set({
            gameLog: [...state.gameLog, makeLog(state.currentRound + 1, `⏰ نفدت الكشوفات — لم تُخمن!`, 'danger')],
            lastAction: `⏰ نفدت الكشوفات`,
            lastActionAt: Date.now(),
          });
          setTimeout(() => get().nextRound(), 1500);
        }
        get().syncToRoom();
      },

      submitChoice: (choiceIndex) => {
        const state = get();
        if (!state.currentRoundData || state.guessed) return false;
        const cfg = DIFFICULTY_CONFIG[state.difficulty];
        const round = state.currentRoundData;
        const isCorrect = choiceIndex === round.correctChoiceIndex;

        if (isCorrect) {
          const earnedScore = Math.max(50, cfg.scorePerCorrect - (state.revealedCount * 50) - (state.wrongGuesses * cfg.penaltyPerWrong));
          const newScore = state.score + earnedScore;
          const newTotalFound = state.totalFound + 1;

          set({
            guessed: true,
            score: newScore,
            totalFound: newTotalFound,
            gameLog: [
              ...state.gameLog,
              makeLog(state.currentRound + 1, `✓ إجابة صحيحة! +${earnedScore} نقطة (${round.answer})`, 'success'),
            ],
            lastAction: `✓ صحيحة! +${earnedScore}`,
            lastActionAt: Date.now(),
          });

          // Reveal all squares
          const allRevealed = state.squares.map(sq => ({ ...sq, revealed: true }));
          set({ squares: allRevealed });

          // Advance after 2s
          setTimeout(() => get().nextRound(), 2000);
          get().syncToRoom();
          return true;
        } else {
          const newScore = Math.max(0, state.score - cfg.penaltyPerWrong);
          const newWrong = state.wrongGuesses + 1;
          set({
            wrongGuesses: newWrong,
            score: newScore,
            totalMisses: state.totalMisses + 1,
            gameLog: [
              ...state.gameLog,
              makeLog(state.currentRound + 1, `✗ إجابة خاطئة -${cfg.penaltyPerWrong}`, 'danger'),
            ],
            lastAction: `✗ خاطئة -${cfg.penaltyPerWrong}`,
            lastActionAt: Date.now(),
          });
          get().syncToRoom();
          return false;
        }
      },

      nextRound: () => {
        const state = get();
        const nextIdx = state.currentRound + 1;
        const newRoundsPlayed = state.roundsPlayed + 1;
        if (nextIdx >= state.totalRounds) {
          set({
            phase: 'game_over',
            roundsPlayed: newRoundsPlayed,
            gameLog: [...state.gameLog, makeLog(state.currentRound + 1, `🏆 انتهت اللعبة — نقاطك: ${state.score}`, 'system')],
            lastAction: `🏆 انتهت اللعبة — ${state.score} نقطة`,
            lastActionAt: Date.now(),
          });
        } else {
          get().loadRound(nextIdx);
        }
        get().syncToRoom();
      },

      newImage: () => {
        const state = get();
        // Skip current round (forfeit) → load a NEW image at the same index
        // (buildRoundAsync picks a random labeled image each time)
        get().loadRound(state.currentRound);
      },

      resetGame: () => {
        const state = get();
        if (state.gameMode === 'diwaniya' && state.roomCode) {
          fetch(`/api/guessimage-room/${state.roomCode}`, { method: 'DELETE' }).catch(() => {});
        }
        set({ ...initialState });
      },

      tickTimer: () => {
        const state = get();
        if (state.phase !== 'playing') return;
        const newTime = state.timeLeft - 1;
        if (newTime <= 0) {
          set({
            timeLeft: 0,
            gameLog: [...state.gameLog, makeLog(state.currentRound + 1, `⏰ انتهى الوقت!`, 'danger')],
            lastAction: '⏰ انتهى الوقت!',
            lastActionAt: Date.now(),
          });
          setTimeout(() => get().nextRound(), 500);
        } else {
          set({ timeLeft: newTime });
          if (newTime % 5 === 0) get().syncToRoom();
        }
      },

      syncToRoom: () => {
        const state = get();
        if (state.gameMode !== 'diwaniya' || !state.roomCode) return;
        fetch(`/api/guessimage-room/${state.roomCode}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phase: state.phase,
            stateJson: JSON.stringify({
              currentRound: state.currentRound,
              currentRoundData: state.currentRoundData,
              revealedCount: state.revealedCount,
              guessed: state.guessed,
              score: state.score,
              timeLeft: state.timeLeft,
            }),
          }),
        }).catch(() => {});
      },
    }),
    {
      name: 'guessimage-game-storage',
      version: 3,
      partialize: (state) => ({
        phase: state.phase,
        gameMode: state.gameMode,
        difficulty: state.difficulty,
        totalRounds: state.totalRounds,
        roomCode: state.roomCode,
        hostName: state.hostName,
        playerName: state.playerName,
        currentRound: state.currentRound,
        currentRoundData: state.currentRoundData,
        squares: state.squares,
        revealedCount: state.revealedCount,
        guessed: state.guessed,
        wrongGuesses: state.wrongGuesses,
        score: state.score,
        timeLeft: state.timeLeft,
        totalFound: state.totalFound,
        totalMisses: state.totalMisses,
        roundsPlayed: state.roundsPlayed,
        gameLog: state.gameLog,
        lastAction: state.lastAction,
        lastActionAt: state.lastActionAt,
        timerValueSec: state.timerValueSec,
        themeId: state.themeId,
      }),
    }
  )
);

export function generateGuessImageRoomCode(): string {
  return generateRoomCode();
}
