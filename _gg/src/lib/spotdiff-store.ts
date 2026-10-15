// ============================================================
// اختلاف الصور (Spot the Difference) — Zustand Store
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  GamePhase,
  GameMode,
  Difficulty,
  DifferenceSpot,
  SpotDiffRound,
  GameLogEntry,
  DIFFICULTY_CONFIG,
} from './spotdiff-types';
import { SPOTDIFF_ROUNDS } from './spotdiff-rounds';

// ============================================================
// State
// ============================================================
export interface SpotDiffState {
  // Phase + meta
  phase: GamePhase;
  gameMode: GameMode;
  difficulty: Difficulty;
  totalRounds: number;
  roomCode: string | null;
  hostName: string | null;
  playerName: string | null;

  // Current round state
  currentRound: number;        // 0-based index
  currentRoundData: SpotDiffRound | null;
  foundDifferences: string[]; // difference IDs that were found
  differences: DifferenceSpot[]; // merged with found state for current round
  score: number;
  timeLeft: number;
  totalDifferences: number;   // total across all rounds
  totalFound: number;
  totalMisses: number;
  roundsPlayed: number;

  // Game log (for diwaniya spectator)
  gameLog: GameLogEntry[];

  // Last action feedback (for spectator display)
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

  // Game flow
  startGame: () => void;
  loadRound: (index: number) => void;
  findDifference: (diffId: string) => boolean;  // returns true if it was a valid find
  registerMiss: () => void;                     // when user clicks outside any diff
  nextRound: () => void;                        // advance, or trigger game_over if last
  resetGame: () => void;
  tickTimer: () => void;                        // decrement timer by 1 sec; if 0 → next round

  // Helpers
  syncToRoom: () => void;
}

// ============================================================
// Initial state
// ============================================================
const initialState = {
  phase: 'landing' as GamePhase,
  gameMode: 'classic' as GameMode,
  difficulty: 'medium' as Difficulty,
  totalRounds: 5,
  roomCode: null as string | null,
  hostName: null as string | null,
  playerName: null as string | null,

  currentRound: 0,
  currentRoundData: null as SpotDiffRound | null,
  foundDifferences: [] as string[],
  differences: [] as DifferenceSpot[],
  score: 0,
  timeLeft: 0,
  totalDifferences: 0,
  totalFound: 0,
  totalMisses: 0,
  roundsPlayed: 0,

  gameLog: [] as GameLogEntry[],
  lastAction: null as string | null,
  lastActionAt: null as number | null,
};

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

// Pick N rounds from SPOTDIFF_ROUNDS, cycling if needed (10-round mode)
function pickRounds(total: number): SpotDiffRound[] {
  const out: SpotDiffRound[] = [];
  for (let i = 0; i < total; i++) {
    out.push(SPOTDIFF_ROUNDS[i % SPOTDIFF_ROUNDS.length]);
  }
  return out;
}

