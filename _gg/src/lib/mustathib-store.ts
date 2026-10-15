// ============================================================
// المستئذب (Mustathib) — Zustand Store with Persist
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Player,
  Role,
  Team,
  GamePhase,
  GameMode,
  NightAction,
  DayVote,
  GameLogEntry,
  ROLE_CONFIG,
  distributeRoles,
  checkWinCondition,
  makeLog,
} from './mustathib-types';

// ============================================================
// Night Sequence Order
// Owl, Crow/Werewolf, Fortune Teller, Doctor
// (Crow + Werewolf are both evil killers — we treat them together)
// ============================================================
const NIGHT_SEQUENCE: Role[] = ['crow', 'doctor', 'owl', 'fortuneTeller'];

// ============================================================
// State
// ============================================================
export interface MustathibState {
  // Phase
  phase: GamePhase;
  gameMode: GameMode;
  roomCode: string | null;
  hostName: string | null;

  // Players
  players: Player[];

  // Role reveal phase
  roleRevealIndex: number;

  // Night phase
  currentRound: number;
  nightActions: NightAction[];
  nightStep: number; // index into NIGHT_SEQUENCE
  lastNightDeathId: string | null; // player killed this past night (null = no death / saved)

  // Day phase
  dayVotes: DayVote[];

  // Game log
  gameLog: GameLogEntry[];

  // Winner
  winner: Team | null;
  lastAction: string | null;

  // Stats
  totalKills: number;
  totalSaves: number;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setGameMode: (mode: GameMode) => void;
  setRoomCode: (code: string | null) => void;
  setHostName: (name: string | null) => void;

  // Game flow
  setPlayers: (names: string[]) => void;
  assignRoles: () => void;
  advanceRoleReveal: () => void;
  startNight: () => void;

  submitNightAction: (actorId: string, targetId: string | null) => void;
  advanceNightStep: () => void;
  resolveNight: () => void;

  startDay: () => void;
  startVote: () => void;
  submitDayVote: (voterId: string, targetId: string) => void;
  resolveDayVote: () => void;

  resetGame: () => void;
  syncToRoom: () => void;
}

// ============================================================
// Initial state
// ============================================================
const initialState = {
  phase: 'landing' as GamePhase,
  gameMode: 'classic' as GameMode,
  roomCode: null as string | null,
  hostName: null as string | null,
  players: [] as Player[],
  roleRevealIndex: 0,
  currentRound: 0,
  nightActions: [] as NightAction[],
  nightStep: 0,
  lastNightDeathId: null as string | null,
  dayVotes: [] as DayVote[],
  gameLog: [] as GameLogEntry[],
  winner: null as Team | null,
  lastAction: null as string | null,
  totalKills: 0,
  totalSaves: 0,
};

// ============================================================
// Helpers
// ============================================================

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getActiveStep(nightStep: number): Role | null {
  return NIGHT_SEQUENCE[nightStep] || null;
}

function isStepComplete(state: MustathibState): boolean {
  const role = getActiveStep(state.nightStep);
  if (!role) return true;

  // Find all alive players with that role
  const actors = state.players.filter(
    p => p.isAlive && p.role === role
  );
  if (actors.length === 0) return true; // no one has that role → skip

  // All actors in that role must have submitted an action
  return actors.every(actor =>
    state.nightActions.some(a => a.actorId === actor.id)
  );
}

