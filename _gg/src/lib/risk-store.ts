// ============================================================
// المجازفة (Risk) - Zustand Store
// Color/Number matching mechanics, 50-card deck, individual players
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RiskPlayer, RiskGamePhase, RiskCard, RiskLogEntry, RiskTurnState, RiskGameConfig } from './risk-types';
import { generateDeck, checkMatch, getGridCols, PLAYER_COLORS, DEFAULT_PLAYER_NAMES, CARD_COLOR_CONFIG } from './risk-types';

export type RiskGameMode = 'classic' | 'diwaniya';

interface RiskState {
  // Game Phase
  phase: RiskGamePhase;

  // Game Mode
  gameMode: RiskGameMode;

  // Diwaniya
  roomCode: string | null;
  hostName: string | null;

  // Players
  players: RiskPlayer[];
  currentPlayerIndex: number;

  // Cards
  cards: RiskCard[];
  deckCount: number; // Track how many decks have been generated

  // Config
  targetScore: number;

  // Turn state
  turnState: RiskTurnState;
  lastDrawnCard: RiskCard | null;
  drawnThisTurn: RiskCard[];     // Cards drawn in current turn (for matching check)
  roundMultiplier: number;       // 1, 2, or 3 (from double/triple)
  lastMatchInfo: {               // Info about the match that caused turn loss
    matched: boolean;
    matchType: 'color' | 'number' | null;
    matchWith: RiskCard | null;
    lostPoints: number;
  } | null;

  // Game Log
  gameLog: RiskLogEntry[];
  logCounter: number;

  // Game Over
  winner: RiskPlayer | null;

  // Actions
  setPhase: (phase: RiskGamePhase) => void;
  setGameMode: (mode: RiskGameMode) => void;
  setRoomCode: (code: string | null) => void;
  setHostName: (name: string | null) => void;

  startGame: (config: RiskGameConfig) => void;
  drawCard: (cardId: string) => void;
  continueTurn: () => void;
  bankPoints: () => void;
  endTurn: () => void;
  closeModal: () => void;
  resetGame: () => void;

  // Helpers
  getCurrentPlayer: () => RiskPlayer;
  getGridCols: () => number;
}

const initialState = {
  phase: 'landing' as RiskGamePhase,
  gameMode: 'classic' as RiskGameMode,
  roomCode: null as string | null,
  hostName: null as string | null,
  players: [] as RiskPlayer[],
  currentPlayerIndex: 0,
  cards: [] as RiskCard[],
  deckCount: 0,
  targetScore: 50,
  turnState: 'waiting_for_draw' as RiskTurnState,
  lastDrawnCard: null as RiskCard | null,
  drawnThisTurn: [] as RiskCard[],
  roundMultiplier: 1,
  lastMatchInfo: null as { matched: boolean; matchType: 'color' | 'number' | null; matchWith: RiskCard | null; lostPoints: number; } | null,
  gameLog: [] as RiskLogEntry[],
  logCounter: 0,
  winner: null as RiskPlayer | null,
};

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createPlayers(config: RiskGameConfig): RiskPlayer[] {
  return config.playerNames.map((name, i) => ({
    id: `player_${i}`,
    name: name || DEFAULT_PLAYER_NAMES[i],
    score: 0,
    roundScore: 0,
    color: PLAYER_COLORS[i % PLAYER_COLORS.length].color,
    colorHex: PLAYER_COLORS[i % PLAYER_COLORS.length].colorHex,
    emoji: PLAYER_COLORS[i % PLAYER_COLORS.length].emoji,
  }));
}

function addLogEntry(
  state: Pick<RiskState, 'logCounter'>,
  player: RiskPlayer,
  action: string,
): RiskLogEntry {
  return {
    id: state.logCounter + 1,
    playerId: player.id,
    playerName: player.name,
    action,
    timestamp: Date.now(),
  };
}

