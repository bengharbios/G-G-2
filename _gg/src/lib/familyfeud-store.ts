// ============================================================
// فاميلي فيود (Family Feud) - Zustand Store
// Mirrors all useState + useCallback hooks from the original inline page
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ALL_QUESTIONS,
  FAST_MONEY_QUESTIONS,
  getQuestionDifficulty,
  type Answer,
  type Question,
} from './familyfeud-questions';

export type GameMode = 'classic' | 'diwaniya';

export type UiPhase = 'landing' | 'godfather_setup' | 'diwaniya_setup' | 'game';
export type GamePhase = 'faceoff' | 'gameboard' | 'steal' | 'fast_money' | 'game_over';
export type FmPhase = 'intro' | 'team1' | 'team2' | 'results';
export type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

export interface RoundHistoryEntry {
  round: number;
  team: 1 | 2;
  points: number;
  type: string;
}

export interface GameStats {
  team1Correct: number;
  team2Correct: number;
  team1Strikes: number;
  team2Strikes: number;
  totalSteals: number;
  successfulSteals: number;
  fastMoneyScore1: number;
  fastMoneyScore2: number;
}

export interface ScoreAnimationState {
  team: 1 | 2;
  points: number;
  visible: boolean;
}

export interface FeedbackState {
  show: boolean;
  correct: boolean;
  answer?: string;
}

export interface CelebrationState {
  show: boolean;
  teamName: string;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const USED_QUESTIONS_KEY = 'familyfeud_used_questions';
const USED_FM_QUESTIONS_KEY = 'familyfeud_used_fm_questions';

// ============================================================
// Store interface
// ============================================================
interface FamilyFeudState {
  // Phase + mode (Yalla Ludo style)
  uiPhase: UiPhase;
  gameMode: GameMode;
  roomCode: string | null;
  hostName: string | null;

  // Team info
  team1Name: string;
  team2Name: string;
  team1Emoji: string;
  team2Emoji: string;
  team1Score: number;
  team2Score: number;
  currentTeam: 1 | 2;
  strikes: number;
  round: number;
  totalRounds: number;
  stealTimerDuration: number;
  roundTimerDuration: number;
  gamePhase: GamePhase;

  // Score animation
  scoreAnimation: ScoreAnimationState;

  // Questions
  selectedQuestions: Question[];
  currentAnswers: Answer[];
  roundScore: number;

  // Fast money
  fmQuestions: Question[];
  fmAnswers1: string[];
  fmAnswers2: string[];
  fmRevealed1: boolean[];
  fmRevealed2: boolean[];
  fmScore1: number;
  fmScore2: number;
  timeLeft: number;
  timerRunning: boolean;
  fmPhase: FmPhase;
  fmSelected1: number[];
  fmSelected2: number[];
  showGameOver: boolean;

  // Regular round scores (before fast money)
  regularRoundScore1: number;
  regularRoundScore2: number;

  // Feedback
  feedback: FeedbackState;
  revealStreak: number;

  // Round result display
  showRoundResult: boolean;
  roundResultType: 'steal_success' | 'steal_fail' | 'round_complete';
  roundResultTeamName: string;
  roundResultPoints: number;

  // History
  roundHistory: RoundHistoryEntry[];

  // Stats
  gameStats: {
    team1Correct: number;
    team2Correct: number;
    team1Strikes: number;
    team2Strikes: number;
    totalSteals: number;
    successfulSteals: number;
    fastMoneyScore1: number;
    fastMoneyScore2: number;
  };

  // Round timer
  roundTimeLeft: number;
  roundTimerRunning: boolean;

  // Difficulty filter
  difficultyFilter: DifficultyFilter;

  // 300+ celebration
  celebration300: CelebrationState;

  // Hints
  hintsUsedThisRound: number;

