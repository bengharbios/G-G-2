// ============================================================
// SHIFARAT STORE - Zustand State Management for Codenames Game
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ShifaratGameState,
  TeamColor,
  GamePhase,
  ViewMode,
  BoardCard,
  Clue,
  GameLogEntry,
  TeamInfo,
} from './shifarat-types';
import {
  generateBoard,
  createInitialState,
  giveClue as logicGiveClue,
  guessWord as logicGuessWord,
  passTurn as logicPassTurn,
  tickTimer as logicTickTimer,
  switchTurn as logicSwitchTurn,
  isValidClue,
  formatTimer,
} from './shifarat-logic';
import { getBoardWords } from './shifarat-words';
import { syncRoomState, endRoomSession } from './room-sync';

// ─── Persist-friendly state shape ───────────────────────────

interface ShifaratPersistState {
  gameMode: 'godfather' | 'diwaniya' | null;
  hostName: string | null;
  roomCode: string | null;
  phase: GamePhase;
  viewMode: ViewMode;

  // Board
  board: BoardCard[];

  // Teams
  redTeam: TeamInfo;
  blueTeam: TeamInfo;

  // Turn
  startingTeam: TeamColor;
  currentTeam: TeamColor;
  roundNumber: number;

  // Clue & guessing
  currentClue: Clue | null;
  guessesThisTurn: number;
  guessesAllowed: number;
  lastGuessResult: 'correct' | 'wrong' | 'neutral' | 'assassin' | null;

  // Timer
  timerDuration: number;
  timerRemaining: number;
  isTimerActive: boolean;

  // History
  clues: Clue[];
  gameLog: GameLogEntry[];

  // Settings
  selectedCategories: string[];

  // Result
  winner: TeamColor | null;
  winReason: string | null;

  // Players (Diwaniya mode)
  players: Array<{
    id: string;
    name: string;
    team: 'red' | 'blue';
    role: 'spymaster' | 'player';
    hasJoined: boolean;
  }>;
}

// ─── Runtime store interface ────────────────────────────────

export interface ShifaratStore extends ShifaratPersistState {
  // Actions - Setup
  setGameMode: (mode: 'godfather' | 'diwaniya' | null) => void;
  setHostName: (name: string | null) => void;
  setRoomCode: (code: string | null) => void;
  setViewMode: (mode: ViewMode) => void;

  // Actions - Game flow
  startGame: (
    redTeamName: string,
    blueTeamName: string,
    categories: string[],
    timerSeconds: number,
    firstTeam?: TeamColor,
    redSpymaster?: string,
    blueSpymaster?: string,
  ) => void;

  giveClue: (clueWord: string, clueNumber: number) => string | null;
  selectCard: (cardId: number) => { result: 'correct' | 'wrong' | 'neutral' | 'assassin'; gameEnded: boolean; error?: string };
  passTurn: () => void;
  confirmTurnSwitch: () => void;
  tickTimer: () => void;
  resetGame: () => void;

  // Actions - Room sync
  syncToRoom: () => void;

  // Computed helpers
  getTeamName: (team: TeamColor) => string;
  formattedTimer: string;
}

// ─── Initial state ──────────────────────────────────────────

const initialState: ShifaratPersistState = {
  gameMode: null,
  hostName: null,
  roomCode: null,
  phase: 'setup',
  viewMode: 'spymaster',

  board: [],
  redTeam: { name: 'الفريق الأحمر', score: 0, spymaster: null, wordsRemaining: 9 },
  blueTeam: { name: 'الفريق الأزرق', score: 0, spymaster: null, wordsRemaining: 8 },

  startingTeam: 'red',
  currentTeam: 'red',
  roundNumber: 1,

  currentClue: null,
  guessesThisTurn: 0,
  guessesAllowed: 0,
  lastGuessResult: null,

  timerDuration: 60,
  timerRemaining: 60,
  isTimerActive: false,

  clues: [],
  gameLog: [],
  selectedCategories: [],

  winner: null,
  winReason: null,
  players: [],
};

// ─── Helper: Extract pure game state from Zustand store ─────
// This is CRITICAL. Never pass the full Zustand proxy (which
// includes functions) to pure logic functions. Always extract
// only the ShifaratGameState fields as plain objects.

function extractGameState(store: ShifaratStore): ShifaratGameState {
  return {
    board: store.board,
    redTeam: { ...store.redTeam },
    blueTeam: { ...store.blueTeam },
    startingTeam: store.startingTeam,
    currentTeam: store.currentTeam,
    phase: store.phase,
    roundNumber: store.roundNumber,
    currentClue: store.currentClue ? { ...store.currentClue } : null,
    guessesThisTurn: store.guessesThisTurn,
    guessesAllowed: store.guessesAllowed,
    timerDuration: store.timerDuration,
    timerRemaining: store.timerRemaining,
    isTimerActive: store.isTimerActive,
    clues: store.clues.map(c => ({ ...c })),
    gameLog: store.gameLog.map(e => ({ ...e })),
    gameMode: store.gameMode ?? 'godfather',
    roomCode: store.roomCode,
    hostName: store.hostName,
    winner: store.winner,
    winReason: store.winReason,
    selectedCategories: store.selectedCategories,
  };
}

