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
import {
  loadFlashiCatalog as loadFlashiCatalogFn,
  pickRandomImages,
  decodeFlashiFilename,
  buildFlashiUrl,
  getImageShift,
  type FlashiCategory,
  type FlashiImage,
} from './flashi_images';

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

  // Flashi catalog (loaded async before startGame)
  flashiCatalog: FlashiImage[] | null;
  flashiCategory: FlashiCategory | 'random';  // user-selected image type filter

  // User-configurable game settings (set in GameSetup before startGame)
  timerValueSec: number;       // 15, 30, 45, 60, 90, 120, 150, 180, 240, 300
  fastestFinish: boolean;      // الأسرع (yes/no)
  wrongCount: number;          // عدد الأخطaئ (1-10) — used to filter flashi catalog


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

  // Flashi catalog management
  loadFlashiCatalog: () => Promise<void>;
  setFlashiCategory: (cat: FlashiCategory | 'random') => void;
  loadNewImage: () => void;  // pick a new random image without reloading
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
  flashiCatalog: null as FlashiImage[] | null,
  flashiCategory: 'random' as FlashiCategory | 'random',
  timerValueSec: 60,
  fastestFinish: false,
  wrongCount: 5,
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

// Pick N rounds from the flashi catalog if loaded (preferred),
// otherwise fall back to legacy SVG rounds (SPOTDIFF_ROUNDS).
function pickRounds(total: number, catalog: FlashiImage[] | null, category: FlashiCategory | 'random'): SpotDiffRound[] {
  // Flashi branch: pick N random images and convert each to a SpotDiffRound
  if (catalog && catalog.length > 0) {
    const picks = pickRandomImages(catalog, category, total);
    return picks.map((img, idx) => {
      const diffs = decodeFlashiFilename(img.filename);
      const shift = getImageShift(img.category);
      return {
        id: `flashi-${idx}-${img.filename.slice(0, 20)}`,
        title: `اختلاف الصور — ${img.category}`,
        imageA: '',  // unused for flashi — imageUrl holds the bundled image
        imageB: '',  // unused
        imageUrl: img.url,
        imageShift: shift,
        flashiDiffs: diffs.map(d => ({ topVmin: d.top, leftVmin: d.left })),
        flashiCategory: img.category,
        differences: diffs.map((d, i) => ({
          id: `flashi-diff-${idx}-${i}`,
          x: 0, y: 0, radius: 0,  // unused for flashi — kept for type compat
          found: false,
        })),
      } as SpotDiffRound;
    });
  }
  // Legacy fallback: cycle through the SVG SPOTDIFF_ROUNDS
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
        const rounds = pickRounds(state.totalRounds, state.flashiCatalog, state.flashiCategory);
        const firstRound = rounds[0];
        // Use ONLY the user-selected timer value (no fallback to difficulty)
        const timeForRound = state.timerValueSec;
        const totalDiffs = rounds.reduce(
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
        const rounds = pickRounds(state.totalRounds, state.flashiCatalog, state.flashiCategory);
        const round = rounds[index];
        if (!round) return;
        // Use ONLY the user-selected timer value (independent of difficulty)
        const timeForRound = state.timerValueSec;
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

        // Fixed scoring (decoupled from difficulty selector)
        const scorePerHit = 100;
        const newFound = [...state.foundDifferences, diffId];
        const newDiffs = state.differences.map(d => d.id === diffId ? { ...d, found: true } : d);
        const newScore = state.score + scorePerHit;
        const newTotalFound = state.totalFound + 1;
        const roundComplete = newFound.length >= (state.currentRoundData.differences.length);

        set({
          foundDifferences: newFound,
          differences: newDiffs,
          score: newScore,
          totalFound: newTotalFound,
          gameLog: [
            ...state.gameLog,
            makeLog(state.currentRound + 1, `✓ تم العثور على فرق! +${scorePerHit}`, 'success'),
          ],
          lastAction: `✓ فرق جديد! +${scorePerHit}`,
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
        // Fixed penalty (decoupled from difficulty selector)
        const penaltyPerMiss = 10;
        const newScore = Math.max(0, state.score - penaltyPerMiss);
        const newMisses = state.totalMisses + 1;
        set({
          score: newScore,
          totalMisses: newMisses,
          lastAction: `✗ خطأ! -${penaltyPerMiss}`,
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

      loadFlashiCatalog: async () => {
        if (get().flashiCatalog) return; // already loaded
        try {
          const catalog = await loadFlashiCatalogFn();
          set({ flashiCatalog: catalog });
        } catch (e) {
          console.warn('Failed to load flashi catalog:', e);
        }
      },

      loadNewImage: () => {
        // Pick a fresh random flashi image and replace currentRoundData
        // (without reloading the page — fixes the 'صورة جديدة' button)
        const state = get();
        if (!state.flashiCatalog || state.flashiCatalog.length === 0) return;
        const picks = pickRandomImages(state.flashiCatalog, state.flashiCategory, 1);
        if (picks.length === 0) return;
        const img = picks[0];
        const diffs = decodeFlashiFilename(img.filename);
        const shift = getImageShift(img.category);
        const roundIdx = state.currentRound;
        const newRound: SpotDiffRound = {
          id: `flashi-${roundIdx}-${img.filename.slice(0, 20)}-${Date.now()}`,
          title: `اختلاف الصور — ${img.category}`,
          imageA: '',
          imageB: '',
          imageUrl: img.url,
          imageShift: shift,
          flashiDiffs: diffs.map(d => ({ topVmin: d.top, leftVmin: d.left })),
          flashiCategory: img.category,
          differences: diffs.map((_, i) => ({
            id: `flashi-diff-${roundIdx}-${i}`,
            x: 0, y: 0, radius: 0,
            found: false,
          })),
        };
        set({
          currentRoundData: newRound,
          foundDifferences: [],
          differences: newRound.differences.map(d => ({ ...d, found: false })),
          score: 0,  // reset score on new image (matches flashi behavior)
          timeLeft: state.timerValueSec,
          totalForRound: diffs.length,
          lastAction: `🖼️ صورة جديدة — ${img.category}`,
          lastActionAt: Date.now(),
        });
        get().syncToRoom();
      },

      setFlashiCategory: (cat) => set({ flashiCategory: cat }),

      // Note: setters for timerValueSec, fastestFinish, wrongCount can be
      // added inline in GameSetup using useSpotDiffStore.setState().
      // For brevity we expose the loadNewImage action here and let
      // GameSetup use setState() for the other settings.


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
        flashiCatalog: state.flashiCatalog,
        flashiCategory: state.flashiCategory,
        timerValueSec: state.timerValueSec,
        fastestFinish: state.fastestFinish,
        wrongCount: state.wrongCount,
      }),
    }
  )
);

// Helper for room code generation (used by GameSetup)
export function generateSpotDiffRoomCode(): string {
  return generateRoomCode();
}
