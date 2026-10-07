// ============================================================
// طبول الحرب (War Drums / Tobol) - Zustand Store
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Team, GamePhase, BattleLogEntry } from './tobol-types';
import { WEAPON_CARDS, ALL_BUTTONS } from './tobol-types';

export type GameMode = 'classic' | 'diwaniya';

interface TobolState {
  // Game Phase
  phase: GamePhase;

  // Game Mode
  gameMode: GameMode;

  // Diwaniya
  roomCode: string | null;
  hostName: string | null;

  // Teams
  redName: string;
  blueName: string;
  redScore: number;
  blueScore: number;
  currentTurn: Team;

  // Board State
  clickedBtns: Set<string>;

  // Center image
  mainBgId: number;

  // Card modal
  modalData: { cardImg: string; points: number; team: Team } | null;

  // Battle Log
  battleLog: BattleLogEntry[];
  logCounter: number;

  // Shuffled deck
  shuffledCards: [string, number, number][];

  // Last action notification
  lastAction: string | null;

  // Which team starts first
  firstTeam: Team;

  // Pending game over (after last card is shown)
  pendingGameOver: boolean;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setGameMode: (mode: GameMode) => void;
  setRoomCode: (code: string | null) => void;
  setHostName: (name: string | null) => void;
  setTeamNames: (redName: string, blueName: string) => void;
  setScores: (redScore: number, blueScore: number) => void;
  startGame: (firstTeam?: Team) => void;
  handleButtonClick: (btnId: string) => void;
  closeModal: () => void;
  changeMainImage: () => void;
  setScore: (team: Team, value: number) => void;
  resetGame: () => void;
}