// ============================================================
// Room sync helper
// ============================================================
function syncToRoom(state: RiskState, updates: Record<string, unknown>) {
  if (state.gameMode !== 'diwaniya' || !state.roomCode) return;
  fetch(`/api/risk-room/${state.roomCode}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      players: state.players,
      currentPlayerIndex: state.currentPlayerIndex,
      cards: state.cards,
      targetScore: state.targetScore,
      turnState: state.turnState,
      lastDrawnCard: state.lastDrawnCard,
      drawnThisTurn: state.drawnThisTurn,
      roundMultiplier: state.roundMultiplier,
      lastMatchInfo: state.lastMatchInfo,
      gameLog: state.gameLog,
      winner: state.winner,
      phase: state.phase,
      deckCount: state.deckCount,
      ...updates,
    }),
  }).catch(() => {});
}

export const useRiskStore = create<RiskState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPhase: (phase) => set({ phase }),
      setGameMode: (gameMode) => set({ gameMode }),
      setRoomCode: (roomCode) => set({ roomCode }),
      setHostName: (hostName) => set({ hostName }),

      startGame: (config: RiskGameConfig) => {
        const state = get();
        const players = createPlayers(config);
        const cards = generateDeck();
        const code = state.gameMode === 'diwaniya' ? generateRoomCode() : null;

        if (state.gameMode === 'diwaniya' && code) {
          const fullState = {
            players,
            cards,
            targetScore: config.targetScore,
            turnState: 'waiting_for_draw' as RiskTurnState,
            lastDrawnCard: null,
            drawnThisTurn: [] as RiskCard[],
            roundMultiplier: 1,
            lastMatchInfo: null,
            gameLog: [] as RiskLogEntry[],
            winner: null,
            currentPlayerIndex: 0,
            phase: 'playing' as RiskGamePhase,
            deckCount: 1,
          };

          fetch('/api/risk-room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, hostName: 'العراب' }),
          }).then(() => {
            return fetch(`/api/risk-room/${code}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fullState),
            });
          }).catch(() => {});
        }

        set({
          phase: 'playing',
          players,
          cards,
          targetScore: config.targetScore,
          turnState: 'waiting_for_draw',
          lastDrawnCard: null,
          drawnThisTurn: [],
          roundMultiplier: 1,
          lastMatchInfo: null,
          currentPlayerIndex: 0,
          gameLog: [],
          logCounter: 0,
          winner: null,
          roomCode: code,
          deckCount: 1,
        });
      },

      drawCard: (cardId: string) => {
        const state = get();
        if (state.phase !== 'playing') return;
        if (state.turnState !== 'waiting_for_draw') return;

        const cardIndex = state.cards.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;
        if (state.cards[cardIndex].revealed) return;

        const card = state.cards[cardIndex];
        const newCards = [...state.cards];
        newCards[cardIndex] = { ...card, revealed: true };

        const currentPlayer = state.players[state.currentPlayerIndex];
        const newPlayers = [...state.players];
        let newLog: RiskLogEntry;
        let newTurnState: RiskTurnState;
        let newWinner: RiskPlayer | null = null;
        const newDrawnThisTurn = [...state.drawnThisTurn, newCards[cardIndex]];
        let newRoundMultiplier = state.roundMultiplier;
        let newMatchInfo: RiskState['lastMatchInfo'] = null;

        switch (card.type) {
          case 'number': {
            // Check for matching color or number with previously drawn cards
            const { matched, matchType, matchWith } = checkMatch(card, state.drawnThisTurn);

            if (matched) {
              // Match found — lose all round points
              const lostPoints = currentPlayer.roundScore;
              newPlayers[state.currentPlayerIndex] = {
                ...currentPlayer,
                roundScore: 0,
              };

              const matchColor = matchType === 'color' && matchWith?.color
                ? CARD_COLOR_CONFIG[matchWith.color].labelAr
                : '';
              const matchNum = matchType === 'number' ? `${matchWith?.number}` : '';
              const newCardInfo = card.color
                ? CARD_COLOR_CONFIG[card.color].labelAr
                : '';

              newLog = addLogEntry(
                state,
                currentPlayer,
                `❌ تطابق! (${
                  matchType === 'color'
                    ? `${matchColor} = ${newCardInfo}`
                    : `رقم ${matchNum}`
                }) — خسر ${lostPoints} نقطة`,
              );
              newTurnState = 'turn_lost';
              newMatchInfo = { matched: true, matchType, matchWith, lostPoints };
            } else {
              // No match — add value × multiplier to round score
              const addedValue = card.value * state.roundMultiplier;
              newPlayers[state.currentPlayerIndex] = {
                ...currentPlayer,
                roundScore: currentPlayer.roundScore + addedValue,
              };
              newLog = addLogEntry(
                state,
                currentPlayer,
                `🃏 سحب ${card.value} (${CARD_COLOR_CONFIG[card.color!].emoji} ${CARD_COLOR_CONFIG[card.color!].labelAr})${state.roundMultiplier > 1 ? ` ×${state.roundMultiplier} = ${addedValue}` : ` (+${addedValue})`}`,
              );
              newTurnState = 'waiting_for_decision';
            }
            break;
          }

          case 'bomb': {
            // Lose all round points, turn ends
            const lostPoints = currentPlayer.roundScore;
            newPlayers[state.currentPlayerIndex] = {
              ...currentPlayer,
              roundScore: 0,
            };
            newLog = addLogEntry(
              state,
              currentPlayer,
              `💣 قنبلة! خسر ${lostPoints} نقطة من الجولة`,
            );
            newTurnState = 'bomb_exploded';
            break;
          }

          case 'skip': {
            // Turn skipped
            newLog = addLogEntry(
              state,
              currentPlayer,
              '⏭️ تخطي! تم تخطي الدور',
            );
            newTurnState = 'showing_result';
            break;
          }

          case 'double': {
            // Double the round multiplier
            newRoundMultiplier = state.roundMultiplier * 2;
            newLog = addLogEntry(
              state,
              currentPlayer,
              `✨ دابل! المضاعف = ×${newRoundMultiplier}`,
            );
            newTurnState = 'showing_result';
            break;
          }

          case 'triple': {
            // Triple the round multiplier
            newRoundMultiplier = state.roundMultiplier * 3;
            newLog = addLogEntry(
              state,
              currentPlayer,
              `🔥 تريبل! المضاعف = ×${newRoundMultiplier}`,
            );
            newTurnState = 'showing_result';
            break;
          }
        }

        const newState: Partial<RiskState> = {
          cards: newCards,
          players: newPlayers,
          lastDrawnCard: newCards[cardIndex],
          turnState: newTurnState,
          gameLog: [...state.gameLog, newLog],
          logCounter: state.logCounter + 1,
          drawnThisTurn: newDrawnThisTurn,
          roundMultiplier: newRoundMultiplier,
          lastMatchInfo: newMatchInfo,
        };

        if (newWinner !== null) {
          newState.winner = newWinner;
        }

        set(newState);
        syncToRoom(get(), newState);
      },

      continueTurn: () => {
        const state = get();
        if (state.turnState !== 'waiting_for_decision') return;
        set({ turnState: 'waiting_for_draw' });
        syncToRoom(get(), { turnState: 'waiting_for_draw' });
      },

      bankPoints: () => {
        const state = get();
        if (state.turnState !== 'waiting_for_decision') return;

        const currentPlayer = state.players[state.currentPlayerIndex];
        const newPlayers = [...state.players];
        const bankedAmount = currentPlayer.roundScore;
        newPlayers[state.currentPlayerIndex] = {
          ...currentPlayer,
          score: currentPlayer.score + currentPlayer.roundScore,
          roundScore: 0,
        };

        const newLog = addLogEntry(
          state,
          currentPlayer,
          `💰 حفظ ${bankedAmount} نقاط! (المجموع: ${currentPlayer.score + currentPlayer.roundScore})`,
        );

        // Check if player reached target score
        let newWinner: RiskPlayer | null = null;
        if (currentPlayer.score + currentPlayer.roundScore >= state.targetScore) {
          newWinner = newPlayers[state.currentPlayerIndex];
        }

        const updates: Partial<RiskState> = {
          players: newPlayers,
          turnState: newWinner ? 'showing_result' : 'showing_result',
          gameLog: [...state.gameLog, newLog],
          logCounter: state.logCounter + 1,
          winner: newWinner,
        };

        set(updates);
        syncToRoom(get(), updates);
      },

      endTurn: () => {
        const state = get();

        // Check if game is over
        if (state.winner !== null) {
          set({
            phase: 'game_over',
            turnState: 'waiting_for_draw',
            lastDrawnCard: null,
            drawnThisTurn: [],
            roundMultiplier: 1,
            lastMatchInfo: null,
          });
          syncToRoom(get(), {
            phase: 'game_over',
            turnState: 'waiting_for_draw',
            drawnThisTurn: [],
            roundMultiplier: 1,
          });
          return;
        }

        // Check if all cards are revealed → generate new deck
        let newCards = state.cards;
        let newDeckCount = state.deckCount;
        if (state.cards.every(c => c.revealed)) {
          newCards = generateDeck();
          newDeckCount += 1;
        }

        // Advance to next player
        const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

        const updates: Partial<RiskState> = {
          currentPlayerIndex: nextPlayerIndex,
          lastDrawnCard: null,
          turnState: 'waiting_for_draw',
          drawnThisTurn: [],
          roundMultiplier: 1,
          lastMatchInfo: null,
          cards: newCards,
          deckCount: newDeckCount,
        };

        set(updates);
        syncToRoom(get(), updates);
      },

      closeModal: () => {
        set({ lastDrawnCard: null, lastMatchInfo: null });
      },

      resetGame: () => {
        const state = get();
        if (state.gameMode === 'diwaniya' && state.roomCode) {
          fetch(`/api/risk-room/${state.roomCode}`, { method: 'DELETE' }).catch(() => {});
        }
        set({
          ...initialState,
          cards: [],
          gameLog: [],
          players: [],
          logCounter: 0,
          lastDrawnCard: null,
          gameMode: 'classic',
          roomCode: null,
          hostName: null,
        });
      },

      getCurrentPlayer: () => {
        const state = get();
        return state.players[state.currentPlayerIndex];
      },

      getGridCols: () => {
        const state = get();
        return getGridCols(state.cards.length || 50);
      },
    }),
    {
      name: 'risk-game-storage-v2',
      version: 2,
      migrate: () => ({
        ...initialState,
        cards: [] as RiskCard[],
        gameLog: [] as RiskLogEntry[],
        players: [] as RiskPlayer[],
        logCounter: 0,
        lastDrawnCard: null,
        drawnThisTurn: [] as RiskCard[],
        roundMultiplier: 1,
        lastMatchInfo: null,
        gameMode: 'classic' as RiskGameMode,
        roomCode: null,
        hostName: null,
        winner: null,
        deckCount: 0,
      }) as RiskState,
      partialize: (state) => ({
        phase: state.phase,
        gameMode: state.gameMode,
        roomCode: state.roomCode,
        hostName: state.hostName,
        players: state.players,
        currentPlayerIndex: state.currentPlayerIndex,
        cards: state.cards,
        targetScore: state.targetScore,
        turnState: state.turnState,
        lastDrawnCard: state.lastDrawnCard,
        drawnThisTurn: state.drawnThisTurn,
        roundMultiplier: state.roundMultiplier,
        lastMatchInfo: state.lastMatchInfo,
        gameLog: state.gameLog,
        logCounter: state.logCounter,
        winner: state.winner,
        deckCount: state.deckCount,
      }),
    }
  )
);
