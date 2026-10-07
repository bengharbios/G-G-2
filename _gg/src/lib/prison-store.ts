// ============================================================
// السجن (The Prison) - Zustand Store (العراب / Classic mode)
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PrisonTeam, PrisonGamePhase, GridCell, PrisonPlayer, PrisonLogEntry, InteractionState, CellItemType } from './prison-types';
import { generateGrid, checkGameEnd, getActivePlayers, getImprisonedPlayers } from './prison-types';
import { CELL_ITEMS } from './prison-types';

export type PrisonGameMode = 'classic' | 'diwaniya';

interface PrisonState {
  // Game Phase
  phase: PrisonGamePhase;

  // Game Mode
  gameMode: PrisonGameMode;

  // Diwaniya
  roomCode: string | null;
  hostName: string | null;

  // Teams
  alphaName: string;
  betaName: string;
  currentTeam: PrisonTeam;

  // Players
  players: PrisonPlayer[];
  currentPlayerId: string | null;

  // Grid
  gridSize: number;
  grid: GridCell[];

  // Interaction
  interactionState: InteractionState;
  revealedCell: GridCell | null;
  selectedTargetId: string | null;

  // Game Log
  gameLog: PrisonLogEntry[];
  logCounter: number;

  // Game Over
  winner: PrisonTeam | 'draw' | null;
  winReason: string;

  // Actions
  setPhase: (phase: PrisonGamePhase) => void;
  setGameMode: (mode: PrisonGameMode) => void;
  setRoomCode: (code: string | null) => void;
  setHostName: (name: string | null) => void;
  setTeamNames: (alpha: string, beta: string) => void;
  setGridSize: (size: number) => void;
  setPlayers: (players: PrisonPlayer[]) => void;

  startGame: () => void;
  selectPlayer: (playerId: string) => void;
  revealCell: (cellId: string) => void;
  imprisonOpponent: (targetId: string) => void;
  imprisonSelf: () => void;
  executePlayer: () => void;
  freeTeammate: (targetId: string) => void;
  skipTurn: () => void;
  advanceTurn: () => void;
  closeModal: () => void;
  resetGame: () => void;
}

const initialState = {
  phase: 'landing' as PrisonGamePhase,
  gameMode: 'classic' as PrisonGameMode,
  roomCode: null as string | null,
  hostName: null as string | null,
  alphaName: 'فريق أ',
  betaName: 'فريق ب',
  currentTeam: 'alpha' as PrisonTeam,
  players: [] as PrisonPlayer[],
  currentPlayerId: null as string | null,
  gridSize: 16,
  grid: [] as GridCell[],
  interactionState: 'waiting_for_player' as InteractionState,
  revealedCell: null as GridCell | null,
  selectedTargetId: null as string | null,
  gameLog: [] as PrisonLogEntry[],
  logCounter: 0,
  winner: null as PrisonTeam | 'draw' | null,
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
  state: PrisonState,
  team: PrisonTeam,
  playerName: string,
  action: string,
  itemType: CellItemType
): PrisonLogEntry {
  return {
    id: state.logCounter + 1,
    team,
    playerName,
    action,
    itemType,
    timestamp: Date.now(),
  };
}

