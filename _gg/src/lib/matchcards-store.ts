// ════════════════════════════════════════════════════════════════════════
// تطابق الصور (MatchCards / Memory Match-2) — Zustand Store
// ════════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  GamePhase,
  GameMode,
  Difficulty,
  MatchCardsRound,
  GuessCard,
  MatchedPair,
  GameLogEntry,
  DIFFICULTY_CONFIG,
  ROUND_COUNT_OPTIONS,
} from './matchcards-types';
import {
  getGuessImageCatalog as getMatchCardsCatalog,
  pickRandomGuessImages as pickRandomMatchCards,
  buildGuessImageUrl as buildMatchCardsUrl,
  GUESS_GRID_OPTIONS,
  GUESS_IMAGE_COUNT,
  type GuessImage as MatchCards,
} from './flashi_guess_images';

// ─── State ────────────────────────────────────────────────────────────
export interface MatchCardsState {
  // Phase + meta
  phase: GamePhase;
  gameMode: GameMode;
  difficulty: Difficulty;
  totalRounds: number;
  roomCode: string | null;
  hostName: string | null;
  playerName: string | null;

  // Round config (host picks in GameSetup)
  gridSquares: number;     // 16/25/36/49
  gridRows: number;        // 4/5/6/7
  pairsCount: number;      // 8/12/18/24
  themeId: number;         // 1..6
  timerValueSec: number;
  flashiCategory: 'random'; // unused (kept for compat)

  // Current round state
  currentRound: number;
  currentRoundData: MatchCardsRound | null;
  // Per-round cards (mapped from currentRoundData.cards for the UI)
  cards: GuessCard[];
  // Currently-flipped cards (max 2 — when both are non-matching, flip back)
  flippedCardIds: number[];
  // Matched pairs in the current round (for score)
  matchedPairs: MatchedPair[];
  score: number;
  timeLeft: number;
  totalDifferences: number;  // = pairsCount (kept for compat)
  totalFound: number;       // = matchedPairs.length (kept for compat)
  totalMisses: number;
  roundsPlayed: number;

  // Game log
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
  setGridSquares: (n: number) => void;
  setThemeId: (n: number) => void;
  setTimerValueSec: (n: number) => void;

  // Game flow
  startGame: () => void;
  loadRound: (index: number) => void;
  flipCard: (cardId: number) => void;  // flip a card; if 2 flipped, evaluate match
  checkMatch: () => void;              // called after 2 cards flipped
  nextRound: () => void;
  resetGame: () => void;
  tickTimer: () => void;
  newImage: () => void;  // reshuffle current round (no page reload)

