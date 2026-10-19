// ════════════════════════════════════════════════════════════════
// حرب الاكلات (Food War) — Zustand Store
// Spin wheel → select food → eliminate hidden player → last standing wins
// ════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  GamePhase, GameMode, TurnPhase,
  FoodWarPlayer, FoodItem, FoodWarRound, GameLogEntry,
  PLAYER_COLORS, FOOD_ITEMS,
} from './foodwar-types';

export interface FoodWarState {
  phase: GamePhase;
  gameMode: GameMode;
  roomCode: string | null;
  hostName: string | null;
  playerName: string | null;

  // Players
  players: FoodWarPlayer[];
  totalRounds: number;
  currentRound: number;

  // Turn state
  turnPhase: TurnPhase;
  currentSelectorId: number | null;
  currentRoundData: FoodWarRound | null;
  winnerId: number | null;

  // Scoring
  scores: Record<number, number>;

  // Game log
  gameLog: GameLogEntry[];
  lastAction: string | null;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setGameMode: (mode: GameMode) => void;
  setRoomCode: (code: string | null) => void;
  setHostName: (name: string | null) => void;
  setPlayerName: (name: string | null) => void;
  setTotalRounds: (n: number) => void;

  startGame: (playerNames: string[], totalRounds: number) => void;
  spinWheel: () => void;
  selectFood: (foodId: number) => void;
  nextTurn: () => void;
  resetGame: () => void;

  syncToRoom: () => void;
}

function makeLog(round: number, message: string, type: GameLogEntry['type'] = 'info'): GameLogEntry {
  return { round, message, type, timestamp: Date.now() };
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function pickRandomFoodItems(count: number): FoodItem[] {
  const shuffled = [...FOOD_ITEMS].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, count);
  return picked.map((f, i) => ({
    id: i,
    emoji: f.emoji,
    name: f.name,
    color: f.color,
    hiddenPlayerId: null,
    revealed: false,
  }));
}

function assignHiddenPlayers(foodItems: FoodItem[], alivePlayers: FoodWarPlayer[]): FoodItem[] {
  // Shuffle alive players (excluding the selector)
  const availablePlayers = alivePlayers.filter(p => !p.isHidden);
  const shuffled = [...availablePlayers].sort(() => Math.random() - 0.5);
  
  const updated = foodItems.map((food, i) => ({
    ...food,
    hiddenPlayerId: shuffled[i % shuffled.length]?.id ?? null,
  }));
  return updated;
}

function pickSelector(players: FoodWarPlayer[]): number {
  const alive = players.filter(p => p.isAlive);
  if (alive.length <= 1) return alive[0]?.id ?? 0;
  return alive[Math.floor(Math.random() * alive.length)].id;
}

const initialState = {
  phase: 'landing' as GamePhase,
  gameMode: 'classic' as GameMode,
  roomCode: null as string | null,
  hostName: null as string | null,
  playerName: null as string | null,
  players: [] as FoodWarPlayer[],
  totalRounds: 3,
  currentRound: 0,
  turnPhase: 'spinning' as TurnPhase,
  currentSelectorId: null as number | null,
  currentRoundData: null as FoodWarRound | null,
  winnerId: null as number | null,
  scores: {} as Record<number, number>,
  gameLog: [] as GameLogEntry[],
  lastAction: null as string | null,
};