// ============================================================
// Store
// ============================================================
export const useSpotDiffStore = create<SpotDiffState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPhase: (phase) => {
        set({ phase });
        get().syncToRoom();
      },
      setGameMode: (gameMode) => set({ gameMode }),
      setDifficulty: (difficulty) => set({ difficulty }),
      setTotalRounds: (totalRounds) => set({ totalRounds }),
      setRoomCode: (roomCode) => set({ roomCode }),
      setHostName: (hostName) => set({ hostName }),
      setPlayerName: (playerName) => set({ playerName }),

      startGame: () => {
        const state = get();
        const firstRound = pickRounds(state.totalRounds)[0];
        const timeForRound = DIFFICULTY_CONFIG[state.difficulty].timePerRoundSec;
        const totalDiffs = pickRounds(state.totalRounds).reduce(
          (sum, r) => sum + r.differences.length, 0
        );
        set({
          phase: 'playing',
          currentRound: 0,
          currentRoundData: firstRound,
          foundDifferences: [],
          differences: firstRound.differences.map(d => ({ ...d, found: false })),
          score: 0,
          timeLeft: timeForRound,
          totalDifferences: totalDiffs,
          totalFound: 0,
          totalMisses: 0,
          roundsPlayed: 0,
          gameLog: [makeLog(0, `🎯 بدأت اللعبة — ${state.totalRounds} جولات، مستوى ${state.difficulty}`, 'system')],
          lastAction: '🎯 بدأت اللعبة',
          lastActionAt: Date.now(),
        });
        get().syncToRoom();
      },

      loadRound: (index) => {
        const state = get();
        const rounds = pickRounds(state.totalRounds);
        const round = rounds[index];
        if (!round) return;
        const timeForRound = DIFFICULTY_CONFIG[state.difficulty].timePerRoundSec;
        set({
          currentRound: index,
          currentRoundData: round,
          foundDifferences: [],
          differences: round.differences.map(d => ({ ...d, found: false })),
          timeLeft: timeForRound,
          gameLog: [
            ...state.gameLog,
            makeLog(index + 1, `🖼️ الجولة ${index + 1} — ${round.title}`, 'info'),
          ],
          lastAction: `🖼️ الجولة ${index + 1}`,
          lastActionAt: Date.now(),
        });
        get().syncToRoom();
      },

      findDifference: (diffId) => {
        const state = get();
        if (!state.currentRoundData) return false;
        if (state.foundDifferences.includes(diffId)) return false;
        const spot = state.differences.find(d => d.id === diffId);
        if (!spot) return false;

        const cfg = DIFFICULTY_CONFIG[state.difficulty];
        const newFound = [...state.foundDifferences, diffId];
        const newDiffs = state.differences.map(d => d.id === diffId ? { ...d, found: true } : d);
        const newScore = state.score + cfg.scorePerHit;
        const newTotalFound = state.totalFound + 1;
        const roundComplete = newFound.length >= (state.currentRoundData.differences.length);

        set({
          foundDifferences: newFound,
          differences: newDiffs,
          score: newScore,
          totalFound: newTotalFound,
          gameLog: [
            ...state.gameLog,
            makeLog(state.currentRound + 1, `✓ تم العثور على فرق! +${cfg.scorePerHit}`, 'success'),
          ],
          lastAction: `✓ فرق جديد! +${cfg.scorePerHit}`,
          lastActionAt: Date.now(),
        });

        // If round complete → auto-advance after delay
        if (roundComplete) {
          setTimeout(() => {
            get().nextRound();
          }, 1200);
        }

        get().syncToRoom();
        return true;
      },

      registerMiss: () => {
        const state = get();
        const cfg = DIFFICULTY_CONFIG[state.difficulty];
        const newScore = Math.max(0, state.score - cfg.penaltyPerMiss);
        const newMisses = state.totalMisses + 1;
        set({
          score: newScore,
          totalMisses: newMisses,
          lastAction: `✗ خطأ! -${cfg.penaltyPerMiss}`,
          lastActionAt: Date.now(),
        });
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
              makeLog(state.currentRound + 1, `🏆 انتهت اللعبة — نقاطك النهائية: ${state.score}`, 'system'),
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
          fetch(`/api/spotdiff-room/${state.roomCode}`, { method: 'DELETE' }).catch(() => {});
        }
        set({ ...initialState });
      },

      tickTimer: () => {
        const state = get();
        if (state.phase !== 'playing') return;
        const newTime = state.timeLeft - 1;
        if (newTime <= 0) {
          // Time up → next round (or game over)
          set({
            timeLeft: 0,
            gameLog: [
              ...state.gameLog,
              makeLog(state.currentRound + 1, `⏰ انتهى الوقت!`, 'danger'),
            ],
            lastAction: '⏰ انتهى الوقت!',
            lastActionAt: Date.now(),
          });
          setTimeout(() => get().nextRound(), 500);
        } else {
          set({ timeLeft: newTime });
          // Sync less frequently to avoid spam (every 5 seconds)
          if (newTime % 5 === 0) {
            get().syncToRoom();
          }
        }
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
            currentRoundId: state.currentRoundData?.id,
            foundDifferences: state.foundDifferences,
            score: state.score,
            timeLeft: state.timeLeft,
            totalDifferences: state.totalDifferences,
            totalFound: state.totalFound,
            totalMisses: state.totalMisses,
            roundsPlayed: state.roundsPlayed,
            gameLog: state.gameLog,
            lastAction: state.lastAction,
            playerName: state.playerName,
          }),
        };

        fetch(`/api/spotdiff-room/${state.roomCode}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syncData),
        }).catch(() => {});
      },
    }),
    {
      name: 'spotdiff-game-storage',
      version: 1,
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
        foundDifferences: state.foundDifferences,
        differences: state.differences,
        score: state.score,
        timeLeft: state.timeLeft,
        totalDifferences: state.totalDifferences,
        totalFound: state.totalFound,
        totalMisses: state.totalMisses,
        roundsPlayed: state.roundsPlayed,
        gameLog: state.gameLog,
        lastAction: state.lastAction,
        lastActionAt: state.lastActionAt,
      }),
    }
  )
);

// Helper for room code generation (used by GameSetup)
export function generateSpotDiffRoomCode(): string {
  return generateRoomCode();
}