  // ===== Actions =====
  setUiPhase: (phase: UiPhase) => void;
  setGameMode: (mode: GameMode) => void;
  setRoomCode: (code: string | null) => void;
  setHostName: (name: string | null) => void;
  setTeam1Name: (name: string) => void;
  setTeam2Name: (name: string) => void;
  setTeam1Emoji: (emoji: string) => void;
  setTeam2Emoji: (emoji: string) => void;
  setTotalRounds: (n: number) => void;
  setStealTimerDuration: (n: number) => void;
  setRoundTimerDuration: (n: number) => void;
  setDifficultyFilter: (f: DifficultyFilter) => void;

  initializeQuestions: () => void;
  handleStartGame: (settings: {
    team1Name: string;
    team2Name: string;
    team1Emoji: string;
    team2Emoji: string;
    totalRounds: number;
    stealTimer: number;
    roundTimer: number;
    difficultyFilter: DifficultyFilter;
  }) => void;

  handleFaceOffStart: (team: 1 | 2) => void;
  handleRevealAnswer: (index: number) => void;
  handleAddStrike: () => void;
  handlePassToOtherTeam: () => void;
  handleNextRound: () => void;
  handleAwardAndNextRound: () => void;
  handleSteal: () => void;
  handleNoSteal: () => void;
  handleRevealAll: () => void;
  handleUseHint: () => void;
  handleSkipQuestion: () => void;
  handleEndGame: () => void;
  handleReset: () => void;
  goToFastMoneyFromGameboard: () => void;

  setRoundTimeLeft: (n: number) => void;
  setRoundTimerRunning: (b: boolean) => void;
  tickRoundTimer: () => void;
  finishRoundTimerStrike: () => void;

  // Fast money
  handleStartTimer: () => void;
  handleSelectFM1: (qIdx: number, aIdx: number) => void;
  handleSelectFM2: (qIdx: number, aIdx: number) => void;
  handleRevealFM1: (idx: number) => void;
  handleRevealFM2: (idx: number) => void;
  handleInputFM1: (idx: number, v: string) => void;
  handleInputFM2: (idx: number, v: string) => void;
  setFmPhase: (p: FmPhase) => void;
  setFmScore1: (n: number) => void;
  setFmScore2: (n: number) => void;
  setTimeLeft: (n: number) => void;
  setTimerRunning: (b: boolean) => void;
  tickFastMoneyTimer: () => void;
  finishFastMoneyTimer: () => void;

  // UI state setters
  setFeedback: (f: FeedbackState) => void;
  setShowRoundResult: (b: boolean) => void;
  setRevealStreak: (n: number) => void;
  setHintsUsedThisRound: (n: number) => void;
  setShowGameOver: (b: boolean) => void;
  setCelebration300: (s: CelebrationState) => void;
  setScoreAnimation: (s: ScoreAnimationState) => void;