export const useFoodWarStore = create<FoodWarState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPhase: (phase) => { set({ phase }); get().syncToRoom(); },
      setGameMode: (gameMode) => set({ gameMode }),
      setRoomCode: (roomCode) => set({ roomCode }),
      setHostName: (hostName) => set({ hostName }),
      setPlayerName: (playerName) => set({ playerName }),
      setTotalRounds: (totalRounds) => set({ totalRounds }),

      startGame: (playerNames, totalRounds) => {
        const players: FoodWarPlayer[] = playerNames.map((name, i) => ({
          id: i,
          name: name || `لاعب ${i + 1}`,
          color: PLAYER_COLORS[i % PLAYER_COLORS.length].color,
          emoji: PLAYER_COLORS[i % PLAYER_COLORS.length].emoji,
          isAlive: true,
          isHidden: false,
          hiddenBehind: null,
        }));

        const scores: Record<number, number> = {};
        players.forEach(p => { scores[p.id] = 0; });

        set({
          phase: 'playing',
          players,
          totalRounds,
          currentRound: 0,
          turnPhase: 'spinning',
          currentSelectorId: null,
          currentRoundData: null,
          winnerId: null,
          scores,
          gameLog: [makeLog(0, `🍕 بدأت حرب الاكلات! ${players.length} لاعبين`, 'system')],
          lastAction: 'اللعبة بدأت! اضغط السبين',
        });
        get().syncToRoom();
      },

      spinWheel: () => {
        const state = get();
        if (state.phase !== 'playing' || state.turnPhase !== 'spinning') return;

        const alivePlayers = state.players.filter(p => p.isAlive);
        if (alivePlayers.length <= 1) return;

        const selectorId = pickSelector(state.players);
        const selector = state.players[selectorId];
        if (!selector) return;

        // Number of food items = alive players - 1 (selector doesn't hide)
        const foodCount = Math.min(alivePlayers.length - 1, FOOD_ITEMS.length);
        const foodItems = pickRandomFoodItems(foodCount);
        
        // Assign hidden players to food items (all alive except selector)
        const hiders = alivePlayers.filter(p => p.id !== selectorId);
        const shuffledHiders = [...hiders].sort(() => Math.random() - 0.5);
        const foodWithHidden = foodItems.map((food, i) => ({
          ...food,
          hiddenPlayerId: shuffledHiders[i]?.id ?? null,
        }));

        // Mark hidden players
        const updatedPlayers = state.players.map(p => ({
          ...p,
          isHidden: foodWithHidden.some(f => f.hiddenPlayerId === p.id),
          hiddenBehind: foodWithHidden.find(f => f.hiddenPlayerId === p.id)?.id ?? null,
        }));

        set({
          turnPhase: 'selecting',
          currentSelectorId: selectorId,
          currentRoundData: {
            roundNumber: state.currentRound,
            selectorId,
            foodItems: foodWithHidden,
            selectedFoodId: null,
            eliminatedPlayerId: null,
          },
          players: updatedPlayers,
          gameLog: [...state.gameLog, makeLog(state.currentRound + 1, `🎡 العجلة اختارت: ${selector.name} — اختر طعاماً!`, 'info')],
          lastAction: `${selector.name} — اختر طعاماً!`,
        });
        get().syncToRoom();
      },

      selectFood: (foodId) => {
        const state = get();
        if (state.phase !== 'playing' || state.turnPhase !== 'selecting') return;
        if (!state.currentRoundData) return;

        const food = state.currentRoundData.foodItems.find(f => f.id === foodId);
        if (!food || food.revealed) return;

        const eliminatedId = food.hiddenPlayerId;
        const eliminated = eliminatedId !== null ? state.players[eliminatedId] : null;

        // Reveal the food item
        const updatedFood = state.currentRoundData.foodItems.map(f =>
          f.id === foodId ? { ...f, revealed: true } : f
        );

        // Eliminate hidden player if exists
        const updatedPlayers = state.players.map(p =>
          p.id === eliminatedId ? { ...p, isAlive: false, isHidden: false, hiddenBehind: null } : { ...p, isHidden: false, hiddenBehind: null }
        );

        // Update scores — selector gets +1 if they eliminated someone
        const updatedScores = { ...state.scores };
        if (eliminatedId !== null && state.currentSelectorId !== null) {
          updatedScores[state.currentSelectorId] = (updatedScores[state.currentSelectorId] || 0) + 1;
        }

        const aliveCount = updatedPlayers.filter(p => p.isAlive).length;

        set({
          turnPhase: 'revealing',
          players: updatedPlayers,
          scores: updatedScores,
          currentRoundData: {
            ...state.currentRoundData,
            foodItems: updatedFood,
            selectedFoodId: foodId,
            eliminatedPlayerId: eliminatedId,
          },
          gameLog: [...state.gameLog, makeLog(
            state.currentRound + 1,
            eliminated ? `${food.emoji} ${selector?.name ?? ''} اختار ${food.name}! وراءها: ${eliminated.name} — خرج!` : `${food.emoji} اختار ${food.name} — لا أحد!`,
            eliminated ? 'danger' : 'info'
          )],
          lastAction: eliminated ? `${food.emoji} ${eliminated.name} خرج!` : `${food.emoji} لا أحد!`,
        });

        // Check for winner
        if (aliveCount <= 1) {
          const winner = updatedPlayers.find(p => p.isAlive);
          set({
            phase: 'game_over',
            winnerId: winner?.id ?? null,
            gameLog: [...get().gameLog, makeLog(state.currentRound + 1, `🏆 الفائز: ${winner?.name ?? 'لا أحد'}!`, 'system')],
            lastAction: `🏆 الفائز: ${winner?.name ?? 'لا أحد'}!`,
          });
          get().syncToRoom();
          return;
        }

        get().syncToRoom();
      },

      nextTurn: () => {
        const state = get();
        if (state.phase !== 'playing') return;
        
        const newRound = state.currentRound + 1;
        if (newRound >= state.totalRounds) {
          // Game over — highest score wins
          const sorted = Object.entries(state.scores).sort((a, b) => b[1] - a[1]);
          const winnerId = parseInt(sorted[0]?.[0] || '0');
          set({
            phase: 'game_over',
            winnerId,
            currentRound: newRound,
            turnPhase: 'spinning',
            currentRoundData: null,
            gameLog: [...state.gameLog, makeLog(newRound, `🏆 انتهت اللعبة! الفائز: ${state.players[winnerId]?.name ?? 'لا أحد'}`, 'system')],
            lastAction: `🏆 انتهت اللعبة!`,
          });
          get().syncToRoom();
          return;
        }

        set({
          currentRound: newRound,
          turnPhase: 'spinning',
          currentSelectorId: null,
          currentRoundData: null,
          gameLog: [...state.gameLog, makeLog(newRound + 1, `🎯 الجولة ${newRound + 1} — اضغط السبين!`, 'info')],
          lastAction: `الجولة ${newRound + 1} — اضغط السبين!`,
        });
        get().syncToRoom();
      },

      resetGame: () => {
        const state = get();
        if (state.gameMode === 'diwaniya' && state.roomCode) {
          fetch(`/api/foodwar-room/${state.roomCode}`, { method: 'DELETE' }).catch(() => {});
        }
        set({ ...initialState });
      },

      syncToRoom: () => {
        const state = get();
        if (state.gameMode !== 'diwaniya' || !state.roomCode) return;
        fetch(`/api/foodwar-room/${state.roomCode}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phase: state.phase, stateJson: JSON.stringify({ currentRound: state.currentRound, turnPhase: state.turnPhase, players: state.players, scores: state.scores, gameLog: state.gameLog, lastAction: state.lastAction }) }),
        }).catch(() => {});
      },
    }),
    { name: 'foodwar-game-storage', version: 1 }
  )
);

export function generateFoodWarRoomCode(): string { return generateRoomCode(); }