// ─── Helper: Apply pure logic result back to store ───────────
// Only set the specific fields that logic functions return,
// never spread the full result object.

function applyLogicResult(logicState: ShifaratGameState) {
  return {
    board: logicState.board,
    redTeam: logicState.redTeam,
    blueTeam: logicState.blueTeam,
    startingTeam: logicState.startingTeam,
    currentTeam: logicState.currentTeam,
    phase: logicState.phase,
    roundNumber: logicState.roundNumber,
    currentClue: logicState.currentClue,
    guessesThisTurn: logicState.guessesThisTurn,
    guessesAllowed: logicState.guessesAllowed,
    timerDuration: logicState.timerDuration,
    timerRemaining: logicState.timerRemaining,
    isTimerActive: logicState.isTimerActive,
    clues: logicState.clues,
    gameLog: logicState.gameLog,
    winner: logicState.winner,
    winReason: logicState.winReason,
    selectedCategories: logicState.selectedCategories,
  };
}

// ─── Store definition ───────────────────────────────────────

export const useShifaratStore = create<ShifaratStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      formattedTimer: formatTimer(60),

      // ── Setup actions ──

      setGameMode: (mode) => set({ gameMode: mode }),
      setHostName: (name) => set({ hostName: name }),
      setRoomCode: (code) => set({ roomCode: code }),
      setViewMode: (mode) => set({ viewMode: mode }),

      // ── Start game ──

      startGame: (
        redTeamName,
        blueTeamName,
        categories,
        timerSeconds,
        firstTeam = 'red',
        redSpymaster,
        blueSpymaster,
      ) => {
        const boardWords = getBoardWords();
        if (boardWords.length < 25) {
          console.error('Not enough words to generate board');
          return;
        }

        const board = generateBoard(boardWords, firstTeam);

        const state = createInitialState({
          gameMode: get().gameMode ?? 'godfather',
          timerDuration: timerSeconds,
          selectedCategories: categories,
          firstTeam,
          redTeamName,
          blueTeamName,
          roomCode: get().roomCode ?? undefined,
          hostName: get().hostName ?? undefined,
        });

        state.board = board;
        if (redSpymaster) state.redTeam.spymaster = redSpymaster;
        if (blueSpymaster) state.blueTeam.spymaster = blueSpymaster;
        state.phase = 'spymaster_view';

        const viewMode = get().gameMode === 'godfather' ? 'spymaster' : 'team';

        set({
          ...applyLogicResult(state),
          viewMode,
          players: get().players,
        });

        get().syncToRoom();
      },

      // ── Give clue (spymaster action) ──

      giveClue: (clueWord, clueNumber) => {
        const store = get();
        if (store.phase !== 'spymaster_view') {
          return 'ليست مرحلة إعطاء الدليل';
        }

        if (!store.board || store.board.length === 0) {
          return 'اللوحة غير جاهزة — أعد بدء اللعبة';
        }

        if (!isValidClue(clueWord, store.board)) {
          return 'كلمة الدليل غير صالحة (موجودة على اللوحة أو مشابهة لكلمة عليها)';
        }

        try {
          const gameState = extractGameState(store);
          const newState = logicGiveClue(gameState, clueWord, clueNumber);

          set({
            ...applyLogicResult(newState),
            viewMode: store.gameMode === 'godfather' ? 'transition' : 'team',
          });

          get().syncToRoom();
          return null;
        } catch (e: unknown) {
          console.error('[Shifarat] giveClue error:', e);
          return (e instanceof Error) ? e.message : 'خطأ غير معروف';
        }
      },

      // ── Select/guess a card (team action) ──

      selectCard: (cardId) => {
        try {
          const store = get();

          // ── Pre-flight validation ──
          if (!store || !store.board || !Array.isArray(store.board) || store.board.length === 0) {
            console.error('[Shifarat] selectCard: board invalid');
            return { result: 'wrong' as const, gameEnded: false, error: 'اللوحة غير جاهزة' };
          }

          if (store.phase !== 'clue_given' && store.phase !== 'team_guessing') {
            return { result: 'wrong' as const, gameEnded: false, error: 'خطأ في المرحلة' };
          }

          const card = store.board.find((c) => c.id === cardId);
          if (!card || card.isRevealed || card.guessedBy) {
            return { result: 'wrong' as const, gameEnded: false, error: 'البطاقة غير متاحة' };
          }

          // Extract PLAIN game state — no proxy, no functions
          const gameState = extractGameState(store);

          // Call pure logic
          const guessResult = logicGuessWord(gameState, cardId);
          const { state: newLogicState, result, gameEnded } = guessResult;

          // Verify the result has a valid board
          if (!newLogicState.board || !Array.isArray(newLogicState.board)) {
            console.error('[Shifarat] guessWord returned invalid board');
            return { result: 'wrong' as const, gameEnded: false, error: 'خطأ داخلي في تحديث اللوحة' };
          }

          // Apply only the game state fields — never spread functions
          set({
            ...applyLogicResult(newLogicState),
            lastGuessResult: result,
          });

          get().syncToRoom();
          return { result, gameEnded };
        } catch (e: unknown) {
          console.error('[Shifarat] selectCard error:', e);
          const msg = (e instanceof Error) ? e.message : String(e);
          return { result: 'wrong' as const, gameEnded: false, error: `خطأ تقني: ${msg}` };
        }
      },

      // ── Pass turn (team gives up remaining guesses) ──

      passTurn: () => {
        const store = get();
        if (store.phase !== 'clue_given' && store.phase !== 'team_guessing') return;

        const gameState = extractGameState(store);
        const newState = logicPassTurn(gameState);

        set({
          ...applyLogicResult(newState),
          viewMode: store.gameMode === 'godfather' ? 'transition' : 'team',
        });

        get().syncToRoom();
      },

      // ── Confirm turn switch (after seeing result) ──

      confirmTurnSwitch: () => {
        const store = get();
        if (store.phase === 'game_over') return;

        if (store.phase === 'turn_result' || store.phase === 'turn_switch') {
          const gameState = extractGameState(store);
          const newState = logicSwitchTurn(gameState);
          set({
            ...applyLogicResult(newState),
            viewMode: store.gameMode === 'godfather' ? 'spymaster' : 'team',
            lastGuessResult: null,
          });
          get().syncToRoom();
        } else if (store.phase === 'clue_given' || store.phase === 'team_guessing') {
          const gameState = extractGameState(store);
          const passState = logicPassTurn(gameState);
          const newState = logicSwitchTurn(passState);
          set({
            ...applyLogicResult(newState),
            viewMode: store.gameMode === 'godfather' ? 'spymaster' : 'team',
            lastGuessResult: null,
          });
          get().syncToRoom();
        }
      },

      // ── Tick timer ──

      tickTimer: () => {
        const store = get();
        const gameState = extractGameState(store);
        const newState = logicTickTimer(gameState);
        set({
          ...applyLogicResult(newState),
          formattedTimer: formatTimer(newState.timerRemaining),
        });
      },

      // ── Reset game ──

      resetGame: () => {
        const store = get();
        if (store.roomCode && store.gameMode === 'diwaniya') {
          endRoomSession(store.roomCode);
        }
        set({
          ...initialState,
          viewMode: 'spymaster',
        });
      },

      // ── Room sync ──

      syncToRoom: () => {
        const store = get();
        if (!store.roomCode) return;

        const syncData = {
          board: store.board,
          redTeam: store.redTeam,
          blueTeam: store.blueTeam,
          currentTeam: store.currentTeam,
          phase: store.phase,
          currentClue: store.currentClue,
          guessesThisTurn: store.guessesThisTurn,
          guessesAllowed: store.guessesAllowed,
          lastGuessResult: store.lastGuessResult,
          timerRemaining: store.timerRemaining,
          roundNumber: store.roundNumber,
          clues: store.clues,
          gameLog: store.gameLog,
          winner: store.winner,
          winReason: store.winReason,
        };

        syncRoomState(store.roomCode, {
          phase: store.phase,
          round: store.roundNumber,
          stateJson: JSON.stringify(syncData),
          players: store.players.map((p) => ({
            name: p.name,
            role: p.team === 'red' ? 'team1' : 'team2',
            isAlive: true,
            isSilenced: false,
            hasRevealedMayor: false,
          })),
        });
      },

      // ── Computed helpers ──

      getTeamName: (team) => {
        const store = get();
        return team === 'red' ? store.redTeam.name : store.blueTeam.name;
      },
    }),
    {
      name: 'shifarat-game-storage',
      version: 12,
      migrate: (persisted, version) => {
        // Force a clean reset for any version below 12
        if (version < 12) {
          console.log('[Shifarat] Migrating from version', version, 'to 12 — resetting');
          return initialState as unknown as typeof persisted;
        }
        return persisted;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.board || state.board.length === 0) {
            setTimeout(() => {
              useShifaratStore.getState().resetGame();
            }, 0);
          }
        }
      },
      partialize: (state) => {
        const {
          formattedTimer, getTeamName, giveClue, selectCard, passTurn,
          confirmTurnSwitch, tickTimer, resetGame, startGame, setGameMode,
          setHostName, setRoomCode, setViewMode, syncToRoom, ...rest
        } = state;
        return rest as ShifaratPersistState;
      },
    }
  )
);
