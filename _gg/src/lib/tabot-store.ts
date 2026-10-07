// ════════════════════════════════════════════════════════════════
// TABOT GAME — STATE MANAGEMENT (v3.1 — Room Sync for Diwaniya)
// Zustand Store with Persist
// ════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Player,
  Door,
  GamePhase,
  TabotTeam,
  InteractionState,
  GameLogEntry,
  createDoors,
  createPlayer,
  checkGameOver,
  getOpposingTeam,
  hasImprisonedPlayers,
  getActiveMembers,
  OUTCOME_CONFIG,
} from './tabot-types';
import { syncTabotRoomState, endRoomSession } from './room-sync';

// ── Store Interface ────────────────────────────────────────────

export interface TabotStore {
  // Phase
  phase: GamePhase;

  // Teams
  teamAlphaName: string;
  teamBetaName: string;

  // Players
  players: Player[];
  currentPlayerIndex: number;
  currentTeam: TabotTeam;

  // Doors
  doors: Door[];
  lastRevealedDoor: Door | null;

  // Interaction
  interactionState: InteractionState;
  votingForTeam: TabotTeam | null;
  teamVotes: Record<string, string | null>;

  // Rounds & Log
  currentRound: number;
  roundLog: GameLogEntry[];
  winner: TabotTeam | 'draw' | null;
  winReason: string;

  // Diwaniya mode
  gameMode: 'local' | 'diwaniya' | null;
  roomCode: string | null;

  // ── Actions ──────────────────────────────────────────────────
  setPhase: (phase: GamePhase) => void;
  setupTeams: (
    alphaName: string,
    betaName: string,
    alphaPlayers: { name: string; role: string }[],
    betaPlayers: { name: string; role: string }[],
    firstTeam: TabotTeam
  ) => void;
  selectPicker: (playerId: string) => void;
  revealDoor: (doorId: number) => void;
  imprisonPlayer: (targetId: string) => void;
  killPlayer: (targetId: string) => void;
  freePlayer: (targetId: string) => void;
  castVote: (voterId: string, targetId: string) => void;
  skipInteraction: () => void;
  advanceTurn: () => void;
  resetGame: () => void;

  // Diwaniya actions
  setGameMode: (mode: 'local' | 'diwaniya' | null) => void;
  setRoomCode: (code: string | null) => void;
  syncToRoom: () => void;
}

// ── Initial State ──────────────────────────────────────────────

const initialState = {
  phase: 'landing' as GamePhase,
  teamAlphaName: '',
  teamBetaName: '',
  players: [] as Player[],
  currentPlayerIndex: -1,
  currentTeam: 'alpha' as TabotTeam,
  doors: [] as Door[],
  lastRevealedDoor: null as Door | null,
  interactionState: 'none' as InteractionState,
  votingForTeam: null as TabotTeam | null,
  teamVotes: {} as Record<string, string | null>,
  currentRound: 1,
  roundLog: [] as GameLogEntry[],
  winner: null as TabotTeam | 'draw' | null,
  winReason: '',
  gameMode: null as 'local' | 'diwaniya' | null,
  roomCode: null as string | null,
};

// ── Helpers ────────────────────────────────────────────────────

function makeLog(round: number, message: string, type: GameLogEntry['type'] = 'info'): GameLogEntry {
  return { round, message, timestamp: Date.now(), type };
}

// ── Store ──────────────────────────────────────────────────────