export const usePrisonStore = create<PrisonState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPhase: (phase) => set({ phase }),
      setGameMode: (gameMode) => set({ gameMode }),
      setRoomCode: (roomCode) => set({ roomCode }),
      setHostName: (hostName) => set({ hostName }),
      setTeamNames: (alphaName, betaName) => set({ alphaName, betaName }),
      setGridSize: (gridSize) => set({ gridSize }),
      setPlayers: (players) => set({ players }),

      startGame: () => {
        const state = get();
        const grid = generateGrid(state.gridSize);
        const code = state.gameMode === 'diwaniya' ? generateRoomCode() : null;

        if (state.gameMode === 'diwaniya' && code) {
          // Create room via API
          fetch('/api/prison-room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, hostName: 'العراب' }),
          }).then(() => {
            // Set initial room state
            return fetch(`/api/prison-room/${code}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                alphaName: state.alphaName,
                betaName: state.betaName,
                currentTeam: state.currentTeam,
                players: state.players,
                gridSize: state.gridSize,
                grid,
                interactionState: 'waiting_for_player',
                revealedCell: null,
                gameLog: [],
                winner: null,
                winReason: '',
                phase: 'playing',
              }),
            });
          }).catch(() => {});
        }

        set({
          phase: 'playing',
          grid,
          interactionState: 'waiting_for_player',
          revealedCell: null,
          selectedTargetId: null,
          currentPlayerId: null,
          gameLog: [],
          logCounter: 0,
          winner: null,
          winReason: '',
          roomCode: code,
        });
      },

      selectPlayer: (playerId: string) => {
        const state = get();
        if (state.phase !== 'playing') return;
        if (state.interactionState !== 'waiting_for_player') return;

        const player = state.players.find(p => p.id === playerId);
        if (!player || player.status !== 'active') return;
        if (player.team !== state.currentTeam) return;

        set({
          currentPlayerId: playerId,
          interactionState: 'waiting_for_cell',
        });

        // Sync to room
        syncToRoom(get(), { currentPlayerId: playerId, interactionState: 'waiting_for_cell' });
      },

      revealCell: (cellId: string) => {
        const state = get();
        if (state.phase !== 'playing') return;
        if (state.interactionState !== 'waiting_for_cell') return;

        const cellIndex = state.grid.findIndex(c => c.id === cellId);
        if (cellIndex === -1) return;
        if (state.grid[cellIndex].status === 'revealed') return;

        const cell = state.grid[cellIndex];
        const newGrid = [...state.grid];
        newGrid[cellIndex] = { ...cell, status: 'revealed' };

        const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);
        if (!currentPlayer) return;

        const itemInfo = CELL_ITEMS[cell.type];
        const opponentTeam: PrisonTeam = state.currentTeam === 'alpha' ? 'beta' : 'alpha';

        const newLog = addLog(state, state.currentTeam, currentPlayer.name, `فتح زنزانة ${itemInfo.title}`, cell.type);

        let newState: Partial<PrisonState> = {
          grid: newGrid,
          revealedCell: newGrid[cellIndex],
          gameLog: [...state.gameLog, newLog],
          logCounter: state.logCounter + 1,
        };

        switch (cell.type) {
          case 'open': {
            // Imprison an opponent player - check if there are active opponents
            const activeOpponents = state.players.filter(p => p.team === opponentTeam && p.status === 'active');
            if (activeOpponents.length > 0) {
              newState.interactionState = 'picking_opponent_jail';
            } else {
              // No active opponents, skip effect
              newState.interactionState = 'showing_result';
              newState.selectedTargetId = null;
            }
            break;
          }
          case 'uniform': {
            // Current player gets imprisoned
            const newPlayers = state.players.map(p =>
              p.id === state.currentPlayerId
                ? { ...p, status: 'imprisoned' as const, uniformCount: p.uniformCount + 1 }
                : p
            );
            newState.players = newPlayers;
            newState.interactionState = 'showing_result';

            // Check game end after imprisonment
            const uniformGameEnd = checkGameEnd(newPlayers, newGrid);
            if (uniformGameEnd.ended) {
              newState.winner = uniformGameEnd.winner;
              newState.winReason = uniformGameEnd.reason;
            }
            break;
          }
          case 'skull': {
            // Current player is executed
            const newPlayers = state.players.map(p =>
              p.id === state.currentPlayerId
                ? { ...p, status: 'executed' as const }
                : p
            );
            newState.players = newPlayers;
            newState.interactionState = 'showing_result';

            // Check game end after execution
            const gameEndCheck = checkGameEnd(newPlayers, newGrid);
            if (gameEndCheck.ended) {
              newState.winner = gameEndCheck.winner;
              newState.winReason = gameEndCheck.reason;
            }
            break;
          }
          case 'key': {
            // Free a teammate - check if there are imprisoned teammates
            const imprisonedTeammates = state.players.filter(
              p => p.team === state.currentTeam && p.status === 'imprisoned'
            );
            if (imprisonedTeammates.length > 0) {
              newState.interactionState = 'picking_teammate_free';
            } else {
              // No imprisoned teammates, skip effect
              newState.interactionState = 'showing_result';
              newState.selectedTargetId = null;
            }
            break;
          }
          case 'skip': {
            // Skip turn - nothing happens
            newState.interactionState = 'showing_result';
            newState.selectedTargetId = null;
            break;
          }
        }

        set(newState);
        syncToRoom(get(), newState);
      },

      imprisonOpponent: (targetId: string) => {
        const state = get();
        if (state.interactionState !== 'picking_opponent_jail') return;

        const newPlayers = state.players.map(p =>
          p.id === targetId
            ? { ...p, status: 'imprisoned' as const, uniformCount: p.uniformCount + 1 }
            : p
        );

        const target = state.players.find(p => p.id === targetId);
        const newLog = addLog(state, state.currentTeam, target?.name || '', 'تم سجنه!', 'open');

        // Check game end after imprisonment
        const gameEndCheck = checkGameEnd(newPlayers, state.grid);

        set({
          players: newPlayers,
          interactionState: 'showing_result',
          selectedTargetId: targetId,
          gameLog: [...state.gameLog, newLog],
          logCounter: state.logCounter + 1,
          ...(gameEndCheck.ended ? { winner: gameEndCheck.winner, winReason: gameEndCheck.reason } : {}),
        });

        syncToRoom(get(), {
          players: newPlayers,
          interactionState: 'showing_result',
          selectedTargetId: targetId,
          ...(gameEndCheck.ended ? { winner: gameEndCheck.winner, winReason: gameEndCheck.reason } : {}),
        });
      },

      imprisonSelf: () => {
        // Handled in revealCell for uniform type
      },

      executePlayer: () => {
        // Handled in revealCell for skull type
      },

      freeTeammate: (targetId: string) => {
        const state = get();
        if (state.interactionState !== 'picking_teammate_free') return;

        const newPlayers = state.players.map(p =>
          p.id === targetId
            ? { ...p, status: 'active' as const }
            : p
        );

        const target = state.players.find(p => p.id === targetId);
        const newLog = addLog(state, state.currentTeam, target?.name || '', 'تم تحريره!', 'key');

        set({
          players: newPlayers,
          interactionState: 'showing_result',
          selectedTargetId: targetId,
          gameLog: [...state.gameLog, newLog],
          logCounter: state.logCounter + 1,
        });

        syncToRoom(get(), {
          players: newPlayers,
          interactionState: 'showing_result',
          selectedTargetId: targetId,
        });
      },

      skipTurn: () => {
        // Handled in revealCell for skip type
      },

      advanceTurn: () => {
        const state = get();
        if (state.interactionState !== 'showing_result') return;

        // First check if game should end (winner was set during reveal/imprison)
        if (state.winner !== null) {
          set({
            phase: 'game_over',
            interactionState: 'game_over',
            revealedCell: null,
            currentPlayerId: null,
          });
          syncToRoom(get(), {
            phase: 'game_over',
            interactionState: 'game_over',
          });
          return;
        }

        // Check game end condition
        const gameEndCheck = checkGameEnd(state.players, state.grid);
        if (gameEndCheck.ended) {
          set({
            phase: 'game_over',
            winner: gameEndCheck.winner,
            winReason: gameEndCheck.reason,
            interactionState: 'game_over',
            revealedCell: null,
            currentPlayerId: null,
          });
          syncToRoom(get(), {
            phase: 'game_over',
            winner: gameEndCheck.winner,
            winReason: gameEndCheck.reason,
            interactionState: 'game_over',
          });
          return;
        }

        const opponentTeam: PrisonTeam = state.currentTeam === 'alpha' ? 'beta' : 'alpha';

        // Check if there are active players on the next team
        const nextTeamActive = state.players.some(p => p.team === opponentTeam && p.status === 'active');

        let nextTeam = opponentTeam;
        if (!nextTeamActive) {
          // Opponent team has no active players, current team continues
          nextTeam = state.currentTeam;
        }

        // Final check: if next team also has no active players (shouldn't happen due to checkGameEnd above)
        if (!state.players.some(p => p.team === nextTeam && p.status === 'active')) {
          set({
            phase: 'game_over',
            winner: 'draw',
            winReason: 'لا يوجد لاعبون نشطون في الفريقين!',
            interactionState: 'game_over',
            revealedCell: null,
            currentPlayerId: null,
          });
          syncToRoom(get(), {
            phase: 'game_over',
            interactionState: 'game_over',
          });
          return;
        }

        set({
          currentTeam: nextTeam,
          currentPlayerId: null,
          revealedCell: null,
          selectedTargetId: null,
          interactionState: 'waiting_for_player',
        });

        syncToRoom(get(), {
          currentTeam: nextTeam,
          currentPlayerId: null,
          revealedCell: null,
          selectedTargetId: null,
          interactionState: 'waiting_for_player',
        });
      },

      closeModal: () => {
        const state = get();

        // If game should end (from skull execution)
        if (state.winner !== null) {
          set({
            phase: 'game_over',
            interactionState: 'game_over',
            revealedCell: null,
            currentPlayerId: null,
          });
          syncToRoom(get(), {
            phase: 'game_over',
            interactionState: 'game_over',
          });
        } else {
          set({ revealedCell: null, selectedTargetId: null });
          syncToRoom(get(), { revealedCell: null, selectedTargetId: null });
        }
      },

      resetGame: () => {
        const state = get();
        if (state.gameMode === 'diwaniya' && state.roomCode) {
          fetch(`/api/prison-room/${state.roomCode}`, { method: 'DELETE' }).catch(() => {});
        }
        set({
          ...initialState,
          grid: [],
          gameLog: [],
          players: [],
          logCounter: 0,
          revealedCell: null,
          currentPlayerId: null,
          selectedTargetId: null,
        });
      },
    }),
    {
      name: 'prison-game-storage',
      version: 1,
      migrate: () => ({
        ...initialState,
        grid: [],
        gameLog: [],
        players: [],
        logCounter: 0,
        revealedCell: null,
        currentPlayerId: null,
        selectedTargetId: null,
        gameMode: 'classic',
        roomCode: null,
        hostName: null,
      }),
      partialize: (state) => ({
        phase: state.phase,
        gameMode: state.gameMode,
        roomCode: state.roomCode,
        hostName: state.hostName,
        alphaName: state.alphaName,
        betaName: state.betaName,
        currentTeam: state.currentTeam,
        players: state.players,
        currentPlayerId: state.currentPlayerId,
        gridSize: state.gridSize,
        grid: state.grid,
        interactionState: state.interactionState,
        revealedCell: state.revealedCell,
        selectedTargetId: state.selectedTargetId,
        gameLog: state.gameLog,
        logCounter: state.logCounter,
        winner: state.winner,
        winReason: state.winReason,
      }),
    }
  )
);

// ============================================================
// Room sync helper
// ============================================================
function syncToRoom(state: PrisonState, updates: Record<string, unknown>) {
  if (state.gameMode !== 'diwaniya' || !state.roomCode) return;
  fetch(`/api/prison-room/${state.roomCode}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...updates,
      alphaName: state.alphaName,
      betaName: state.betaName,
      currentTeam: state.currentTeam,
      players: state.players,
      gridSize: state.gridSize,
      grid: state.grid,
      gameLog: state.gameLog,
      winner: state.winner,
      winReason: state.winReason,
    }),
  }).catch(() => {});
}