  // Save / clear
  clearSavedState: () => void;
}

const initialState = {
  uiPhase: 'landing' as UiPhase,
  gameMode: 'classic' as GameMode,
  roomCode: null as string | null,
  hostName: null as string | null,
  team1Name: 'فريق 1',
  team2Name: 'فريق 2',
  team1Emoji: '👑',
  team2Emoji: '🏛️',
  team1Score: 0,
  team2Score: 0,
  currentTeam: 1 as 1 | 2,
  strikes: 0,
  round: 1,
  totalRounds: 5,
  stealTimerDuration: 0,
  roundTimerDuration: 0,
  gamePhase: 'faceoff' as GamePhase,
  scoreAnimation: { team: 1 as const, points: 0, visible: false },
  selectedQuestions: [] as Question[],
  currentAnswers: [] as Answer[],
  roundScore: 0,
  fmQuestions: [] as Question[],
  fmAnswers1: [] as string[],
  fmAnswers2: [] as string[],
  fmRevealed1: [] as boolean[],
  fmRevealed2: [] as boolean[],
  fmScore1: 0,
  fmScore2: 0,
  timeLeft: 20,
  timerRunning: false,
  fmPhase: 'intro' as FmPhase,
  fmSelected1: [] as number[],
  fmSelected2: [] as number[],
  showGameOver: false,
  regularRoundScore1: 0,
  regularRoundScore2: 0,
  feedback: { show: false, correct: false } as FeedbackState,
  revealStreak: 0,
  showRoundResult: false,
  roundResultType: 'round_complete' as 'steal_success' | 'steal_fail' | 'round_complete',
  roundResultTeamName: '',
  roundResultPoints: 0,
  roundHistory: [] as RoundHistoryEntry[],
  gameStats: {
    team1Correct: 0,
    team2Correct: 0,
    team1Strikes: 0,
    team2Strikes: 0,
    totalSteals: 0,
    successfulSteals: 0,
    fastMoneyScore1: 0,
    fastMoneyScore2: 0,
  },
  roundTimeLeft: 0,
  roundTimerRunning: false,
  difficultyFilter: 'all' as DifficultyFilter,
  celebration300: { show: false, teamName: '' } as CelebrationState,
  hintsUsedThisRound: 0,
};

export const useFamilyFeudStore = create<FamilyFeudState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUiPhase: (uiPhase) => set({ uiPhase }),
      setGameMode: (gameMode) => set({ gameMode }),
      setRoomCode: (roomCode) => set({ roomCode }),
      setHostName: (hostName) => set({ hostName }),
      setTeam1Name: (team1Name) => set({ team1Name }),
      setTeam2Name: (team2Name) => set({ team2Name }),
      setTeam1Emoji: (team1Emoji) => set({ team1Emoji }),
      setTeam2Emoji: (team2Emoji) => set({ team2Emoji }),
      setTotalRounds: (totalRounds) => set({ totalRounds }),
      setStealTimerDuration: (stealTimerDuration) => set({ stealTimerDuration }),
      setRoundTimerDuration: (roundTimerDuration) => set({ roundTimerDuration }),
      setDifficultyFilter: (difficultyFilter) => set({ difficultyFilter }),

      initializeQuestions: () => {
        const state = get();
        const filtered = state.difficultyFilter === 'all'
          ? ALL_QUESTIONS
          : ALL_QUESTIONS.filter((q) => {
              const totalPts = q.answers.reduce((sum, a) => sum + a.points, 0);
              return getQuestionDifficulty(totalPts) === state.difficultyFilter;
            });
        const pool = filtered.length >= state.totalRounds ? filtered : ALL_QUESTIONS;

        let usedIndices: number[] = [];
        let usedFmIndices: number[] = [];
        try {
          usedIndices = JSON.parse(localStorage.getItem(USED_QUESTIONS_KEY) || '[]');
          usedFmIndices = JSON.parse(localStorage.getItem(USED_FM_QUESTIONS_KEY) || '[]');
        } catch {}

        let filteredPool = pool.filter((q) => {
          const idx = ALL_QUESTIONS.indexOf(q);
          return idx === -1 || !usedIndices.includes(idx);
        });
        if (filteredPool.length < state.totalRounds) {
          usedIndices = [];
          filteredPool = pool;
        }
        const shuffled = [...filteredPool].sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, state.totalRounds).map((q) => {
          const totalPts = q.answers.reduce((sum, a) => sum + a.points, 0);
          return {
            ...q,
            difficulty: q.difficulty || getQuestionDifficulty(totalPts),
            answers: q.answers.map((a) => ({ ...a, revealed: false })),
          };
        });

        const newUsedIndices = [...usedIndices];
        picked.forEach((q) => {
          const idx = ALL_QUESTIONS.findIndex((aq) => aq.question === q.question);
          if (idx !== -1 && !newUsedIndices.includes(idx)) {
            newUsedIndices.push(idx);
          }
        });
        try {
          localStorage.setItem(USED_QUESTIONS_KEY, JSON.stringify(newUsedIndices.slice(-100)));
        } catch {}

        const fmNeeded = Math.min(5, FAST_MONEY_QUESTIONS.length);
        let filteredFmPool = FAST_MONEY_QUESTIONS.filter((q) => {
          const idx = FAST_MONEY_QUESTIONS.indexOf(q);
          return idx === -1 || !usedFmIndices.includes(idx);
        });
        if (filteredFmPool.length < fmNeeded) {
          usedFmIndices = [];
          filteredFmPool = FAST_MONEY_QUESTIONS;
        }
        const fmShuffled = [...filteredFmPool]
          .sort(() => Math.random() - 0.5)
          .slice(0, fmNeeded)
          .map((q) => ({
            ...q,
            answers: q.answers.map((a) => ({ ...a, revealed: false })),
          }));