export const useTabotStore = create<TabotStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPhase: (phase) => {
        set({ phase });
        get().syncToRoom();
      },

      setGameMode: (mode) => set({ gameMode: mode }),
      setRoomCode: (code) => set({ roomCode: code }),

      syncToRoom: () => {
        const state = get();
        if (!state.roomCode) return;

        const syncData = {
          phase: state.phase,
          round: state.currentRound,
          stateJson: JSON.stringify({
            teamAlphaName: state.teamAlphaName,
            teamBetaName: state.teamBetaName,
            players: state.players,
            doors: state.doors,
            currentPlayerIndex: state.currentPlayerIndex,
            currentTeam: state.currentTeam,
            lastRevealedDoor: state.lastRevealedDoor,
            interactionState: state.interactionState,
            votingForTeam: state.votingForTeam,
            teamVotes: state.teamVotes,
            currentRound: state.currentRound,
            roundLog: state.roundLog,
            winner: state.winner,
            winReason: state.winReason,
          }),
        };

        syncTabotRoomState(state.roomCode, syncData);
      },

      setupTeams: (alphaName, betaName, alphaPlayers, betaPlayers, firstTeam) => {
        const alpha: Player[] = alphaPlayers.map((p, i) =>
          createPlayer(p.name, 'alpha', i, p.role as Player['role'])
        );
        const beta: Player[] = betaPlayers.map((p, i) =>
          createPlayer(p.name, 'beta', i + alphaPlayers.length, p.role as Player['role'])
        );

        const aName = alphaName || 'فريق الرعب';
        const bName = betaName || 'فريق الظلام';
        const startTeamName = firstTeam === 'alpha' ? aName : bName;

        set({
          phase: 'playing',
          teamAlphaName: aName,
          teamBetaName: bName,
          players: [...alpha, ...beta],
          currentPlayerIndex: -1,
          currentTeam: firstTeam,
          doors: createDoors(),
          lastRevealedDoor: null,
          interactionState: 'waiting_for_leader',
          votingForTeam: null,
          teamVotes: {},
          currentRound: 1,
          winner: null,
          winReason: '',
          roundLog: [
            makeLog(1, `⚰️ بدأت اللعبة! "${aName}" ضد "${bName}"`, 'system'),
            makeLog(1, `🎯 الفريق البادئ: "${startTeamName}" — القائد يختار من يفتح الباب... 👑`, 'action'),
          ],
        });
        get().syncToRoom();
      },

      selectPicker: (playerId: string) => {
        const state = get();
        const idx = state.players.findIndex(p => p.id === playerId);
        if (idx === -1) return;

        const player = state.players[idx];
        set({
          currentPlayerIndex: idx,
          interactionState: 'waiting_for_player',
          roundLog: [
            ...state.roundLog,
            makeLog(state.currentRound, `🎯 تم اختيار ${player.name} لفتح الباب`, 'action'),
          ],
        });
        get().syncToRoom();
      },

      revealDoor: (doorId: number) => {
        const state = get();
        const door = state.doors.find(d => d.id === doorId);
        if (!door || door.isRevealed) return;

        const player = state.players[state.currentPlayerIndex];
        if (!player || player.status !== 'active' || player.role === 'guest') return;

        const config = OUTCOME_CONFIG[door.outcome];
        const round = state.currentRound;

        // Update door
        const updatedDoors = state.doors.map(d =>
          d.id === doorId ? { ...d, isRevealed: true, revealedBy: player.id } : d
        );

        let updatedPlayers = [...state.players];
        let description = '';
        let interactionState: InteractionState = 'showing_result';
        let votingForTeam: TabotTeam | null = null;
        let teamVotes: Record<string, string | null> = {};

        switch (door.outcome) {
          case 'empty':
            description = `${player.name} فتح تابوت فارغ... آمن!`;
            break;
          case 'safe_passage':
            description = `${player.name} مر بممر آمن!`;
            break;
          case 'imprison_enemy': {
            const enemy = getOpposingTeam(player.team);
            if (getActiveMembers(updatedPlayers, enemy).length > 0) {
              interactionState = 'picking_enemy_imprison';
              description = `${player.name} يجب أن يحبس لاعب خصم!`;
            } else {
              description = `لكن لا يوجد خصم نشط ليُحبس!`;
              interactionState = 'showing_result';
            }
            break;
          }
          case 'imprison_teammate': {
            const teammates = getActiveMembers(updatedPlayers, player.team).filter(p => p.id !== player.id);
            if (teammates.length > 0) {
              interactionState = 'voting_teammate_imprison';
              votingForTeam = player.team;
              const voters = updatedPlayers.filter(p => p.team === player.team && p.status === 'active' && p.role !== 'guest');
              const votes: Record<string, string | null> = {};
              voters.forEach(p => { votes[p.id] = null; });
              teamVotes = votes;
              description = `فريق ${player.team === 'alpha' ? state.teamAlphaName : state.teamBetaName} يصوّت لاختيار من يحبس!`;
            } else {
              description = `لا يوجد أعضاء في الفريق ليُحبسوا!`;
            }
            break;
          }
          case 'free_teammate': {
            if (hasImprisonedPlayers(updatedPlayers, player.team)) {
              interactionState = 'picking_teammate_free';
              description = `${player.name} يختار زميلاً محبوساً ليحرره!`;
            } else {
              description = `لكن لا يوجد زميل محبوس!`;
            }
            break;
          }
          case 'self_imprison':
            updatedPlayers = updatedPlayers.map(p =>
              p.id === player.id ? { ...p, status: 'imprisoned' as const } : p
            );
            description = `🔒 ${player.name} سقط في فخ التابوت!`;
            break;
          case 'kill_player':
            updatedPlayers = updatedPlayers.map(p =>
              p.id === player.id ? { ...p, status: 'killed' as const } : p
            );
            description = `💀 ${player.name} قُتل!`;
            break;
          case 'kill_enemy': {
            const enemy = getOpposingTeam(player.team);
            if (getActiveMembers(updatedPlayers, enemy).length > 0) {
              interactionState = 'picking_enemy_kill';
              description = `${player.name} يختار خصماً ليقتله!`;
            } else {
              description = `لكن لا يوجد خصم نشط ليُقتل!`;
            }
            break;
          }
          case 'kill_self':
            updatedPlayers = updatedPlayers.map(p =>
              p.id === player.id ? { ...p, status: 'killed' as const } : p
            );
            description = `🎭 ${player.name} انتحر!`;
            break;
        }

        const logType = config.type === 'safe' ? 'success' : config.type === 'attack' ? 'danger' : 'action';

        // Always show the result — never skip to game_over immediately
        set({
          doors: updatedDoors,
          players: updatedPlayers,
          lastRevealedDoor: updatedDoors.find(d => d.id === doorId)!,
          interactionState: interactionState,
          votingForTeam,
          teamVotes,
          roundLog: [
            ...state.roundLog,
            makeLog(round, `${config.emoji} ${description}`, logType),
          ],
        });
        get().syncToRoom();
      },

      imprisonPlayer: (targetId: string) => {
        const state = get();
        const player = state.players[state.currentPlayerIndex];
        const updated = state.players.map(p =>
          p.id === targetId ? { ...p, status: 'imprisoned' as const } : p
        );
        const target = updated.find(p => p.id === targetId)!;

        set({
          players: updated,
          interactionState: 'showing_result',
          roundLog: [
            ...state.roundLog,
            makeLog(state.currentRound, `⛓️ ${player.name} حبس ${target.name}!`, 'danger'),
          ],
        });
        get().syncToRoom();
      },

      killPlayer: (targetId: string) => {
        const state = get();
        const player = state.players[state.currentPlayerIndex];
        const updated = state.players.map(p =>
          p.id === targetId ? { ...p, status: 'killed' as const } : p
        );
        const target = updated.find(p => p.id === targetId)!;

        set({
          players: updated,
          interactionState: 'showing_result',
          roundLog: [
            ...state.roundLog,
            makeLog(state.currentRound, `☠️ ${player.name} قتل ${target.name}!`, 'danger'),
          ],
        });
        get().syncToRoom();
      },

      freePlayer: (targetId: string) => {
        const state = get();
        const player = state.players[state.currentPlayerIndex];
        const updated = state.players.map(p =>
          p.id === targetId ? { ...p, status: 'active' as const } : p
        );
        const target = updated.find(p => p.id === targetId)!;

        set({
          players: updated,
          interactionState: 'showing_result',
          roundLog: [
            ...state.roundLog,
            makeLog(state.currentRound, `🔑 ${player.name} حرر ${target.name}!`, 'success'),
          ],
        });
        get().syncToRoom();
      },

      castVote: (voterId, targetId) => {
        const state = get();
        const newVotes = { ...state.teamVotes, [voterId]: targetId };

        const allVoted = Object.values(newVotes).every(v => v !== null);
        if (!allVoted) {
          set({ teamVotes: newVotes });
          get().syncToRoom();
          return;
        }

        // Tally
        const counts: Record<string, number> = {};
        Object.values(newVotes).forEach(id => {
          if (id) counts[id] = (counts[id] || 0) + 1;
        });

        let maxVotes = 0;
        let imprisonedId = '';
        Object.entries(counts).forEach(([id, count]) => {
          if (count > maxVotes) { maxVotes = count; imprisonedId = id; }
        });

        const updated = state.players.map(p =>
          p.id === imprisonedId ? { ...p, status: 'imprisoned' as const } : p
        );
        const imprisoned = updated.find(p => p.id === imprisonedId)!;
        const teamName = state.votingForTeam === 'alpha' ? state.teamAlphaName : state.teamBetaName;

        set({
          players: updated,
          interactionState: 'showing_result',
          votingForTeam: null,
          teamVotes: {},
          roundLog: [
            ...state.roundLog,
            makeLog(state.currentRound, `🗡️ فريق "${teamName}" حبس ${imprisoned.name} (${maxVotes} أصوات)!`, 'danger'),
          ],
        });
        get().syncToRoom();
      },

      skipInteraction: () => {
        set({ interactionState: 'showing_result', votingForTeam: null, teamVotes: {} });
        get().syncToRoom();
      },

      advanceTurn: () => {
        const state = get();
        if (state.phase === 'game_over') return;

        // Recompute game state with latest players to check if game should end
        const allDoorsRevealed = state.doors.every(d => d.isRevealed);
        const { over, winner, reason } = checkGameOver(state.players);

        if (over || allDoorsRevealed) {
          const finalWinner = allDoorsRevealed && !over
            ? (getActiveMembers(state.players, 'alpha').length > getActiveMembers(state.players, 'beta').length ? 'alpha'
               : getActiveMembers(state.players, 'beta').length > getActiveMembers(state.players, 'alpha').length ? 'beta' : 'draw')
            : winner;
          const finalReason = allDoorsRevealed && !over ? 'انتهت جميع الأبواب!' : reason;

          set({
            phase: 'game_over' as GamePhase,
            winner: finalWinner,
            winReason: finalReason,
            roundLog: [
              ...state.roundLog,
              makeLog(state.currentRound, `🏆 انتهت اللعبة! ${finalReason}`, 'system'),
            ],
          });
          get().syncToRoom();
          return;
        }

        const nextTeam = getOpposingTeam(state.currentTeam);
        const nextRound = state.currentTeam === 'beta' ? state.currentRound + 1 : state.currentRound;

        // Check if next team has active players
        const nextActive = getActiveMembers(state.players, nextTeam);
        if (nextActive.length === 0) {
          // Stay on current team (game over handled above)
          const teamName = state.currentTeam === 'alpha' ? state.teamAlphaName : state.teamBetaName;
          set({
            currentPlayerIndex: -1,
            interactionState: 'waiting_for_leader',
            currentRound: nextRound,
            lastRevealedDoor: null,
            roundLog: [
              ...state.roundLog,
              makeLog(nextRound, `⏭️ لا يوجد لاعبون نشطون في الفريق الخصم — دور "${teamName}" مرة أخرى`, 'info'),
            ],
          });
          get().syncToRoom();
          return;
        }

        const teamName = nextTeam === 'alpha' ? state.teamAlphaName : state.teamBetaName;

        set({
          currentTeam: nextTeam,
          currentPlayerIndex: -1,
          interactionState: 'waiting_for_leader',
          currentRound: nextRound,
          lastRevealedDoor: null,
          roundLog: [
            ...state.roundLog,
            makeLog(nextRound, `🔄 دور فريق "${teamName}" — القائد يختار... 👑`, 'info'),
          ],
        });
        get().syncToRoom();
      },

      resetGame: () => {
        const state = get();
        // End room session if in diwaniya mode
        if (state.roomCode && state.gameMode === 'diwaniya') {
          endRoomSession(state.roomCode);
        }
        if (typeof window !== 'undefined') {
          localStorage.removeItem('tabot-game-storage');
        }
        set({ ...initialState });
      },
    }),
    {
      name: 'tabot-game-storage',
      version: 7,
      migrate: (persisted: unknown, version: number) => {
        if (version < 7) return { ...initialState } as TabotStore;
        return persisted as TabotStore;
      },
    }
  )
);