const initialState = {
  phase: 'landing' as GamePhase,
  gameMode: 'classic' as GameMode,
  roomCode: null as string | null,
  hostName: null as string | null,
  redName: 'الجيش الأحمر',
  blueName: 'الجيش الأزرق',
  redScore: 350,
  blueScore: 350,
  currentTurn: 'red' as Team,
  clickedBtns: new Set<string>(),
  mainBgId: 1,
  modalData: null as { cardImg: string; points: number; team: Team } | null,
  battleLog: [] as BattleLogEntry[],
  logCounter: 0,
  shuffledCards: [] as [string, number, number][],
  lastAction: null as string | null,
  firstTeam: 'red' as Team,
  pendingGameOver: false,
};

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const useTobolStore = create<TobolState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPhase: (phase) => set({ phase }),

      setGameMode: (gameMode) => set({ gameMode }),

      setRoomCode: (roomCode) => set({ roomCode }),

      setHostName: (hostName) => set({ hostName }),

      setTeamNames: (redName, blueName) => set({ redName, blueName }),

      setScores: (redScore, blueScore) => set({ redScore, blueScore }),

      setScore: (team, value) => {
        if (team === 'red') {
          set({ redScore: value });
        } else {
          set({ blueScore: value });
        }
      },

      startGame: (firstTeam?: Team) => {
        const state = get();
        const armsArray: [string, number, number][] = WEAPON_CARDS.map(c => [c.imgName, c.attack, c.trap]);
        const shuffled = shuffleArray(armsArray);
        const ft = firstTeam || 'red';

        // For Diwaniya, generate room code and create room
        if (state.gameMode === 'diwaniya') {
          const code = generateRoomCode();

          // Create room via API with initial state
          fetch('/api/tobol-room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, hostName: 'العراب' }),
          }).then(() => {
            // Set initial room state
            return fetch(`/api/tobol-room/${code}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                redName: state.redName,
                blueName: state.blueName,
                redScore: state.redScore,
                blueScore: state.blueScore,
                currentTurn: ft,
                clickedBtns: [],
                lastAction: null,
                battleLog: [],
                modalData: null,
                mainBgId: state.mainBgId,
                phase: 'playing',
              }),
            });
          }).catch(() => {});

          set({
            phase: 'playing',
            currentTurn: ft,
            firstTeam: ft,
            clickedBtns: new Set<string>(),
            modalData: null,
            battleLog: [],
            logCounter: 0,
            shuffledCards: shuffled,
            lastAction: null,
            pendingGameOver: false,
            roomCode: code,
          });
        } else {
          set({
            phase: 'playing',
            currentTurn: ft,
            firstTeam: ft,
            clickedBtns: new Set<string>(),
            modalData: null,
            battleLog: [],
            logCounter: 0,
            shuffledCards: shuffled,
            lastAction: null,
            pendingGameOver: false,
          });
        }
      },

      handleButtonClick: (btnId: string) => {
        const state = get();
        if (state.phase !== 'playing') return;
        if (state.clickedBtns.has(btnId)) return;
        if (state.modalData) return;

        // Mark button as clicked
        const newClicked = new Set(state.clickedBtns);
        newClicked.add(btnId);

        // Pick next card from shuffled array (cycling)
        const cardData = state.shuffledCards[newClicked.size % state.shuffledCards.length];
        if (!cardData) return;

        const [imgName, attack, trap] = cardData;
        const opponent: Team = state.currentTurn === 'red' ? 'blue' : 'red';
        let addedPoints = 0;

        // Calculate new scores in one place (no separate set() calls)
        let newRedScore = state.redScore;
        let newBlueScore = state.blueScore;

        if (attack > 0) {
          addedPoints = attack;
          if (state.currentTurn === 'red') {
            newBlueScore = Math.max(0, state.blueScore - attack);
          } else {
            newRedScore = Math.max(0, state.redScore - attack);
          }
        } else if (trap > 0) {
          addedPoints = trap;
          if (state.currentTurn === 'red') {
            newRedScore = Math.max(0, state.redScore - trap);
          } else {
            newBlueScore = Math.max(0, state.blueScore - trap);
          }
        }

        const teamName = state.currentTurn === 'red' ? state.redName : state.blueName;
        let logMsg = '';
        let actionNotif = '';
        if (attack > 0) {
          logMsg = `هجوم: ${teamName} قام بخصم ${attack} من الخصم`;
          actionNotif = `هجوم: ${teamName} قام بخصم ${attack} من الخصم`;
        } else if (trap > 0) {
          logMsg = `الفخ: سقط ${teamName} في الفخ وخصم ${trap} من فريقه`;
          actionNotif = `الفخ: سقط ${teamName} في الفخ وخصم ${trap} من فريقه`;
        } else {
          logMsg = `${teamName} سحب بطاقة فارغة`;
          actionNotif = `${teamName} سحب بطاقة فارغة`;
        }

        const newLog: BattleLogEntry = {
          id: state.logCounter + 1,
          team: state.currentTurn,
          message: logMsg,
          valueChange: attack > 0 ? -attack : trap > 0 ? -trap : 0,
        };

        // Check if all buttons clicked (60) or a team reached 0
        const allButtonsClicked = newClicked.size >= ALL_BUTTONS.length;
        const teamEliminated = newRedScore <= 0 || newBlueScore <= 0;
        const shouldEndGame = allButtonsClicked || teamEliminated;

        const updates: Partial<TobolState> = {
          redScore: newRedScore,
          blueScore: newBlueScore,
          clickedBtns: newClicked,
          modalData: {
            cardImg: `/img/war/war_wpn_images/${imgName}`,
            points: addedPoints,
            team: state.currentTurn,
          },
          battleLog: [...state.battleLog, newLog],
          logCounter: state.logCounter + 1,
          lastAction: actionNotif,
          currentTurn: opponent,
          pendingGameOver: shouldEndGame,
        };

        set(updates);

        // Update room state for Diwaniya spectators
        if (state.gameMode === 'diwaniya' && state.roomCode) {
          const currentState = get();
          fetch(`/api/tobol-room/${state.roomCode}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              redName: currentState.redName,
              blueName: currentState.blueName,
              redScore: newRedScore,
              blueScore: newBlueScore,
              currentTurn: opponent,
              clickedBtns: Array.from(newClicked),
              lastAction: actionNotif,
              battleLog: currentState.battleLog,
              modalData: currentState.modalData,
              mainBgId: state.mainBgId,
            }),
          }).catch(() => {});
        }
      },

      closeModal: () => {
        const state = get();
        // If pending game over, transition to game_over after closing card
        if (state.pendingGameOver) {
          set({ modalData: null, phase: 'game_over', pendingGameOver: false });

          // Broadcast game_over to spectators (don't delete room so spectators can see results)
          if (state.gameMode === 'diwaniya' && state.roomCode) {
            fetch(`/api/tobol-room/${state.roomCode}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phase: 'game_over',
                redScore: state.redScore,
                blueScore: state.blueScore,
                redName: state.redName,
                blueName: state.blueName,
                battleLog: state.battleLog,
              }),
            }).catch(() => {});
            // Room will expire naturally after 5 min without heartbeat when host resets/leaves
          }
        } else {
          set({ modalData: null });

          // Broadcast modal close (clear card for spectators)
          if (state.gameMode === 'diwaniya' && state.roomCode) {
            fetch(`/api/tobol-room/${state.roomCode}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                modalData: null,
              }),
            }).catch(() => {});
          }
        }
      },

      changeMainImage: () => {
        set({ mainBgId: Math.floor(Math.random() * 19) + 1 });
      },

      resetGame: () => {
        const state = get();
        // Delete room if Diwaniya
        if (state.gameMode === 'diwaniya' && state.roomCode) {
          fetch(`/api/tobol-room/${state.roomCode}`, { method: 'DELETE' }).catch(() => {});
        }
        set({
          ...initialState,
          clickedBtns: new Set<string>(),
          battleLog: [],
          logCounter: 0,
          shuffledCards: [],
          modalData: null,
        });
      },
    }),
    {
      name: 'tobol-game-storage',
      version: 5,
      migrate: () => ({
        ...initialState,
        clickedBtns: new Set<string>(),
        battleLog: [],
        logCounter: 0,
        shuffledCards: [],
        modalData: null,
        pendingGameOver: false,
        gameMode: 'classic',
        roomCode: null,
        hostName: null,
      }),
      partialize: (state) => ({
        phase: state.phase,
        gameMode: state.gameMode,
        roomCode: state.roomCode,
        hostName: state.hostName,
        redName: state.redName,
        blueName: state.blueName,
        redScore: state.redScore,
        blueScore: state.blueScore,
        currentTurn: state.currentTurn,
        clickedBtns: Array.from(state.clickedBtns),
        mainBgId: state.mainBgId,
        modalData: state.modalData,
        battleLog: state.battleLog,
        logCounter: state.logCounter,
        shuffledCards: state.shuffledCards,
        lastAction: state.lastAction,
        firstTeam: state.firstTeam,
        pendingGameOver: state.pendingGameOver,
      }),
      merge: (persisted: any, current: any) => ({
        ...current,
        ...(persisted as any),
        clickedBtns: new Set<string>((persisted as any)?.clickedBtns || []),
      }),
    }
  )
);
