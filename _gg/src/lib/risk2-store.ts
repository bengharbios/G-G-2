// ============================================================
// المجازفة 2 (Risk 2) - Zustand Store
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Risk2Player, Risk2GamePhase, Risk2Card, Risk2LogEntry, Risk2TurnState, Risk2GameConfig, CardType } from './risk2-types';
import { generateDeck, checkMatch, getCardStats, CARD_COLORS, SPECIAL_CARD_INFO } from './risk2-types';

export type Risk2GameMode = 'classic' | 'diwaniya';

interface Risk2State {
  phase: Risk2GamePhase;
  gameMode: Risk2GameMode;
  roomCode: string | null;
  hostName: string | null;

  // Players
  players: Risk2Player[];
  currentPlayerIndex: number;

  // Cards
  cards: Risk2Card[];
  deckNumber: number;          // Which deck generation we're on
  config: Risk2GameConfig;

  // Turn
  turnState: Risk2TurnState;
  lastDrawnCard: Risk2Card | null;
  drawnThisTurn: Risk2Card[];  // Cards drawn in current turn (for matching)
  matchReason: string;         // Why the turn was lost

  // Game Log
  gameLog: Risk2LogEntry[];
  logCounter: number;

  // Game Over
  winner: Risk2Player | null;
  winReason: string;

  // Actions
  setPhase: (phase: Risk2GamePhase) => void;
  setGameMode: (mode: Risk2GameMode) => void;
  setRoomCode: (code: string | null) => void;
  setHostName: (name: string | null) => void;

  startGame: (config: Risk2GameConfig, players: Risk2Player[]) => void;
  drawCard: (cardId: string) => void;
  continueTurn: () => void;
  bankPoints: () => void;
  advanceTurn: () => void;
  closeModal: () => void;
  resetGame: () => void;
}

const initialState = {
  phase: 'landing' as Risk2GamePhase,
  gameMode: 'classic' as Risk2GameMode,
  roomCode: null as string | null,
  hostName: null as string | null,
  players: [] as Risk2Player[],
  currentPlayerIndex: 0,
  cards: [] as Risk2Card[],
  deckNumber: 1,
  config: { targetScore: 50, bombCount: 2, skipCount: 1, doubleCount: 1, tripleCount: 1 } as Risk2GameConfig,
  turnState: 'waiting_for_draw' as Risk2TurnState,
  lastDrawnCard: null as Risk2Card | null,
  drawnThisTurn: [] as Risk2Card[],
  matchReason: '',
  gameLog: [] as Risk2LogEntry[],
  logCounter: 0,
  winner: null as Risk2Player | null,
  winReason: '',
};

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function addLog(
  state: Pick<Risk2State, 'logCounter'>,
  playerName: string,
  action: string,
  cardType: CardType,
): Risk2LogEntry {
  return {
    id: state.logCounter + 1,
    playerName,
    action,
    cardType,
    timestamp: Date.now(),
  };
}

