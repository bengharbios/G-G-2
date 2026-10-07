// ============================================================
// GAME STORE - Zustand State Management for Mafia Game
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Player,
  GamePhase,
  NightActions,
  Vote,
  EliminationEvent,
  GameLogEntry,
  RoleType,
} from './game-types';
import {
  createPlayersWithRoles,
  getDefaultNightActions,
  processNightActions,
  processVotes,
  checkWinCondition,
  getAliveMafia,
  getAlivePlayers,
} from './game-logic';
import { syncRoomState, endRoomSession } from './room-sync';
import { playBgMusic } from './sounds';

interface DayResults {
  killedByMafia: Player | null;
  killedBySniper: Player | null;
  sniperSelfKilled: Player | null;
  medicSaved: boolean;
  silencedPlayer: Player | null;
  voteEliminated: Player | null;
  voteEvent: EliminationEvent | null;
  voteResults: Record<string, number>;
}

export type GameMode = 'godfather' | 'diwaniya' | null;

export interface GameStore {
  // Game mode
  gameMode: GameMode;

  // Host info (for Diwaniya mode)
  hostName: string | null;

  // Game state
  players: Player[];
  phase: GamePhase;
  round: number;
  nightActions: NightActions;
  votes: Vote[];
  eliminatedPlayers: EliminationEvent[];
  revealedCards: Record<string, RoleType>;
  gameWinner: 'mafia' | 'citizen' | null;
  gameLog: GameLogEntry[];

  // UI state
  firstNightSkipped: boolean;
  currentMafiaViewIndex: number;
  currentDistributionIndex: number;
  showCard: boolean;
  selectedTarget: string | null;
  discussionTimeLeft: number;
  goodSonTarget: string | null;
  showRolesToHost: boolean;

  // Day results (stored after night processing)
  dayResults: DayResults | null;
  nightEvents: EliminationEvent[];
  nightLog: GameLogEntry[];

  // Actions
  startGame: (names: string[], customMafiaCount?: number) => void;
  setPhase: (phase: GamePhase) => void;
  markCardSeen: (playerId: string) => void;
  setDistributionIndex: (index: number) => void;
  setShowCard: (show: boolean) => void;
  setMafiaViewIndex: (index: number) => void;

  // Night actions
  setBossTarget: (targetId: string | null) => void;
  setSilencerTarget: (targetId: string | null) => void;
  setMedicTarget: (targetId: string | null) => void;
  setSniperTarget: (targetId: string | null) => void;
  setSniperShooting: (shooting: boolean) => void;
  processNight: () => void;

  // Day actions
  setSelectedTarget: (targetId: string | null) => void;
  castVote: (voterId: string, targetId: string | null) => void;
  mergeRemoteVotes: (remoteVotes: Vote[]) => void;
  processVoteResults: () => void;
  setGoodSonTarget: (targetId: string) => void;
  processGoodSonRevenge: () => void;
  revealMayor: (playerId: string) => void;
  setDiscussionTime: (time: number) => void;
  toggleRolesToHost: () => void;

  // Reset
  resetGame: () => void;

  // Game mode
  setGameMode: (mode: GameMode) => void;

  // Host name
  setHostName: (name: string | null) => void;

  // Room sync (Diwaniya mode)
  roomCode: string | null;
  setRoomCode: (code: string | null) => void;
  syncToRoom: () => void;

  // Computed helpers
  getAliveMafiaMembers: () => Player[];
  getAliveCitizenMembers: () => Player[];
}

const defaultDayResults: DayResults = {
  killedByMafia: null,
  killedBySniper: null,
  sniperSelfKilled: null,
  medicSaved: false,
  silencedPlayer: null,
  voteEliminated: null,
  voteEvent: null,
  voteResults: {},
};