// ============================================================
// Store
// ============================================================
export const useMustathibStore = create<MustathibState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPhase: (phase) => {
        set({ phase });
        get().syncToRoom();
      },

      setGameMode: (gameMode) => set({ gameMode }),
      setRoomCode: (roomCode) => set({ roomCode }),
      setHostName: (hostName) => set({ hostName }),

      // ── Setup ──────────────────────────────────────────
      setPlayers: (names: string[]) => {
        const players: Player[] = names.map((name, i) => ({
          id: `p-${i + 1}`,
          name: name.trim(),
          role: 'villager', // assigned later
          isAlive: true,
        }));
        set({ players });
      },

      assignRoles: () => {
        const state = get();
        const count = state.players.length;
        if (count < 6) return;

        const roles = distributeRoles(count);
        const updatedPlayers = state.players.map((p, i) => ({
          ...p,
          role: roles[i],
          isAlive: true,
        }));

        set({
          phase: 'roleReveal',
          players: updatedPlayers,
          roleRevealIndex: 0,
          currentRound: 0,
          nightActions: [],
          nightStep: 0,
          lastNightDeathId: null,
          dayVotes: [],
          gameLog: [makeLog(0, `🌙 بدأت لعبة المستئذب! اللاعبون: ${count}`, 'system')],
          winner: null,
          totalKills: 0,
          totalSaves: 0,
        });
        get().syncToRoom();
      },

      // ── Role Reveal Phase ──────────────────────────────
      advanceRoleReveal: () => {
        const state = get();
        const next = state.roleRevealIndex + 1;
        if (next >= state.players.length) {
          // All revealed — start night
          set({
            roleRevealIndex: state.players.length,
            phase: 'night',
            currentRound: 1,
            nightStep: 0,
            nightActions: [],
            gameLog: [
              ...state.gameLog,
              makeLog(1, '🌙 يحل الليل — على الجميع النوم', 'system'),
            ],
          });
          get().syncToRoom();
        } else {
          set({ roleRevealIndex: next });
          get().syncToRoom();
        }
      },

      // ── Night Phase ────────────────────────────────────
      startNight: () => {
        const state = get();
        set({
          phase: 'night',
          nightStep: 0,
          nightActions: [],
          gameLog: [
            ...state.gameLog,
            makeLog(state.currentRound, `🌙 الليلة ${state.currentRound} — الكل نائم`, 'system'),
          ],
        });
        get().syncToRoom();
      },

      submitNightAction: (actorId, targetId) => {
        const state = get();
        const actor = state.players.find(p => p.id === actorId);
        if (!actor || !actor.isAlive) return;

        const actionType: NightAction['action'] =
          actor.role === 'crow' || actor.role === 'werewolf' ? 'kill' :
          actor.role === 'doctor' ? 'protect' :
          actor.role === 'owl' || actor.role === 'fortuneTeller' ? 'see' :
          'see';

        // Remove any prior action by this actor (in case they re-selected)
        const filtered = state.nightActions.filter(a => a.actorId !== actorId);
        const newAction: NightAction = {
          actorId,
          role: actor.role,
          targetId,
          action: actionType,
        };

        set({
          nightActions: [...filtered, newAction],
        });
        get().syncToRoom();
      },

      advanceNightStep: () => {
        const state = get();
        const next = state.nightStep + 1;
        if (next >= NIGHT_SEQUENCE.length) {
          // Night complete — resolve
          get().resolveNight();
        } else {
          set({ nightStep: next });
          get().syncToRoom();
        }
      },

      resolveNight: () => {
        const state = get();
        const round = state.currentRound;

        // 1. Find kill target (from crow + werewolf)
        const killActions = state.nightActions.filter(a =>
          a.action === 'kill' && a.targetId
        );
        // Pick most-voted kill target (tie-break: random first)
        const killTally: Record<string, number> = {};
        killActions.forEach(a => {
          if (a.targetId) killTally[a.targetId] = (killTally[a.targetId] || 0) + 1;
        });
        let killTargetId: string | null = null;
        let maxKills = 0;
        Object.entries(killTally).forEach(([id, count]) => {
          if (count > maxKills) {
            maxKills = count;
            killTargetId = id;
          }
        });

        // 2. Find protect target (from doctor)
        const protectActions = state.nightActions.filter(a =>
          a.action === 'protect' && a.targetId
        );
        const protectedIds = new Set(protectActions.map(a => a.targetId!));

        // 3. Resolve kill (if protected, no death)
        let newPlayers = [...state.players];
        let deathId: string | null = null;
        let saved = false;

        if (killTargetId) {
          if (protectedIds.has(killTargetId)) {
            saved = true;
          } else {
            newPlayers = newPlayers.map(p =>
              p.id === killTargetId ? { ...p, isAlive: false } : p
            );
            deathId = killTargetId;
          }
        }

        // 4. Build log entries (private to actors, summarized for everyone)
        const newLog = [...state.gameLog];

        if (deathId) {
          const dead = newPlayers.find(p => p.id === deathId);
          newLog.push(makeLog(round, `💀 ${dead?.name} وُجد ميتاً عند الفجر`, 'danger'));
        } else if (saved) {
          newLog.push(makeLog(round, `⚕️ نجح الطبيب في إنقاذ ضحية الليل`, 'success'));
        } else {
          newLog.push(makeLog(round, `🌙 ليلة هادئة — لا أحد مات`, 'info'));
        }

        // 5. Check win condition
        const winner = checkWinCondition(newPlayers);

        const newTotalKills = state.totalKills + (deathId ? 1 : 0);
        const newTotalSaves = state.totalSaves + (saved ? 1 : 0);

        set({
          players: newPlayers,
          lastNightDeathId: deathId,
          nightActions: [],
          nightStep: NIGHT_SEQUENCE.length,
          totalKills: newTotalKills,
          totalSaves: newTotalSaves,
          gameLog: newLog,
          lastAction: deathId
            ? `💀 ${newPlayers.find(p => p.id === deathId)?.name} مات`
            : saved ? '⚕️ نجح الطبيب في الإنقاذ' : '🌙 لا أحد مات',
        });

        if (winner) {
          set({ phase: 'game_over', winner, gameLog: [
            ...newLog,
            makeLog(round, `🏆 ${winner === 'good' ? 'فاز فريق الخير' : 'فاز فريق الشر'}`, 'system'),
          ]});
          get().syncToRoom();
        } else {
          // Transition to day
          set({ phase: 'day' });
          get().syncToRoom();
        }
      },

      // ── Day Phase ──────────────────────────────────────
      startDay: () => {
        const state = get();
        set({
          phase: 'day',
          gameLog: [...state.gameLog, makeLog(state.currentRound, '☀️ يحل النهار — استيقظوا', 'system')],
        });
        get().syncToRoom();
      },

      startVote: () => {
        const state = get();
        set({
          phase: 'vote',
          dayVotes: [],
          gameLog: [...state.gameLog, makeLog(state.currentRound, '🗳️ وقت التصويت — اختاروا المشتبه به', 'system')],
        });
        get().syncToRoom();
      },

      submitDayVote: (voterId, targetId) => {
        const state = get();
        const voter = state.players.find(p => p.id === voterId);
        if (!voter || !voter.isAlive) return;

        // Remove voter's previous vote, add new
        const filtered = state.dayVotes.filter(v => v.voterId !== voterId);
        const newVotes: DayVote[] = [...filtered, { voterId, targetId }];
        set({ dayVotes: newVotes });
        get().syncToRoom();
      },

      resolveDayVote: () => {
        const state = get();
        const round = state.currentRound;

        // Tally votes
        const counts: Record<string, number> = {};
        state.dayVotes.forEach(v => {
          counts[v.targetId] = (counts[v.targetId] || 0) + 1;
        });

        // Pick highest — tie-break random
        let maxVotes = 0;
        let lynchedId = '';
        const tied: string[] = [];
        Object.entries(counts).forEach(([id, count]) => {
          if (count > maxVotes) {
            maxVotes = count;
            lynchedId = id;
            tied.length = 0;
            tied.push(id);
          } else if (count === maxVotes) {
            tied.push(id);
          }
        });

        if (tied.length > 1) {
          // Random tie-break
          lynchedId = tied[Math.floor(Math.random() * tied.length)];
        }

        const newPlayers = state.players.map(p =>
          p.id === lynchedId ? { ...p, isAlive: false } : p
        );
        const lynched = newPlayers.find(p => p.id === lynchedId);
        const newLog = [...state.gameLog];
        if (lynched) {
          newLog.push(makeLog(round, `⚖️ تم إعدام ${lynched.name} بالتصويت (${maxVotes} أصوات)`, 'danger'));
        } else {
          newLog.push(makeLog(round, `⚖️ تعادل في الأصوات — لم يُعدم أحد`, 'info'));
        }

        // Check win
        const winner = checkWinCondition(newPlayers);

        if (winner) {
          set({
            players: newPlayers,
            dayVotes: [],
            phase: 'game_over',
            winner,
            gameLog: [
              ...newLog,
              makeLog(round, `🏆 ${winner === 'good' ? 'فاز فريق الخير' : 'فاز فريق الشر'}`, 'system'),
            ],
            lastAction: `🏆 ${winner === 'good' ? 'فاز الخير' : 'فاز الشر'}`,
          });
          get().syncToRoom();
        } else {
          // Back to night
          set({
            players: newPlayers,
            dayVotes: [],
            phase: 'night',
            currentRound: round + 1,
            nightStep: 0,
            nightActions: [],
            lastNightDeathId: null,
            gameLog: [
              ...newLog,
              makeLog(round + 1, `🌙 الليلة ${round + 1} — يحل الليل`, 'system'),
            ],
          });
          get().syncToRoom();
        }
      },

      resetGame: () => {
        const state = get();
        if (state.gameMode === 'diwaniya' && state.roomCode) {
          fetch(`/api/mustathib-room/${state.roomCode}`, { method: 'DELETE' }).catch(() => {});
        }
        set({
          ...initialState,
          players: [],
        });
      },

      syncToRoom: () => {
        const state = get();
        if (state.gameMode !== 'diwaniya' || !state.roomCode) return;

        const syncData = {
          phase: state.phase,
          round: state.currentRound,
          stateJson: JSON.stringify({
            players: state.players.map(p => ({
              id: p.id,
              name: p.name,
              role: p.role,
              isAlive: p.isAlive,
            })),
            roleRevealIndex: state.roleRevealIndex,
            nightActions: state.nightActions,
            nightStep: state.nightStep,
            lastNightDeathId: state.lastNightDeathId,
            dayVotes: state.dayVotes,
            gameLog: state.gameLog,
            winner: state.winner,
            lastAction: state.lastAction,
            totalKills: state.totalKills,
            totalSaves: state.totalSaves,
          }),
          gameWinner: state.winner,
        };

        fetch(`/api/mustathib-room/${state.roomCode}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syncData),
        }).catch(() => {});
      },
    }),
    {
      name: 'mustathib-game-storage',
      version: 1,
      partialize: (state) => ({
        phase: state.phase,
        gameMode: state.gameMode,
        roomCode: state.roomCode,
        hostName: state.hostName,
        players: state.players,
        roleRevealIndex: state.roleRevealIndex,
        currentRound: state.currentRound,
        nightActions: state.nightActions,
        nightStep: state.nightStep,
        lastNightDeathId: state.lastNightDeathId,
        dayVotes: state.dayVotes,
        gameLog: state.gameLog,
        winner: state.winner,
        lastAction: state.lastAction,
        totalKills: state.totalKills,
        totalSaves: state.totalSaves,
      }),
    }
  )
);

export { NIGHT_SEQUENCE };