        const newUsedFmIndices = [...usedFmIndices];
        fmShuffled.forEach((q) => {
          const idx = FAST_MONEY_QUESTIONS.findIndex((fq) => fq.question === q.question);
          if (idx !== -1 && !newUsedFmIndices.includes(idx)) {
            newUsedFmIndices.push(idx);
          }
        });
        try {
          localStorage.setItem(USED_FM_QUESTIONS_KEY, JSON.stringify(newUsedFmIndices.slice(-50)));
        } catch {}

        set({
          selectedQuestions: picked,
          fmQuestions: fmShuffled,
        });
      },

      handleStartGame: (settings) => {
        const code = generateRoomCode();
        set({
          team1Name: settings.team1Name,
          team2Name: settings.team2Name,
          team1Emoji: settings.team1Emoji,
          team2Emoji: settings.team2Emoji,
          team1Score: 0,
          team2Score: 0,
          round: 1,
          currentTeam: 1,
          strikes: 0,
          totalRounds: settings.totalRounds,
          stealTimerDuration: settings.stealTimer,
          roundTimerDuration: settings.roundTimer,
          difficultyFilter: settings.difficultyFilter,
          celebration300: { show: false, teamName: '' },
          hintsUsedThisRound: 0,
          gamePhase: 'faceoff',
          uiPhase: 'game',
          showGameOver: false,
          gameStats: {
            team1Correct: 0, team2Correct: 0,
            team1Strikes: 0, team2Strikes: 0,
            totalSteals: 0, successfulSteals: 0,
            fastMoneyScore1: 0, fastMoneyScore2: 0,
          },
          roomCode: get().gameMode === 'diwaniya' ? code : null,
        });

        if (get().gameMode === 'diwaniya') {
          fetch('/api/familyfeud-room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, hostName: 'العراب' }),
          }).catch(() => {});
        }

        // Initialize questions AFTER the round/totalRounds state is updated
        setTimeout(() => {
          get().initializeQuestions();
        }, 0);
      },

      handleFaceOffStart: (team) => {
        set({ currentTeam: team, strikes: 0, gamePhase: 'gameboard' });
      },

      handleRevealAnswer: (index) => {
        const s = get();
        const currentAnswers = [...s.currentAnswers];
        if (!currentAnswers[index] || currentAnswers[index].revealed) return;
        currentAnswers[index] = { ...currentAnswers[index], revealed: true };
        const newRoundScore = s.roundScore + currentAnswers[index].points;
        const newStats = { ...s.gameStats };
        if (s.currentTeam === 1) newStats.team1Correct += 1;
        else newStats.team2Correct += 1;
        const newStreak = s.revealStreak + 1;
        set({
          currentAnswers,
          roundScore: newRoundScore,
          feedback: {
            show: true,
            correct: true,
            answer: `${currentAnswers[index].text} - ${currentAnswers[index].points} نقاط`,
          },
          revealStreak: newStreak,
          gameStats: newStats,
        });
        // Auto-hide feedback after 1.5s
        setTimeout(() => set({ feedback: { show: false, correct: false } }), 1500);
        // Reset streak after 3s
        setTimeout(() => {
          if (get().revealStreak === newStreak) set({ revealStreak: 0 });
        }, 3000);
      },

      handleAddStrike: () => {
        const s = get();
        const newStrikes = s.strikes + 1;
        const newStats = { ...s.gameStats };
        if (s.currentTeam === 1) newStats.team1Strikes += 1;
        else newStats.team2Strikes += 1;
        if (newStrikes >= 3) {
          newStats.totalSteals += 1;
          set({
            strikes: newStrikes,
            gamePhase: 'steal',
            feedback: { show: true, correct: false },
            gameStats: newStats,
            roundTimerRunning: false,
          });
        } else {
          set({
            strikes: newStrikes,
            feedback: { show: true, correct: false },
            gameStats: newStats,
            roundTimerRunning: false,
          });
        }
        setTimeout(() => set({ feedback: { show: false, correct: false } }), 1500);
      },

      handlePassToOtherTeam: () => {
        const s = get();
        set({ currentTeam: (s.currentTeam === 1 ? 2 : 1) as 1 | 2, strikes: 0 });
      },

      handleNextRound: () => {
        const s = get();
        if (s.round >= s.totalRounds) {
          set({
            regularRoundScore1: s.team1Score,
            regularRoundScore2: s.team2Score,
            gamePhase: 'fast_money',
            fmPhase: 'intro',
            fmAnswers1: Array(5).fill(''),
            fmAnswers2: Array(5).fill(''),
            fmRevealed1: Array(5).fill(false),
            fmRevealed2: Array(5).fill(false),
            fmScore1: 0,
            fmScore2: 0,
            fmSelected1: [],
            fmSelected2: [],
            timerRunning: false,
            timeLeft: 20,
            hintsUsedThisRound: 0,
          });
        } else {
          set({
            round: s.round + 1,
            strikes: 0,
            gamePhase: 'faceoff',
            hintsUsedThisRound: 0,
          });
        }
      },

      handleAwardAndNextRound: () => {
        const s = get();
        if (s.currentAnswers.length === 0) {
          get().handleNextRound();
          return;
        }
        const allPoints = s.currentAnswers.reduce((sum, a) => sum + a.points, 0);
        const team1Score = s.currentTeam === 1 ? s.team1Score + allPoints : s.team1Score;
        const team2Score = s.currentTeam === 2 ? s.team2Score + allPoints : s.team2Score;
        const teamName = s.currentTeam === 1 ? s.team1Name : s.team2Name;
        set({
          team1Score,
          team2Score,
          scoreAnimation: { team: s.currentTeam, points: allPoints, visible: true },
          roundHistory: [...s.roundHistory, { round: s.round, team: s.currentTeam, points: allPoints, type: 'كامل' }],
          showRoundResult: true,
          roundResultType: 'round_complete',
          roundResultTeamName: teamName,
          roundResultPoints: allPoints,
        });
        setTimeout(() => set((st) => ({ scoreAnimation: { ...st.scoreAnimation, visible: false } })), 1500);
        setTimeout(() => set({ showRoundResult: false }), 1500);
        setTimeout(() => get().handleNextRound(), 100);
      },

      handleSteal: () => {
        const s = get();
        // In steal phase, the OTHER team (opposite of current) steals
        const stealingTeam: 1 | 2 = s.currentTeam === 1 ? 2 : 1;
        const allPoints = s.currentAnswers.reduce((sum, a) => sum + a.points, 0);
        const team1Score = stealingTeam === 1 ? s.team1Score + allPoints : s.team1Score;
        const team2Score = stealingTeam === 2 ? s.team2Score + allPoints : s.team2Score;
        const stealingTeamName = stealingTeam === 1 ? s.team1Name : s.team2Name;
        set({
          team1Score,
          team2Score,
          currentAnswers: s.currentAnswers.map((a) => ({ ...a, revealed: true })),
          roundScore: 0,
          scoreAnimation: { team: stealingTeam, points: allPoints, visible: true },
          showRoundResult: true,
          roundResultType: 'steal_success',
          roundResultTeamName: stealingTeamName,
          roundResultPoints: allPoints,
          roundHistory: [...s.roundHistory, { round: s.round, team: stealingTeam, points: allPoints, type: 'سرقة' }],
          gameStats: { ...s.gameStats, successfulSteals: s.gameStats.successfulSteals + 1 },
          roundTimerRunning: false,
        });
        setTimeout(() => set((st) => ({ scoreAnimation: { ...st.scoreAnimation, visible: false } })), 1500);
        setTimeout(() => set({ showRoundResult: false }), 2800);
        setTimeout(() => get().handleNextRound(), 2800);
      },

      handleNoSteal: () => {
        const s = get();
        // In steal phase, the original team (currentTeam) got 3 strikes and now keeps revealed points
        const revealedPoints = s.currentAnswers
          .filter((a) => a.revealed)
          .reduce((sum, a) => sum + a.points, 0);
        const team1Score = s.currentTeam === 1 ? s.team1Score + revealedPoints : s.team1Score;
        const team2Score = s.currentTeam === 2 ? s.team2Score + revealedPoints : s.team2Score;
        const originalTeamName = s.currentTeam === 1 ? s.team1Name : s.team2Name;
        set({
          team1Score,
          team2Score,
          currentAnswers: s.currentAnswers.map((a) => ({ ...a, revealed: true })),
          roundScore: 0,
          scoreAnimation: { team: s.currentTeam, points: revealedPoints, visible: true },
          showRoundResult: true,
          roundResultType: 'steal_fail',
          roundResultTeamName: originalTeamName,
          roundResultPoints: revealedPoints,
          roundHistory: [...s.roundHistory, { round: s.round, team: s.currentTeam, points: revealedPoints, type: 'محفوظ' }],
          roundTimerRunning: false,
        });
        setTimeout(() => set((st) => ({ scoreAnimation: { ...st.scoreAnimation, visible: false } })), 1500);
        setTimeout(() => set({ showRoundResult: false }), 2800);
        setTimeout(() => get().handleNextRound(), 2800);
      },

      handleRevealAll: () => {
        const s = get();
        const points = s.currentAnswers.reduce((sum, a) => {
          if (!a.revealed) return sum + a.points;
          return sum;
        }, 0);
        const totalAwarded = s.roundScore + points;
        const team1Score = s.currentTeam === 1 ? s.team1Score + totalAwarded : s.team1Score;
        const team2Score = s.currentTeam === 2 ? s.team2Score + totalAwarded : s.team2Score;
        const teamName = s.currentTeam === 1 ? s.team1Name : s.team2Name;
        set({
          currentAnswers: s.currentAnswers.map((a) => ({ ...a, revealed: true })),
          team1Score,
          team2Score,
          roundScore: 0,
          scoreAnimation: { team: s.currentTeam, points: totalAwarded, visible: true },
          showRoundResult: true,
          roundResultType: 'round_complete',
          roundResultTeamName: teamName,
          roundResultPoints: totalAwarded,
          roundHistory: [...s.roundHistory, { round: s.round, team: s.currentTeam, points: totalAwarded, type: 'كشف' }],
        });
        setTimeout(() => set((st) => ({ scoreAnimation: { ...st.scoreAnimation, visible: false } })), 1500);
        setTimeout(() => set({ showRoundResult: false }), 2500);
      },

      handleUseHint: () => {
        const s = get();
        if (s.hintsUsedThisRound >= 2) return;
        const unrevealedIndices = s.currentAnswers
          .map((a, i) => (!a.revealed ? i : -1))
          .filter((i) => i >= 0);
        if (unrevealedIndices.length === 0) return;
        const randomIdx = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
        const answer = s.currentAnswers[randomIdx];
        const halfPoints = Math.floor(answer.points / 2);
        const updated = [...s.currentAnswers];
        updated[randomIdx] = { ...updated[randomIdx], revealed: true };
        set({
          currentAnswers: updated,
          roundScore: s.roundScore + halfPoints,
          hintsUsedThisRound: s.hintsUsedThisRound + 1,
          feedback: {
            show: true,
            correct: true,
            answer: `💡 تلميح: ${answer.text} - ${halfPoints} نقاط (النصف)`,
          },
        });
        setTimeout(() => set({ feedback: { show: false, correct: false } }), 2000);
      },

      handleSkipQuestion: () => {
        const s = get();
        set({
          currentAnswers: s.currentAnswers.map((a) => ({ ...a, revealed: true })),
          roundScore: 0,
          roundHistory: [...s.roundHistory, { round: s.round, team: s.currentTeam, points: 0, type: 'تخطي' }],
          roundTimerRunning: false,
        });
        setTimeout(() => get().handleNextRound(), 1500);
      },

      handleEndGame: () => {
        const s = get();
        const finalScore1 = s.team1Score + s.fmScore1;
        const finalScore2 = s.team2Score + s.fmScore2;
        set({
          team1Score: finalScore1,
          team2Score: finalScore2,
          showGameOver: true,
          gamePhase: 'game_over',
          gameStats: { ...s.gameStats, fastMoneyScore1: s.fmScore1, fastMoneyScore2: s.fmScore2 },
        });
        // Broadcast game over to spectators
        if (s.gameMode === 'diwaniya' && s.roomCode) {
          fetch(`/api/familyfeud-room/${s.roomCode}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phase: 'game_over',
              team1Score: finalScore1,
              team2Score: finalScore2,
            }),
          }).catch(() => {});
        }
      },

      handleReset: () => {
        get().clearSavedState();
        set({
          ...initialState,
          uiPhase: 'landing',
          gamePhase: 'faceoff',
          team1Score: 0,
          team2Score: 0,
          round: 1,
          currentTeam: 1,
          strikes: 0,
          showGameOver: false,
          fmPhase: 'intro',
          timerRunning: false,
          timeLeft: 20,
          roundHistory: [],
          gameStats: {
            team1Correct: 0, team2Correct: 0,
            team1Strikes: 0, team2Strikes: 0,
            totalSteals: 0, successfulSteals: 0,
            fastMoneyScore1: 0, fastMoneyScore2: 0,
          },
        });
      },

      goToFastMoneyFromGameboard: () => {
        const s = get();
        set({
          round: s.totalRounds,
        });
        setTimeout(() => get().handleNextRound(), 0);
      },

      setRoundTimeLeft: (roundTimeLeft) => set({ roundTimeLeft }),
      setRoundTimerRunning: (roundTimerRunning) => set({ roundTimerRunning }),
      tickRoundTimer: () => {
        const s = get();
        if (s.roundTimerRunning && s.roundTimeLeft > 0) {
          set({ roundTimeLeft: s.roundTimeLeft - 1 });
        }
      },
      finishRoundTimerStrike: () => {
        set({ roundTimerRunning: false });
        get().handleAddStrike();
      },

      handleStartTimer: () => set({ timeLeft: 20, timerRunning: true }),
      handleSelectFM1: (qIdx, aIdx) => {
        const s = get();
        const updated = [...s.fmSelected1];
        updated[qIdx] = aIdx;
        const updatedAnswers = [...s.fmAnswers1];
        updatedAnswers[qIdx] = s.fmQuestions[qIdx]?.answers[aIdx]?.text || '';
        set({ fmSelected1: updated, fmAnswers1: updatedAnswers });
      },
      handleSelectFM2: (qIdx, aIdx) => {
        const s = get();
        const updated = [...s.fmSelected2];
        updated[qIdx] = aIdx;
        const updatedAnswers = [...s.fmAnswers2];
        updatedAnswers[qIdx] = s.fmQuestions[qIdx]?.answers[aIdx]?.text || '';
        set({ fmSelected2: updated, fmAnswers2: updatedAnswers });
      },
      handleRevealFM1: (idx) => {
        const s = get();
        const updated = [...s.fmRevealed1];
        updated[idx] = true;
        const sel = s.fmSelected1[idx];
        const pts = sel !== undefined && s.fmQuestions[idx]?.answers[sel]
          ? s.fmQuestions[idx].answers[sel].points : 0;
        set({ fmRevealed1: updated, fmScore1: s.fmScore1 + pts });
      },
      handleRevealFM2: (idx) => {
        const s = get();
        const updated = [...s.fmRevealed2];
        updated[idx] = true;
        const sel = s.fmSelected2[idx];
        // In fast money, team 2 only gets points if answer matches team1's answer
        const ans1 = s.fmAnswers1[idx];
        const ans2 = s.fmAnswers2[idx];
        let pts = 0;
        if (sel !== undefined && s.fmQuestions[idx]?.answers[sel]) {
          pts = s.fmQuestions[idx].answers[sel].points;
          // Deduct points if same answer as team1 (so duplicate isn't counted twice)
          if (ans1 && ans2 && ans1.trim() === ans2.trim()) {
            pts = 0;
          }
        }
        set({ fmRevealed2: updated, fmScore2: s.fmScore2 + pts });
      },
      handleInputFM1: (idx, v) => {
        const s = get();
        const updated = [...s.fmAnswers1];
        updated[idx] = v;
        set({ fmAnswers1: updated });
      },
      handleInputFM2: (idx, v) => {
        const s = get();
        const updated = [...s.fmAnswers2];
        updated[idx] = v;
        set({ fmAnswers2: updated });
      },
      setFmPhase: (fmPhase) => set({ fmPhase }),
      setFmScore1: (fmScore1) => set({ fmScore1 }),
      setFmScore2: (fmScore2) => set({ fmScore2 }),
      setTimeLeft: (timeLeft) => set({ timeLeft }),
      setTimerRunning: (timerRunning) => set({ timerRunning }),
      tickFastMoneyTimer: () => {
        const s = get();
        if (s.timerRunning && s.timeLeft > 0) {
          set({ timeLeft: s.timeLeft - 1 });
        }
      },
      finishFastMoneyTimer: () => {
        set({ timerRunning: false });
      },

      setFeedback: (feedback) => set({ feedback }),
      setShowRoundResult: (showRoundResult) => set({ showRoundResult }),
      setRevealStreak: (revealStreak) => set({ revealStreak }),
      setHintsUsedThisRound: (hintsUsedThisRound) => set({ hintsUsedThisRound }),
      setShowGameOver: (showGameOver) => set({ showGameOver }),
      setCelebration300: (celebration300) => set({ celebration300 }),
      setScoreAnimation: (scoreAnimation) => set({ scoreAnimation }),

      clearSavedState: () => {
        try { localStorage.removeItem('familyfeud_game_state'); } catch {}
      },
    }),
    {
      name: 'familyfeud-game-storage',
      version: 3,
      migrate: ((state: unknown, version: number): FamilyFeudState => {
        void state; void version;
        return { ...initialState } as unknown as FamilyFeudState;
      }) as (state: unknown, version: number) => FamilyFeudState,
      partialize: (state) => ({
        uiPhase: state.uiPhase,
        gameMode: state.gameMode,
        roomCode: state.roomCode,
        hostName: state.hostName,
        team1Name: state.team1Name,
        team2Name: state.team2Name,
        team1Emoji: state.team1Emoji,
        team2Emoji: state.team2Emoji,
        team1Score: state.team1Score,
        team2Score: state.team2Score,
        currentTeam: state.currentTeam,
        strikes: state.strikes,
        round: state.round,
        totalRounds: state.totalRounds,
        stealTimerDuration: state.stealTimerDuration,
        roundTimerDuration: state.roundTimerDuration,
        gamePhase: state.gamePhase,
        selectedQuestions: state.selectedQuestions,
        currentAnswers: state.currentAnswers,
        roundScore: state.roundScore,
        fmQuestions: state.fmQuestions,
        fmAnswers1: state.fmAnswers1,
        fmAnswers2: state.fmAnswers2,
        fmRevealed1: state.fmRevealed1,
        fmRevealed2: state.fmRevealed2,
        fmScore1: state.fmScore1,
        fmScore2: state.fmScore2,
        fmPhase: state.fmPhase,
        fmSelected1: state.fmSelected1,
        fmSelected2: state.fmSelected2,
        showGameOver: state.showGameOver,
        regularRoundScore1: state.regularRoundScore1,
        regularRoundScore2: state.regularRoundScore2,
        roundHistory: state.roundHistory,
        gameStats: state.gameStats,
        difficultyFilter: state.difficultyFilter,
        hintsUsedThisRound: state.hintsUsedThisRound,
      }),
    }
  )
);