const initialState = {
  gameMode: null as GameMode,
  hostName: null as string | null,
  players: [] as Player[],
  phase: 'setup' as GamePhase,
  round: 0,
  nightActions: getDefaultNightActions(),
  votes: [] as Vote[],
  eliminatedPlayers: [] as EliminationEvent[],
  revealedCards: {} as Record<string, RoleType>,
  gameWinner: null as 'mafia' | 'citizen' | null,
  gameLog: [] as GameLogEntry[],
  currentMafiaViewIndex: 0,
  currentDistributionIndex: 0,
  showCard: false,
  selectedTarget: null as string | null,
  discussionTimeLeft: 120,
  goodSonTarget: null as string | null,
  showRolesToHost: false,
  firstNightSkipped: false,
  dayResults: null as DayResults | null,
  nightEvents: [] as EliminationEvent[],
  nightLog: [] as GameLogEntry[],
  roomCode: null as string | null,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      startGame: (names: string[], customMafiaCount?: number) => {
        const players = createPlayersWithRoles(names, customMafiaCount);
        set({
          players,
          phase: 'card_distribution',
          round: 1,
          nightActions: getDefaultNightActions(),
          votes: [],
          eliminatedPlayers: [],
          revealedCards: {},
          gameWinner: null,
          gameLog: [
            {
              round: 1,
              phase: 'setup',
              message: 'بدأت اللعبة!',
              timestamp: Date.now(),
            },
          ],
          currentMafiaViewIndex: 0,
          currentDistributionIndex: 0,
          showCard: false,
          selectedTarget: null,
          discussionTimeLeft: 120,
          goodSonTarget: null,
          dayResults: null,
          nightEvents: [],
          nightLog: [],
        });
        get().syncToRoom();
        // Start background music when game begins
        playBgMusic();
      },

      setPhase: (phase) => {
        set((state) => {
          // First night: skip all role actions, go straight to day discussion
          if (phase === 'night_start' && !state.firstNightSkipped) {
            return { phase: 'day_discussion', firstNightSkipped: true, votes: [] };
          }

          // Increment round when starting a new night (after the first one)
          const isNewNight = phase === 'night_start' && state.round > 0 && state.phase !== 'night_start';
          const newRound = isNewNight ? state.round + 1 : state.round;

          // Reset night actions when starting a new night (fixes previous round choices persisting)
          const resetNightActions = phase === 'night_start' ? getDefaultNightActions() : state.nightActions;

          // Clear selectedTarget on ALL phase transitions (fixes previous target persisting)
          const resetSelectedTarget = null;

          // Clear votes when entering night_start or day_voting (fixes previous round votes leaking)
          const resetVotes = (phase === 'night_start' || phase === 'day_voting') ? [] : state.votes;

          // Clear previous round's vote results when starting announcements (so stale data doesn't show)
          const resetDayResults = (phase === 'day_announcements')
            ? { ...defaultDayResults, killedByMafia: null, killedBySniper: null, sniperSelfKilled: null, medicSaved: false, silencedPlayer: null, voteEliminated: null, voteEvent: null, voteResults: {} }
            : state.dayResults;

          return { phase, round: newRound, nightActions: resetNightActions, selectedTarget: resetSelectedTarget, votes: resetVotes, dayResults: resetDayResults };
        });
        // Sync phase change to server so players see it
        get().syncToRoom();
      },

      markCardSeen: (playerId) =>
        set((state) => ({
          players: state.players.map((p) =>
            p.id === playerId ? { ...p, hasSeenCard: true } : p
          ),
        })),

      setDistributionIndex: (index) => set({ currentDistributionIndex: index }),
      setShowCard: (show) => set({ showCard: show }),
      setMafiaViewIndex: (index) => set({ currentMafiaViewIndex: index }),

      setBossTarget: (targetId) =>
        set((state) => ({
          nightActions: { ...state.nightActions, bossTarget: targetId },
          selectedTarget: targetId,
        })),

      setSilencerTarget: (targetId) =>
        set((state) => ({
          nightActions: { ...state.nightActions, silencerTarget: targetId },
          selectedTarget: targetId,
        })),

      setMedicTarget: (targetId) =>
        set((state) => ({
          nightActions: { ...state.nightActions, medicTarget: targetId },
          selectedTarget: targetId,
        })),

      setSniperTarget: (targetId) =>
        set((state) => ({
          nightActions: { ...state.nightActions, sniperTarget: targetId },
          selectedTarget: targetId,
        })),

      setSniperShooting: (shooting) =>
        set((state) => ({
          nightActions: { ...state.nightActions, sniperShooting: shooting },
        })),

      processNight: () => {
        const state = get();
        const {
          updatedPlayers,
          events,
          log,
          medicSaved,
          sniperSelfKill,
        } = processNightActions(
          state.players,
          state.nightActions,
          state.round
        );

        const killedByMafia = updatedPlayers.find(
          (p) => p.eliminatedByMafia && !state.players.find((op) => op.id === p.id)?.eliminatedByMafia
        ) || null;

        const killedBySniper = events.find((e) => e.reason === 'sniper');
        const sniperSelfKilledPlayer = sniperSelfKill
          ? updatedPlayers.find((p) => p.role === 'sniper' && !p.isAlive)
          : null;

        const silencedPlayer = updatedPlayers.find((p) => p.isSilenced) || null;

        const newRevealedCards = { ...state.revealedCards };
        for (const event of events) {
          newRevealedCards[event.playerId] = event.role;
        }

        const winner = checkWinCondition(updatedPlayers);

        set({
          players: updatedPlayers,
          nightEvents: events,
          nightLog: log,
          eliminatedPlayers: [...state.eliminatedPlayers, ...events],
          revealedCards: newRevealedCards,
          gameLog: [...state.gameLog, ...log],
          dayResults: {
            ...defaultDayResults,
            killedByMafia: state.nightActions.bossTarget
              ? updatedPlayers.find((p) => p.id === state.nightActions.bossTarget && !p.isAlive) || null
              : null,
            killedBySniper: killedBySniper
              ? updatedPlayers.find((p) => p.id === killedBySniper.playerId) || null
              : null,
            sniperSelfKilled: sniperSelfKilledPlayer || null,
            medicSaved,
            silencedPlayer,
          },
          gameWinner: winner,
          phase: winner ? 'game_over' : 'day_announcements',
          selectedTarget: null,
        });
        get().syncToRoom();
      },

      setSelectedTarget: (targetId) => set({ selectedTarget: targetId }),

      castVote: (voterId, targetId) =>
        set((state) => {
          const existingVoteIndex = state.votes.findIndex(
            (v) => v.voterId === voterId
          );
          const newVotes = [...state.votes];
          if (existingVoteIndex >= 0) {
            newVotes[existingVoteIndex] = { voterId, targetId };
          } else {
            newVotes.push({ voterId, targetId });
          }
          return { votes: newVotes };
        }),

      mergeRemoteVotes: (remoteVotes) =>
        set((state) => {
          // Get voter IDs from remote votes
          const remoteVoterIds = new Set(remoteVotes.map((v) => v.voterId));
          // Keep local votes for players who haven't voted remotely
          const localOnlyVotes = state.votes.filter(
            (v) => !remoteVoterIds.has(v.voterId)
          );
          // Merge: remote votes take precedence, local-only votes preserved
          return { votes: [...localOnlyVotes, ...remoteVotes] };
        }),

      processVoteResults: () => {
        const state = get();
        const {
          eliminatedPlayer,
          updatedPlayers,
          event,
          log,
          voteResults,
        } = processVotes(state.players, state.votes, state.round);

        const newEliminated = event
          ? [...state.eliminatedPlayers, event]
          : state.eliminatedPlayers;
        const newRevealedCards = { ...state.revealedCards };
        if (event) {
          newRevealedCards[event.playerId] = event.role;
        }

        const winner = checkWinCondition(updatedPlayers);

        // Convert voteResults keys from player IDs to names (for player-side display)
        const namedVoteResults: Record<string, number> = {};
        for (const [playerId, count] of Object.entries(voteResults)) {
          const player = updatedPlayers.find((p) => p.id === playerId);
          if (player) {
            namedVoteResults[player.name] = count;
          } else {
            // Fallback: if player not found, try using the key as name directly,
            // or strip 'player-N' prefix if it's an auto-generated ID
            const fallbackName = playerId.replace(/^player-\d+$/, (match) => {
              const idx = parseInt(match.replace('player-', ''), 10);
              return updatedPlayers[idx]?.name || playerId;
            });
            namedVoteResults[fallbackName] = count;
          }
        }

        // If eliminated player is good_son and no winner yet, go to good_son_revenge
        if (event && event.role === 'good_son' && !winner) {
          set({
            players: updatedPlayers,
            votes: [],
            eliminatedPlayers: newEliminated,
            revealedCards: newRevealedCards,
            gameLog: [...state.gameLog, log],
            dayResults: {
              ...state.dayResults,
              voteEliminated: eliminatedPlayer,
              voteEvent: event,
              voteResults: namedVoteResults,
            },
            gameWinner: null,
            selectedTarget: null,
            phase: 'good_son_revenge',
          });
          get().syncToRoom();
          return;
        }

        set({
          players: updatedPlayers,
          votes: [],
          eliminatedPlayers: newEliminated,
          revealedCards: newRevealedCards,
          gameLog: [...state.gameLog, log],
          dayResults: {
            ...state.dayResults,
            voteEliminated: eliminatedPlayer,
            voteEvent: event,
            voteResults: namedVoteResults,
          },
          gameWinner: winner,
          selectedTarget: null,
        });
        get().syncToRoom();
      },

      setGoodSonTarget: (targetId) => set({ goodSonTarget: targetId }),

      processGoodSonRevenge: () => {
        const state = get();
        if (!state.goodSonTarget) return;

        const targetPlayer = state.players.find(
          (p) => p.id === state.goodSonTarget
        );
        if (!targetPlayer) return;

        const updatedPlayers = state.players.map((p) =>
          p.id === state.goodSonTarget ? { ...p, isAlive: false } : p
        );

        const event: EliminationEvent = {
          playerId: targetPlayer.id,
          playerName: targetPlayer.name,
          role: targetPlayer.role!,
          reason: 'good_son',
          round: state.round,
        };

        const newRevealedCards = {
          ...state.revealedCards,
          [event.playerId]: event.role,
        };

        const logEntry: GameLogEntry = {
          round: state.round,
          phase: 'day',
          message: `الولد الصالح أخرج ${targetPlayer.name} معه!`,
          timestamp: Date.now(),
        };

        const winner = checkWinCondition(updatedPlayers);

        set({
          players: updatedPlayers,
          eliminatedPlayers: [...state.eliminatedPlayers, event],
          revealedCards: newRevealedCards,
          gameLog: [...state.gameLog, logEntry],
          goodSonTarget: null,
          gameWinner: winner,
        });
        get().syncToRoom();
      },

      revealMayor: (playerId) =>
        set((state) => ({
          players: state.players.map((p) =>
            p.id === playerId ? { ...p, hasRevealedMayor: true } : p
          ),
        })),
      // Note: setPhase() always follows revealMayor and now auto-syncs

      setDiscussionTime: (time) => set({ discussionTimeLeft: time }),

  toggleRolesToHost: () => set((state) => ({ showRolesToHost: !state.showRolesToHost })),

      setGameMode: (mode) => set({ gameMode: mode }),
  setHostName: (name) => set({ hostName: name }),

      setRoomCode: (code) => set({ roomCode: code }),

      syncToRoom: () => {
        const state = get();
        if (!state.roomCode) return;
        const syncData = {
          players: state.players.map((p) => ({
            name: p.name,
            role: p.role,
            isAlive: p.isAlive,
            isSilenced: p.isSilenced,
            hasRevealedMayor: p.hasRevealedMayor,
          })),
          nightEvents: state.nightEvents,
          dayResults: state.dayResults,
          eliminatedPlayers: state.eliminatedPlayers,
          gameWinner: state.gameWinner,
          gameLog: state.gameLog,
        };
        syncRoomState(state.roomCode, {
          phase: state.phase,
          round: state.round,
          gameWinner: state.gameWinner,
          stateJson: JSON.stringify(syncData),
          players: state.players.map((p) => ({
            name: p.name,
            role: p.role,
            isAlive: p.isAlive,
            isSilenced: p.isSilenced,
            hasRevealedMayor: p.hasRevealedMayor,
          })),
        });
      },

      getAliveMafiaMembers: () => getAliveMafia(get().players),
      getAliveCitizenMembers: () => {
        const players = get().players;
        return getAlivePlayers(players).filter(
          (p) => p.role && p.role !== 'mafia_boss' && p.role !== 'mafia_silencer' && p.role !== 'mafia_regular'
        );
      },

      resetGame: () => {
        const state = get();
        // If in Diwaniya mode, end the room session on the server
        if (state.roomCode && state.gameMode === 'diwaniya') {
          endRoomSession(state.roomCode);
        }
        set({ ...initialState, roomCode: null, gameMode: null, hostName: null });
      },
    }),
    {
      name: 'mafia-game-storage',
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        // If migrating from an older version, reset to initial state
        // to avoid shape mismatches
        if (version < 1) {
          return { ...initialState } as GameStore;
        }
        return persisted as GameStore;
      },
    }
  )
);
