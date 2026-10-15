// ============================================================
// بحر و حرب (BaharHarb) - Zustand Store
// Yalla Ludo style: shares phase/gameMode/roomCode with page.tsx wrapper
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { allBaharHarbQuestions, BaharHarbQuestion } from './baharharb-questions';

export type GameMode = 'classic' | 'diwaniya';

export type GamePhase = 'landing' | 'setup' | 'playing' | 'game_over';
export type PlayMode = 'teams' | 'individuals';

// ============================================================
// Question deduplication (localStorage)
// ============================================================
function getUsedQuestionIds(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem('baharharb-used-questions');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function markQuestionsAsUsed(ids: number[]) {
  const used = getUsedQuestionIds();
  ids.forEach((id) => used.add(id));
  const arr = Array.from(used).slice(-500);
  try {
    localStorage.setItem('baharharb-used-questions', JSON.stringify(arr));
  } catch {}
}

export function selectRandomQuestions(count: number): BaharHarbQuestion[] {
  const usedIds = getUsedQuestionIds();
  const available = allBaharHarbQuestions.filter((q) => !usedIds.has(q.id));

  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  if (selected.length < count) {
    const allShuffled = [...allBaharHarbQuestions].sort(() => Math.random() - 0.5);
    for (let i = 0; i < allShuffled.length && selected.length < count; i++) {
      if (!selected.find((s) => s.id === allShuffled[i].id)) {
        selected.push(allShuffled[i]);
      }
    }
  }

  markQuestionsAsUsed(selected.map((q) => q.id));
  return selected;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ============================================================
// State interface
// ============================================================
interface BaharHarbState {
  // Game phase (Yalla Ludo style)
  phase: GamePhase;
  gameMode: GameMode;
  roomCode: string | null;
  hostName: string | null;

  // Game settings (BaharHarb specific)
  playMode: PlayMode;
  team1Name: string;
  team2Name: string;
  totalQuestions: number;
  currentQuestionIndex: number;
  questions: BaharHarbQuestion[];
  team1Score: number;
  team2Score: number;

  // Reveal flags per current question
  showClue1: boolean;
  showClue2: boolean;
  showAnswer1: boolean;
  showAnswer2: boolean;

  // Battle log (for spectators + game over stats)
  battleLog: { id: number; team: 1 | 2; message: string }[];
  logCounter: number;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setGameMode: (mode: GameMode) => void;
  setRoomCode: (code: string | null) => void;
  setHostName: (name: string | null) => void;
  setTeamNames: (t1: string, t2: string) => void;
  setPlayMode: (mode: PlayMode) => void;
  setTotalQuestions: (n: number) => void;
  startGame: (t1: string, t2: string, mode: PlayMode, count: number) => void;
  revealClue1: () => void;
  revealClue2: () => void;
  revealAnswer1: () => void;
  revealAnswer2: () => void;
  awardTeam1: () => void;
  awardTeam2: () => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  goToGameOver: () => void;
  resetGame: () => void;
  resetReveals: () => void;
}

const initialState = {
  phase: 'landing' as GamePhase,
  gameMode: 'classic' as GameMode,
  roomCode: null as string | null,
  hostName: null as string | null,
  playMode: 'teams' as PlayMode,
  team1Name: 'الفريق الأول',
  team2Name: 'الفريق الثاني',
  totalQuestions: 10,
  currentQuestionIndex: 0,
  questions: [] as BaharHarbQuestion[],
  team1Score: 0,
  team2Score: 0,
  showClue1: false,
  showClue2: false,
  showAnswer1: false,
  showAnswer2: false,
  battleLog: [] as { id: number; team: 1 | 2; message: string }[],
  logCounter: 0,
};

export const useBaharHarbStore = create<BaharHarbState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPhase: (phase) => set({ phase }),

      setGameMode: (gameMode) => set({ gameMode }),

      setRoomCode: (roomCode) => set({ roomCode }),

      setHostName: (hostName) => set({ hostName }),

      setTeamNames: (team1Name, team2Name) => set({ team1Name, team2Name }),

      setPlayMode: (playMode) => set({ playMode }),

      setTotalQuestions: (totalQuestions) => set({ totalQuestions }),

      startGame: (t1, t2, mode, count) => {
        const questions = selectRandomQuestions(count);
        const state = get();

        // Diwaniya: create room
        if (state.gameMode === 'diwaniya') {
          const code = generateRoomCode();
          fetch('/api/baharharb-room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, hostName: 'العراب' }),
          }).catch(() => {});
          set({
            phase: 'playing',
            playMode: mode,
            team1Name: t1,
            team2Name: t2,
            totalQuestions: count,
            currentQuestionIndex: 0,
            questions,
            team1Score: 0,
            team2Score: 0,
            showClue1: false,
            showClue2: false,
            showAnswer1: false,
            showAnswer2: false,
            battleLog: [],
            logCounter: 0,
            roomCode: code,
          });
        } else {
          set({
            phase: 'playing',
            playMode: mode,
            team1Name: t1,
            team2Name: t2,
            totalQuestions: count,
            currentQuestionIndex: 0,
            questions,
            team1Score: 0,
            team2Score: 0,
            showClue1: false,
            showClue2: false,
            showAnswer1: false,
            showAnswer2: false,
            battleLog: [],
            logCounter: 0,
          });
        }
      },

      revealClue1: () => set({ showClue1: true }),
      revealClue2: () => set({ showClue2: true }),
      revealAnswer1: () => set({ showAnswer1: true }),
      revealAnswer2: () => set({ showAnswer2: true }),

      awardTeam1: () => {
        const s = get();
        const log = [
          ...s.battleLog,
          {
            id: s.logCounter + 1,
            team: 1 as const,
            message: `${s.team1Name} أجاب بشكل صحيح`,
          },
        ];
        set({ team1Score: s.team1Score + 1, logCounter: s.logCounter + 1, battleLog: log });
        // Sync room
        if (s.gameMode === 'diwaniya' && s.roomCode) {
          fetch(`/api/baharharb-room/${s.roomCode}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ team1Score: s.team1Score + 1, battleLog: log }),
          }).catch(() => {});
        }
      },

      awardTeam2: () => {
        const s = get();
        const log = [
          ...s.battleLog,
          {
            id: s.logCounter + 1,
            team: 2 as const,
            message: `${s.team2Name} أجاب بشكل صحيح`,
          },
        ];
        set({ team2Score: s.team2Score + 1, logCounter: s.logCounter + 1, battleLog: log });
        if (s.gameMode === 'diwaniya' && s.roomCode) {
          fetch(`/api/baharharb-room/${s.roomCode}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ team2Score: s.team2Score + 1, battleLog: log }),
          }).catch(() => {});
        }
      },

      resetReveals: () =>
        set({ showClue1: false, showClue2: false, showAnswer1: false, showAnswer2: false }),

      nextQuestion: () => {
        const s = get();
        if (s.currentQuestionIndex >= s.totalQuestions - 1) {
          set({ phase: 'game_over' });
          // Broadcast game over
          if (s.gameMode === 'diwaniya' && s.roomCode) {
            fetch(`/api/baharharb-room/${s.roomCode}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phase: 'game_over',
                team1Score: s.team1Score,
                team2Score: s.team2Score,
              }),
            }).catch(() => {});
          }
        } else {
          set({
            currentQuestionIndex: s.currentQuestionIndex + 1,
            showClue1: false,
            showClue2: false,
            showAnswer1: false,
            showAnswer2: false,
          });
          // Sync room
          if (s.gameMode === 'diwaniya' && s.roomCode) {
            fetch(`/api/baharharb-room/${s.roomCode}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ currentQuestionIndex: s.currentQuestionIndex + 1 }),
            }).catch(() => {});
          }
        }
      },

      prevQuestion: () => {
        const s = get();
        if (s.currentQuestionIndex > 0) {
          set({
            currentQuestionIndex: s.currentQuestionIndex - 1,
            showClue1: false,
            showClue2: false,
            showAnswer1: false,
            showAnswer2: false,
          });
        }
      },

      goToGameOver: () => {
        const s = get();
        set({ phase: 'game_over' });
        if (s.gameMode === 'diwaniya' && s.roomCode) {
          fetch(`/api/baharharb-room/${s.roomCode}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phase: 'game_over',
              team1Score: s.team1Score,
              team2Score: s.team2Score,
            }),
          }).catch(() => {});
        }
      },

      resetGame: () => {
        const s = get();
        if (s.gameMode === 'diwaniya' && s.roomCode) {
          fetch(`/api/baharharb-room/${s.roomCode}`, { method: 'DELETE' }).catch(() => {});
        }
        set({
          ...initialState,
          questions: [],
          battleLog: [],
          logCounter: 0,
          showClue1: false,
          showClue2: false,
          showAnswer1: false,
          showAnswer2: false,
        });
      },
    }),
    {
      name: 'baharharb-game-storage',
      version: 2,
      migrate: ((state: unknown, version: number): BaharHarbState => {
        void state; void version;
        // Strip everything except state — actions are re-attached by zustand merge
        const { setPhase, setGameMode, setRoomCode, setHostName, setTeamNames, setPlayMode, setTotalQuestions, startGame, revealClue1, revealClue2, revealAnswer1, revealAnswer2, awardTeam1, awardTeam2, nextQuestion, prevQuestion, goToGameOver, resetGame, resetReveals, ...rest } = initialState as any;
        void setPhase; void setGameMode; void setRoomCode; void setHostName; void setTeamNames; void setPlayMode; void setTotalQuestions; void startGame; void revealClue1; void revealClue2; void revealAnswer1; void revealAnswer2; void awardTeam1; void awardTeam2; void nextQuestion; void prevQuestion; void goToGameOver; void resetGame; void resetReveals;
        return {
          ...rest,
          questions: [],
          battleLog: [],
          logCounter: 0,
          showClue1: false,
          showClue2: false,
          showAnswer1: false,
          showAnswer2: false,
          gameMode: 'classic' as GameMode,
          roomCode: null,
          hostName: null,
        } as unknown as BaharHarbState;
      }) as (state: unknown, version: number) => BaharHarbState,
      partialize: (state) => ({
        phase: state.phase,
        gameMode: state.gameMode,
        roomCode: state.roomCode,
        hostName: state.hostName,
        playMode: state.playMode,
        team1Name: state.team1Name,
        team2Name: state.team2Name,
        totalQuestions: state.totalQuestions,
        currentQuestionIndex: state.currentQuestionIndex,
        questions: state.questions,
        team1Score: state.team1Score,
        team2Score: state.team2Score,
        showClue1: state.showClue1,
        showClue2: state.showClue2,
        showAnswer1: state.showAnswer1,
        showAnswer2: state.showAnswer2,
        battleLog: state.battleLog,
        logCounter: state.logCounter,
      }),
    }
  )
);