// ============================================================
// Room sync helper
// ============================================================
function syncToRoom(state: Risk2State, updates: Record<string, unknown>) {
  if (state.gameMode !== 'diwaniya' || !state.roomCode) return;
  fetch(`/api/risk2-room/${state.roomCode}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      players: state.players,
      currentPlayerIndex: state.currentPlayerIndex,
      cards: state.cards,
      deckNumber: state.deckNumber,
      config: state.config,
      turnState: state.turnState,
      lastDrawnCard: state.lastDrawnCard,
      drawnThisTurn: state.drawnThisTurn,
      matchReason: state.matchReason,
      gameLog: state.gameLog,
      winner: state.winner,
      winReason: state.winReason,
      phase: state.phase,
      ...updates,
    }),
  }).catch(() => {});
}

export const useRisk2Store = create<Risk2State>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPhase: (phase) => set({ phase }),
      setGameMode: (gameMode) => set({ gameMode }),
      setRoomCode: (roomCode) => set({ roomCode }),
      setHostName: (hostName) => set({ hostName }),

      startGame: (config: Risk2GameConfig, players: Risk2Player[]) => {
        const state = get();
        const cards = generateDeck(config);
        const code = state.gameMode === 'diwaniya' ? generateRoomCode() : null;

        const fullState = {
          players,
          cards,
          deckNumber: 1,
          config,
          turnState: 'waiting_for_draw' as Risk2TurnState,
          lastDrawnCard: null,
          drawnThisTurn: [],
          matchReason: '',
          gameLog: [] as Risk2LogEntry[],
          winner: null,
          winReason: '',
          currentPlayerIndex: 0,
          phase: 'playing' as Risk2GamePhase,
        };

        if (state.gameMode === 'diwaniya' && code) {
          // Create room first, then sync game state
          fetch('/api/risk2-room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, hostName: 'العراب' }),
          }).then((res) => {
            if (!res.ok) {
              console.error('Failed to create room:', res.status);
              return;
            }
            // Room created in DB — now sync game state
            return fetch(`/api/risk2-room/${code}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fullState),
            });
          }).catch((err) => {
            console.error('Room sync error:', err);
          });
        }

        set({
          phase: 'playing',
          players,
          cards,
          deckNumber: 1,
          config,
          turnState: 'waiting_for_draw',
          lastDrawnCard: null,
          drawnThisTurn: [],
          matchReason: '',
          currentPlayerIndex: 0,
          gameLog: [],
          logCounter: 0,
          winner: null,
          winReason: '',
          roomCode: code,
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
        if (!currentPlayer) return;

        const newDrawnThisTurn = [...state.drawnThisTurn, newCards[cardIndex]];
        const newPlayers = [...state.players];
        let newTurnState: Risk2TurnState;
        let newLog: Risk2LogEntry;
        let newMatchReason = '';
        let newWinner: Risk2Player | null = null;
        let newWinReason = '';

        switch (card.type) {
          case 'number': {
            // Check for color/number match
            const match = checkMatch(card, state.drawnThisTurn);

            if (match.matched) {
              // MATCH → lose all round points
              newPlayers[state.currentPlayerIndex] = {
                ...currentPlayer,
                roundScore: 0,
                multiplier: 1,
              };
              newTurnState = 'turn_lost';
              newMatchReason = match.reason;
              newLog = addLog(state, currentPlayer.name, `${match.reason} — خسر ${currentPlayer.roundScore} نقطة!`, 'bomb');
            } else {
              // SAFE — add value to round score
              const effectiveValue = card.number * currentPlayer.multiplier;
              newPlayers[state.currentPlayerIndex] = {
                ...currentPlayer,
                roundScore: currentPlayer.roundScore + effectiveValue,
              };
              newTurnState = 'waiting_for_decision';
              newLog = addLog(state, currentPlayer.name, `كشف ${card.number} ${CARD_COLORS[card.color!].emoji} (+${effectiveValue})`, 'number');
            }
            break;
          }

          case 'bomb': {
            // Lose ALL round points
            newPlayers[state.currentPlayerIndex] = {
              ...currentPlayer,
              roundScore: 0,
              multiplier: 1,
            };
            newTurnState = 'bomb_exploded';
            newLog = addLog(state, currentPlayer.name, `💣 قنبلة! خسر ${currentPlayer.roundScore} نقطة`, 'bomb');
            break;
          }

          case 'skip': {
            // Skip turn — player loses their turn AND accumulated round points
            newTurnState = 'showing_result';
            newLog = addLog(state, currentPlayer.name, '⏭️ تم تخطي الدور! خسر رصيد الجولة', 'skip');
            break;
          }

          case 'double': {
            // Multiply round score by 2 — player can continue or bank
            const doubledScore = currentPlayer.roundScore * 2;
            newPlayers[state.currentPlayerIndex] = {
              ...currentPlayer,
              roundScore: doubledScore,
              multiplier: currentPlayer.multiplier * 2,
            };
            newTurnState = 'waiting_for_decision';
            newLog = addLog(state, currentPlayer.name, `✨ ×2 ضعف! الرصيد أصبح ${doubledScore}`, 'double');
            break;
          }

          case 'triple': {
            // Multiply round score by 3 — player can continue or bank
            const tripledScore = currentPlayer.roundScore * 3;
            newPlayers[state.currentPlayerIndex] = {
              ...currentPlayer,
              roundScore: tripledScore,
              multiplier: currentPlayer.multiplier * 3,
            };
            newTurnState = 'waiting_for_decision';
            newLog = addLog(state, currentPlayer.name, `🔥 ×3 ثلاثة أضعاف! الرصيد أصبح ${tripledScore}`, 'triple');
            break;
          }
        }

        const newState: Partial<Risk2State> = {
          cards: newCards,
          players: newPlayers,
          lastDrawnCard: newCards[cardIndex],
          turnState: newTurnState,
          drawnThisTurn: newDrawnThisTurn,
          matchReason: newMatchReason,
          gameLog: [...state.gameLog, newLog],
          logCounter: state.logCounter + 1,
        };

        if (newWinner) {
          newState.winner = newWinner;
          newState.winReason = newWinReason;
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
        if (state.turnState !== 'waiting_for_decision' && state.turnState !== 'waiting_for_draw') return;

        const currentPlayer = state.players[state.currentPlayerIndex];
        if (!currentPlayer) return;

        const bankedAmount = currentPlayer.roundScore;
        const newPlayers = [...state.players];
        newPlayers[state.currentPlayerIndex] = {
          ...currentPlayer,
          score: currentPlayer.score + bankedAmount,
          roundScore: 0,
          multiplier: 1,
        };

        const newLog = addLog(state, currentPlayer.name, `💰 حفظ ${bankedAmount} نقاط! (المجموع: ${currentPlayer.score + bankedAmount})`, 'number');

        // Check win condition
        const updatedPlayer = newPlayers[state.currentPlayerIndex];
        let newWinner: Risk2Player | null = null;
        let newWinReason = '';

        if (updatedPlayer.score >= state.config.targetScore) {
          newWinner = updatedPlayer;
          newWinReason = `${updatedPlayer.name} وصل إلى ${updatedPlayer.score} نقطة! 🏆`;
        }

        set({
          players: newPlayers,
          turnState: 'showing_result',
          gameLog: [...state.gameLog, newLog],
          logCounter: state.logCounter + 1,
          ...(newWinner ? { winner: newWinner, winReason: newWinReason } : {}),
        });

        syncToRoom(get(), {
          players: newPlayers,
          turnState: 'showing_result',
          ...(newWinner ? { winner: newWinner, winReason: newWinReason } : {}),
        });
      },

      advanceTurn: () => {
        const state = get();
        if (state.turnState !== 'showing_result' && state.turnState !== 'turn_lost' && state.turnState !== 'bomb_exploded') return;

        // Check game over (winner was set)
        if (state.winner) {
          set({
            phase: 'game_over',
            turnState: 'waiting_for_draw',
            lastDrawnCard: null,
            drawnThisTurn: [],
            matchReason: '',
          });
          syncToRoom(get(), { phase: 'game_over', turnState: 'waiting_for_draw' });
          return;
        }

        // Move to next player
        const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

        // Check if all cards are revealed → regenerate deck
        let newCards = state.cards;
        let newDeckNumber = state.deckNumber;
        if (newCards.every(c => c.revealed)) {
          newCards = generateDeck(state.config);
          newDeckNumber = state.deckNumber + 1;
        }

        set({
          currentPlayerIndex: nextPlayerIndex,
          lastDrawnCard: null,
          drawnThisTurn: [],
          matchReason: '',
          turnState: 'waiting_for_draw',
          cards: newCards,
          deckNumber: newDeckNumber,
          players: state.players.map((p, i) =>
            i === state.currentPlayerIndex
              ? { ...p, roundScore: 0, multiplier: 1 }
              : p
          ),
        });

        syncToRoom(get(), {
          currentPlayerIndex: nextPlayerIndex,
          lastDrawnCard: null,
          drawnThisTurn: [],
          matchReason: '',
          turnState: 'waiting_for_draw',
          cards: newCards,
          deckNumber: newDeckNumber,
        });
      },

      closeModal: () => {
        set({ lastDrawnCard: null });
      },

      resetGame: () => {
        const state = get();
        if (state.gameMode === 'diwaniya' && state.roomCode) {
          fetch(`/api/risk2-room/${state.roomCode}`, { method: 'DELETE' }).catch(() => {});
        }
        set({
          ...initialState,
          cards: [],
          gameLog: [],
          players: [],
          drawnThisTurn: [],
          logCounter: 0,
          lastDrawnCard: null,
          gameMode: 'classic',
          roomCode: null,
          hostName: null,
        });
      },
    }),
    {
      name: 'risk2-game-storage',
      version: 1,
      migrate: () => ({
        ...initialState,
        cards: [],
        gameLog: [],
        players: [],
        drawnThisTurn: [],
        logCounter: 0,
        lastDrawnCard: null,
        gameMode: 'classic' as Risk2GameMode,
        roomCode: null,
        hostName: null,
        config: { targetScore: 50, bombCount: 2, skipCount: 1, doubleCount: 1, tripleCount: 1 },
      }),
      partialize: (state) => ({
        phase: state.phase,
        gameMode: state.gameMode,
        roomCode: state.roomCode,
        hostName: state.hostName,
        players: state.players,
        currentPlayerIndex: state.currentPlayerIndex,
        cards: state.cards,
        deckNumber: state.deckNumber,
        config: state.config,
        turnState: state.turnState,
        lastDrawnCard: state.lastDrawnCard,
        drawnThisTurn: state.drawnThisTurn,
        matchReason: state.matchReason,
        gameLog: state.gameLog,
        logCounter: state.logCounter,
        winner: state.winner,
        winReason: state.winReason,
      }),
    }
  )
);