  // Helpers
  syncToRoom: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────
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

// Pick a random grid option (default = 16 cards = 8 pairs)
function defaultGridOption() {
  return GUESS_GRID_OPTIONS[0];
}

// Build a shuffled grid of cards for a round
function buildShuffledCards(pairsCount: number, catalog: MatchCards[]): GuessCard[] {
  const picks = pickRandomMatchCards(catalog, pairsCount);
  // Each image appears twice
  const cards: GuessCard[] = [];
  let cardId = 1;
  for (const img of picks) {
    cards.push({
      id: cardId,
      imageId: img.id,
      imageUrl: img.url,
      flipped: false,
      matched: false,
    });
    cardId++;
    cards.push({
      id: cardId,
      imageId: img.id,
      imageUrl: img.url,
      flipped: false,
      matched: false,
    });
    cardId++;
  }
  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

// ─── Initial state ───────────────────────────────────────────────────────
const initialGrid = defaultGridOption();

const initialState = {
  phase: 'landing' as GamePhase,
  gameMode: 'classic' as GameMode,
  difficulty: 'medium' as Difficulty,
  totalRounds: 5,
  roomCode: null as string | null,
  hostName: null as string | null,
  playerName: null as string | null,

  gridSquares: initialGrid.squares,
  gridRows: initialGrid.rows,
  pairsCount: initialGrid.pairs,
  themeId: 1,
  timerValueSec: 60,
  flashiCategory: 'random' as const,

  currentRound: 0,
  currentRoundData: null as MatchCardsRound | null,
  cards: [] as GuessCard[],
  flippedCardIds: [] as number[],
  matchedPairs: [] as MatchedPair[],
  score: 0,
  timeLeft: 0,
  totalDifferences: initialGrid.pairs,
  totalFound: 0,
  totalMisses: 0,
  roundsPlayed: 0,
  gameLog: [] as GameLogEntry[],
  lastAction: null as string | null,
  lastActionAt: null as number | null,
};

// ─── Build a new round (called by startGame + loadRound + newImage) ──────
function buildRound(state: MatchCardsState): MatchCardsRound {
  const catalog = getMatchCardsCatalog();
  const cards = buildShuffledCards(state.pairsCount, catalog);
  return {
    id: `round-${state.currentRound}-${Date.now()}`,
    title: `الجولة ${state.currentRound + 1} — ${state.pairsCount} أزواج`,
    gridSquares: state.gridSquares,
    gridRows: state.gridRows,
    pairsCount: state.pairsCount,
    themeId: state.themeId,
    cards,
    matchedPairs: [],
  };
}

// ════════════════════════════════════════════════════════════════════════
// Store
// ════════════════════════════════════════════════════════════════════════
export const useMatchCardsStore = create<MatchCardsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPhase: (phase) => { set({ phase }); get().syncToRoom(); },
      setGameMode: (gameMode) => set({ gameMode }),
      setDifficulty: (difficulty) => set({ difficulty }),
      setTotalRounds: (totalRounds) => set({ totalRounds }),
      setRoomCode: (roomCode) => set({ roomCode }),
      setHostName: (hostName) => set({ hostName }),
      setPlayerName: (playerName) => set({ playerName }),
      setGridSquares: (gridSquares) => {
        const opt = GUESS_GRID_OPTIONS.find(o => o.squares === gridSquares) || GUESS_GRID_OPTIONS[0];
        set({ gridSquares: opt.squares, gridRows: opt.rows, pairsCount: opt.pairs });
      },
      setThemeId: (themeId) => set({ themeId }),
      setTimerValueSec: (timerValueSec) => set({ timerValueSec }),

      startGame: () => {
        const state = get();
        const firstRound = buildRound(state);
        const timeForRound = state.timerValueSec || DIFFICULTY_CONFIG[state.difficulty].timePerRoundSec;
        set({
          phase: 'playing',
          currentRound: 0,
          currentRoundData: firstRound,
          cards: firstRound.cards,
          flippedCardIds: [],
          matchedPairs: [],
          score: 0,
          timeLeft: timeForRound,
          totalDifferences: state.pairsCount,
          totalFound: 0,
          totalMisses: 0,
          roundsPlayed: 0,
          gameLog: [makeLog(0, `🎯 بدأت اللعبة — ${state.totalRounds} جولات، ${state.pairsCount} أزواج`, 'system')],
          lastAction: '🎯 بدأت اللعبة',
          lastActionAt: Date.now(),
        });
        get().syncToRoom();
      },

      loadRound: (index) => {
        const state = get();
        // Re-use the same state, just build a new round
        const next = { ...state, currentRound: index };
        const round = buildRound(next);
        if (!round) return;
        const timeForRound = state.timerValueSec;
        set({
          currentRound: index,
          currentRoundData: round,
          cards: round.cards,
          flippedCardIds: [],
          matchedPairs: [],
          timeLeft: timeForRound,
          totalDifferences: state.pairsCount,
          totalFound: 0,
          gameLog: [...state.gameLog, makeLog(index + 1, `🖼️ الجولة ${index + 1} — ${round.title}`, 'info')],
          lastAction: `🖼️ الجولة ${index + 1}`,
          lastActionAt: Date.now(),
        });
        get().syncToRoom();
      },

      // Flip a card — if 2 are flipped, check match
      flipCard: (cardId) => {
        const state = get();
        if (!state.cards.length) return;
        const card = state.cards.find(c => c.id === cardId);
        if (!card || card.matched || card.flipped) return;
        if (state.flippedCardIds.length >= 2) return; // wait for check

        const newCards = state.cards.map(c =>
          c.id === cardId ? { ...c, flipped: true } : c
        );
        const newFlipped = [...state.flippedCardIds, cardId];
        set({ cards: newCards, flippedCardIds: newFlipped });

        // If 2 cards are flipped, evaluate after 800ms
        if (newFlipped.length === 2) {
          setTimeout(() => get().checkMatch(), 800);
        }
      },

      // Called when 2 cards are flipped — check if they match
      checkMatch: () => {
        const state = get();
        if (state.flippedCardIds.length !== 2) return;
        const [id1, id2] = state.flippedCardIds;
        const c1 = state.cards.find(c => c.id === id1);
        const c2 = state.cards.find(c => c.id === id2);
        if (!c1 || !c2) return;

        const cfg = DIFFICULTY_CONFIG[state.difficulty];
        const isMatch = c1.imageId === c2.imageId;

        if (isMatch) {
          // Mark both as matched
          const newCards = state.cards.map(c =>
            (c.id === id1 || c.id === id2) ? { ...c, matched: true } : c
          );
          const newPair: MatchedPair = {
            imageId: c1.imageId,
            cardIds: [id1, id2],
            matchedAt: Date.now(),
          };
          const newMatchedPairs = [...state.matchedPairs, newPair];
          const newScore = state.score + cfg.scorePerMatch;
          const newTotalFound = state.totalFound + 1;
          const roundComplete = newMatchedPairs.length >= state.pairsCount;

          set({
            cards: newCards,
            flippedCardIds: [],
            matchedPairs: newMatchedPairs,
            score: newScore,
            totalFound: newTotalFound,
            gameLog: [
              ...state.gameLog,
              makeLog(state.currentRound + 1, `✓ تطابق! +${cfg.scorePerMatch}`, 'success'),
            ],
            lastAction: `✓ تطابق جديد! +${cfg.scorePerMatch}`,
            lastActionAt: Date.now(),
          });

          // If round complete → advance after 1s
          if (roundComplete) {
            setTimeout(() => get().nextRound(), 1000);
          }
        } else {
          // Flip both back
          const newCards = state.cards.map(c =>
            (c.id === id1 || c.id === id2) ? { ...c, flipped: false } : c
          );
          const newScore = Math.max(0, state.score - cfg.penaltyPerMiss);
          set({
            cards: newCards,
            flippedCardIds: [],
            score: newScore,
            totalMisses: state.totalMisses + 1,
            gameLog: [
              ...state.gameLog,
              makeLog(state.currentRound + 1, `✗ لا تطابق -${cfg.penaltyPerMiss}`, 'danger'),
            ],
            lastAction: `✗ خطأ -${cfg.penaltyPerMiss}`,
            lastActionAt: Date.now(),
          });
        }
        get().syncToRoom();
      },

      nextRound: () => {
        const state = get();
        const nextIdx = state.currentRound + 1;
        const newRoundsPlayed = state.roundsPlayed + 1;
        if (nextIdx >= state.totalRounds) {
          // Game over
          set({
            phase: 'game_over',
            roundsPlayed: newRoundsPlayed,
            gameLog: [
              ...state.gameLog,
              makeLog(state.currentRound + 1, `🏆 انتهت اللعبة — نقاطك: ${state.score}`, 'system'),
            ],
            lastAction: `🏆 انتهت اللعبة — ${state.score} نقطة`,
            lastActionAt: Date.now(),
          });
        } else {
          get().loadRound(nextIdx);
        }
        get().syncToRoom();
      },

      resetGame: () => {
        const state = get();
        if (state.gameMode === 'diwaniya' && state.roomCode) {
          fetch(`/api/matchcards-room/${state.roomCode}`, { method: 'DELETE' }).catch(() => {});
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

      // Reshuffle the current round (no page reload)
      newImage: () => {
        const state = get();
        if (!state.currentRoundData) return;
        const catalog = getMatchCardsCatalog();
        const cards = buildShuffledCards(state.pairsCount, catalog);
        const newRound: MatchCardsRound = {
          ...state.currentRoundData,
          cards,
          matchedPairs: [],
        };
        set({
          currentRoundData: newRound,
          cards,
          flippedCardIds: [],
          matchedPairs: [],
          score: 0,
          timeLeft: state.timerValueSec,
          totalFound: 0,
          lastAction: '🔄 صور جديدة',
          lastActionAt: Date.now(),
        });
        get().syncToRoom();
      },

      syncToRoom: () => {
        const state = get();
        if (state.gameMode !== 'diwaniya' || !state.roomCode) return;
        const syncData = {
          phase: state.phase,
          round: state.currentRound,
          stateJson: JSON.stringify({
            difficulty: state.difficulty,
            totalRounds: state.totalRounds,
            currentRound: state.currentRound,
            cards: state.cards,
            matchedPairs: state.matchedPairs,
            score: state.score,
            timeLeft: state.timeLeft,
            totalDifferences: state.totalDifferences,
            totalFound: state.totalFound,
            totalMisses: state.totalMisses,
            roundsPlayed: state.roundsPlayed,
            gameLog: state.gameLog,
            lastAction: state.lastAction,
            playerName: state.playerName,
            gridSquares: state.gridSquares,
            gridRows: state.gridRows,
            pairsCount: state.pairsCount,
            themeId: state.themeId,
          }),
        };
        fetch(`/api/matchcards-room/${state.roomCode}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syncData),
        }).catch(() => {});
      },
    }),
    {
      name: 'matchcards-game-storage',
      version: 2,
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
        cards: state.cards,
        flippedCardIds: state.flippedCardIds,
        matchedPairs: state.matchedPairs,
        score: state.score,
        timeLeft: state.timeLeft,
        totalDifferences: state.totalDifferences,
        totalFound: state.totalFound,
        totalMisses: state.totalMisses,
        roundsPlayed: state.roundsPlayed,
        gameLog: state.gameLog,
        lastAction: state.lastAction,
        lastActionAt: state.lastActionAt,
        gridSquares: state.gridSquares,
        gridRows: state.gridRows,
        pairsCount: state.pairsCount,
        themeId: state.themeId,
        timerValueSec: state.timerValueSec,
      }),
    }
  )
);

// Helper for room code generation (used by GameSetup)
export function generateMatchCardsRoomCode(): string {
  return generateRoomCode();
}
