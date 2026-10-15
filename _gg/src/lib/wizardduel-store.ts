// ============================================================
// مبارزة السحرة (Wizard Duel) — Zustand store + game logic
// Solo turn-based card game (wizard vs AI enemy)
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  WizardDuelState,
  GamePhase,
  GameMode,
  Card,
  Player,
  Effect,
  BattleLogEntry,
} from './wizardduel-types';
import { getDeckForLevel } from './wizardduel-cards';

const STARTING_HP = 30;
const STARTING_HAND_SIZE = 5;
const MOVES_PER_TURN = 2;

interface WizardDuelStore extends WizardDuelState {
  setPhase: (phase: GamePhase) => void;
  setGameMode: (mode: GameMode) => void;
  setRoomCode: (code: string | null) => void;
  setHostName: (name: string | null) => void;
  resetGame: () => void;
  startGame: (playerName: string, level: number) => void;
  drawCard: (playerId: '0' | '1') => void;
  playCard: (playerId: '0' | '1', cardIndex: number) => void;
  applyEffect: (targetPlayerId: '0' | '1', effect: Effect, sourcePlayerId: '0' | '1') => void;
  endTurn: () => void;
  aiTakeTurn: () => void;
  checkWinCondition: () => void;
}

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

function makePlayer(id: '0' | '1', name: string, isWizard: boolean): Player {
  return {
    id,
    name,
    hp: STARTING_HP,
    maxHp: STARTING_HP,
    hand: [],
    activeEffects: [],
    isWizard,
  };
}

function pushLog(
  log: BattleLogEntry[],
  counter: number,
  playerName: string,
  message: string,
  cardName?: string,
  valueChange?: number,
): { log: BattleLogEntry[]; counter: number } {
  const entry: BattleLogEntry = {
    id: counter + 1,
    playerName,
    message,
    cardName,
    valueChange,
  };
  return { log: [...log, entry], counter: counter + 1 };
}

// Random value resolver for Wish/Mutate (-1, -2, -3, -4, -5)
function resolveRandomValue(value: number): number {
  if (value >= 0) return value;
  switch (value) {
    case -1: return Math.floor(Math.random() * 5) + 1;   // 1-5
    case -2: return Math.floor(Math.random() * 5) + 2;   // 2-6
    case -3: return Math.floor(Math.random() * 6) + 1;   // 1-6 chaotic
    case -4: return Math.random() < 0.5 ? 10 : -10;      // +10 dmg or +10 heal
    case -5: return Math.floor(Math.random() * 8) + 2;   // 2-9
    default: return Math.abs(value);
  }
}

// AI name based on level
function getAiName(level: number): string {
  if (level <= 1) return 'ساحر الظلام';
  if (level === 2) return 'ساحر العواصف';
  return 'الساحر الأعظم';
}

const initialState: WizardDuelState = {
  phase: 'landing',
  gameMode: 'classic',
  players: {
    0: makePlayer('0', 'الساحر', true),
    1: makePlayer('1', 'ساحر الظلام', false),
  },
  deck: [],
  level: 1,
  globalEffects: {},
  currentTurn: '0',
  turnCount: 1,
  movesThisTurn: 0,
  battleLog: [],
  logCounter: 0,
  winner: null,
  hostName: null,
  roomCode: null,
  lastAction: null,
};

export const useWizardDuelStore = create<WizardDuelStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPhase: (phase) => set({ phase }),
      setGameMode: (gameMode) => set({ gameMode }),
      setRoomCode: (roomCode) => set({ roomCode }),
      setHostName: (hostName) => set({ hostName }),

      resetGame: () => {
        const state = get();
        // Delete diwaniya room
        if (state.gameMode === 'diwaniya' && state.roomCode) {
          try { fetch(`/api/wizardduel-room/${state.roomCode}`, { method: 'DELETE' }).catch(() => {}); } catch { /* ignore */ }
        }
        set({
          ...initialState,
          players: {
            0: makePlayer('0', 'الساحر', true),
            1: makePlayer('1', 'ساحر الظلام', false),
          },
          gameMode: state.gameMode, // preserve game mode
        });
      },

      startGame: (playerName, level) => {
        const state = get();
        const deck = shuffleArray(getDeckForLevel(level));
        const aiName = getAiName(level);

        const wizard = makePlayer('0', playerName.trim() || 'الساحر', true);
        const enemy = makePlayer('1', aiName, false);

        // Deal 5 cards each from deck
        for (let i = 0; i < STARTING_HAND_SIZE; i++) {
          if (deck.length > 0) wizard.hand.push(deck.pop()!);
        }
        for (let i = 0; i < STARTING_HAND_SIZE; i++) {
          if (deck.length > 0) enemy.hand.push(deck.pop()!);
        }

        // For Diwaniya — create room
        if (state.gameMode === 'diwaniya') {
          const code = generateRoomCode();
          try {
            fetch('/api/wizardduel-room', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code, hostName: playerName.trim() || 'العراب' }),
            }).then(() => {
              return fetch(`/api/wizardduel-room/${code}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  phase: 'playing',
                  currentTurn: '0',
                  lastAction: 'بدأت المبارزة',
                } as Partial<WizardDuelState>),
              });
            }).catch(() => {});
          } catch { /* ignore */ }
          set({
            phase: 'playing',
            players: { 0: wizard, 1: enemy },
            deck,
            level,
            currentTurn: '0',
            turnCount: 1,
            movesThisTurn: 0,
            battleLog: [],
            logCounter: 0,
            winner: null,
            roomCode: code,
            hostName: playerName.trim() || 'العراب',
            lastAction: 'بدأت المبارزة — العب بطاقتك أو اسحب بطاقة',
            globalEffects: {},
          });
        } else {
          set({
            phase: 'playing',
            players: { 0: wizard, 1: enemy },
            deck,
            level,
            currentTurn: '0',
            turnCount: 1,
            movesThisTurn: 0,
            battleLog: [],
            logCounter: 0,
            winner: null,
            lastAction: 'بدأت المبارزة — العب بطاقتك أو اسحب بطاقة',
            globalEffects: {},
          });
        }
      },

      drawCard: (playerId) => {
        const state = get();
        if (state.phase !== 'playing') return;
        if (state.currentTurn !== playerId) return;
        if (state.movesThisTurn >= MOVES_PER_TURN) return;
        if (state.winner) return;

        const player = state.players[playerId];
        if (state.deck.length === 0) return;

        const card = state.deck.pop()!;
        const newHand = [...player.hand, card];
        const newPlayers = { ...state.players, [playerId]: { ...player, hand: newHand } };

        let { log, counter } = pushLog(
          state.battleLog,
          state.logCounter,
          player.name,
          `سحب بطاقة جديدة (${card.name})`,
          card.name,
        );

        const newMoves = state.movesThisTurn + 1;
        const shouldEndTurn = newMoves >= MOVES_PER_TURN;

        set({
          players: newPlayers,
          movesThisTurn: newMoves,
          battleLog: log,
          logCounter: counter,
          lastAction: `${player.name} سحب بطاقة`,
        });

        // Auto end turn if moves exhausted
        if (shouldEndTurn) {
          // Use timeout to allow state to settle then end turn
          setTimeout(() => {
            get().endTurn();
          }, 50);
        }
      },

      playCard: (playerId, cardIndex) => {
        const state = get();
        if (state.phase !== 'playing') return;
        if (state.currentTurn !== playerId) return;
        if (state.movesThisTurn >= MOVES_PER_TURN) return;
        if (state.winner) return;

        const player = state.players[playerId];
        if (cardIndex < 0 || cardIndex >= player.hand.length) return;

        // Check freeze — can't play while frozen
        const isFrozen = player.activeEffects.some(e => e.type === 'freeze');
        if (isFrozen) {
          let { log, counter } = pushLog(
            state.battleLog,
            state.logCounter,
            player.name,
            `${player.name} مجمد — لا يمكنه اللعب، ينهي الدور`,
          );
          set({
            battleLog: log,
            logCounter: counter,
            lastAction: `${player.name} مجمد`,
            movesThisTurn: MOVES_PER_TURN,
          });
          setTimeout(() => get().endTurn(), 50);
          return;
        }

        const card = player.hand[cardIndex];
        const opponentId = playerId === '0' ? '1' : '0';
        const opponent = state.players[opponentId];

        // Clone players for mutation
        const newWizard = { ...player, hand: player.hand.filter((_, i) => i !== cardIndex), activeEffects: [...player.activeEffects] };
        const newEnemy = { ...opponent, activeEffects: [...opponent.activeEffects] };

        let log = state.battleLog;
        let counter = state.logCounter;

        // Process each effect in card
        for (const effect of card.effects) {
          // Random value resolution for Wish/Mutate cards
          const effectiveValue = effect.value !== undefined ? resolveRandomValue(effect.value) : undefined;
          const eff: Effect = { ...effect, value: effectiveValue };

          let targetPlayer: Player;
          if (eff.target === 'self') targetPlayer = newWizard;
          else targetPlayer = newEnemy;

          // Check preventDmg on target
          const hasPrevent = targetPlayer.activeEffects.some(e => e.type === 'preventDmg');

          switch (eff.type) {
            case 'damage': {
              let dmg = eff.value ?? 0;
              // Apply buffAtk on self (double damage)
              const hasBuffAtk = newWizard.activeEffects.some(e => e.type === 'buffAtk');
              if (hasBuffAtk && eff.target === 'opponent') {
                dmg *= 2;
                newWizard.activeEffects = newWizard.activeEffects.filter(e => e.type !== 'buffAtk');
              }
              // Apply debuffDef on target (increase damage by 50%)
              const hasDebuffDef = targetPlayer.activeEffects.some(e => e.type === 'debuffDef');
              if (hasDebuffDef && eff.target === 'opponent') {
                dmg = Math.floor(dmg * 1.5);
                targetPlayer.activeEffects = targetPlayer.activeEffects.filter(e => e.type !== 'debuffDef');
              }
              // Apply doubleDmg enduring effect
              const hasDoubleDmg = newWizard.activeEffects.some(e => e.type === 'doubleDmg');
              if (hasDoubleDmg && eff.target === 'opponent') {
                dmg *= 2;
                newWizard.activeEffects = newWizard.activeEffects.filter(e => e.type !== 'doubleDmg');
              }
              if (hasPrevent && eff.target === 'opponent') {
                // Block the damage
                targetPlayer.activeEffects = targetPlayer.activeEffects.filter(e => e.type !== 'preventDmg');
                const r = pushLog(log, counter, newWizard.name, `منع الضرر (${dmg}) بفضل الدرع`, card.name, 0);
                log = r.log; counter = r.counter;
              } else {
                targetPlayer.hp = Math.max(0, targetPlayer.hp - dmg);
                const r = pushLog(log, counter, newWizard.name, `${newWizard.name} ألحق ${dmg} ضرر بـ ${targetPlayer.name}`, card.name, -dmg);
                log = r.log; counter = r.counter;
              }
              break;
            }
            case 'heal': {
              const healAmt = eff.value ?? 0;
              targetPlayer.hp = Math.min(targetPlayer.maxHp, targetPlayer.hp + healAmt);
              const r = pushLog(log, counter, newWizard.name, `${targetPlayer.name} استعاد ${healAmt} صحة`, card.name, healAmt);
              log = r.log; counter = r.counter;
              break;
            }
            case 'lifesteal': {
              const amt = eff.value ?? 0;
              newEnemy.hp = Math.max(0, newEnemy.hp - amt);
              newWizard.hp = Math.min(newWizard.maxHp, newWizard.hp + amt);
              const r = pushLog(log, counter, newWizard.name, `${newWizard.name} سحب ${amt} صحة من ${newEnemy.name}`, card.name, -amt);
              log = r.log; counter = r.counter;
              break;
            }
            case 'poison': {
              targetPlayer.activeEffects.push({ ...eff });
              const r = pushLog(log, counter, newWizard.name, `${targetPlayer.name} تسمّم (${eff.value} / دورة)`, card.name);
              log = r.log; counter = r.counter;
              break;
            }
            case 'aura': {
              targetPlayer.activeEffects.push({ ...eff });
              const r = pushLog(log, counter, newWizard.name, `${targetPlayer.name} تأثر بهالة (${eff.value}/دورة)`, card.name);
              log = r.log; counter = r.counter;
              break;
            }
            case 'freeze': {
              targetPlayer.activeEffects.push({ ...eff });
              const r = pushLog(log, counter, newWizard.name, `${targetPlayer.name} تجمّد`, card.name);
              log = r.log; counter = r.counter;
              break;
            }
            case 'buffAtk':
            case 'buffDef':
            case 'doubleDmg':
            case 'preventDmg':
            case 'resurrect':
            case 'counterAttack': {
              targetPlayer.activeEffects.push({ ...eff });
              const r = pushLog(log, counter, newWizard.name, `${targetPlayer.name} حصل على تأثير: ${eff.type}`, card.name);
              log = r.log; counter = r.counter;
              break;
            }
            case 'debuffAtk':
            case 'debuffDef': {
              targetPlayer.activeEffects.push({ ...eff });
              const r = pushLog(log, counter, newWizard.name, `${targetPlayer.name} ضعف (${eff.type})`, card.name);
              log = r.log; counter = r.counter;
              break;
            }
            case 'removeDebuff': {
              targetPlayer.activeEffects = targetPlayer.activeEffects.filter(e =>
                e.type !== 'debuffAtk' && e.type !== 'debuffDef' && e.type !== 'poison' && e.type !== 'freeze' && e.type !== 'aura'
              );
              const r = pushLog(log, counter, newWizard.name, `${targetPlayer.name} تطهّر من التأثيرات السلبية`, card.name);
              log = r.log; counter = r.counter;
              break;
            }
            case 'removeBuff': {
              targetPlayer.activeEffects = targetPlayer.activeEffects.filter(e =>
                e.type !== 'buffAtk' && e.type !== 'buffDef' && e.type !== 'doubleDmg' && e.type !== 'preventDmg' && e.type !== 'resurrect' && e.type !== 'counterAttack'
              );
              const r = pushLog(log, counter, newWizard.name, `${targetPlayer.name} فقد تأثيراته الإيجابية`, card.name);
              log = r.log; counter = r.counter;
              break;
            }
            case 'stealBuff': {
              const stolen = targetPlayer.activeEffects.filter(e =>
                e.type === 'buffAtk' || e.type === 'buffDef' || e.type === 'doubleDmg' || e.type === 'preventDmg'
              );
              targetPlayer.activeEffects = targetPlayer.activeEffects.filter(e => !stolen.includes(e));
              newWizard.activeEffects.push(...stolen);
              const r = pushLog(log, counter, newWizard.name, `${newWizard.name} سرق ${stolen.length} تأثير من ${targetPlayer.name}`, card.name);
              log = r.log; counter = r.counter;
              break;
            }
            case 'swapHp': {
              const tmp = newWizard.hp;
              newWizard.hp = newEnemy.hp;
              newEnemy.hp = tmp;
              const r = pushLog(log, counter, newWizard.name, `${newWizard.name} بدّل صحته مع ${newEnemy.name}`, card.name);
              log = r.log; counter = r.counter;
              break;
            }
            case 'copyEnemyHand': {
              // Copy opponent's hand to self
              newWizard.hand = [...newEnemy.hand];
              const r = pushLog(log, counter, newWizard.name, `${newWizard.name} نسخ يد ${newEnemy.name}`, card.name);
              log = r.log; counter = r.counter;
              break;
            }
            case 'replaceHand': {
              // Discard current hand, draw same count fresh from deck
              const cnt = newWizard.hand.length;
              newWizard.hand = [];
              for (let i = 0; i < cnt && state.deck.length > 0; i++) {
                newWizard.hand.push(state.deck.pop()!);
              }
              const r = pushLog(log, counter, newWizard.name, `${newWizard.name} استبدل يده (${cnt} بطاقات)`, card.name);
              log = r.log; counter = r.counter;
              break;
            }
            case 'resurrect': {
              // Already handled in buff case but mark differently
              targetPlayer.activeEffects.push({ ...eff });
              const r = pushLog(log, counter, newWizard.name, `${targetPlayer.name} يملك تعويذة إحياء`, card.name);
              log = r.log; counter = r.counter;
              break;
            }
            default: {
              const r = pushLog(log, counter, newWizard.name, `${newWizard.name} استخدم ${eff.type}`, card.name);
              log = r.log; counter = r.counter;
            }
          }
        }

        const newPlayers = playerId === '0'
          ? { 0: newWizard, 1: newEnemy }
          : { 0: newEnemy, 1: newWizard };

        const newMoves = state.movesThisTurn + 1;
        const shouldEndTurn = newMoves >= MOVES_PER_TURN;

        set({
          players: newPlayers,
          movesThisTurn: newMoves,
          battleLog: log,
          logCounter: counter,
          lastAction: `${newWizard.name} لعب ${card.name}`,
        });

        // Check win condition
        get().checkWinCondition();

        // Auto end turn if moves exhausted (only if game still playing)
        if (shouldEndTurn && get().phase === 'playing') {
          setTimeout(() => get().endTurn(), 100);
        }
      },

      applyEffect: (targetPlayerId, effect, sourcePlayerId) => {
        const state = get();
        const target = state.players[targetPlayerId];
        const newActive = [...target.activeEffects, effect];
        const newPlayers = { ...state.players, [targetPlayerId]: { ...target, activeEffects: newActive } };
        set({ players: newPlayers });
      },

      endTurn: () => {
        const state = get();
        if (state.phase !== 'playing') return;
        if (state.winner) return;

        // Check win condition before switching
        get().checkWinCondition();
        if (get().winner) return;

        // Apply end-of-turn effects (poison, aura) on both players
        const p0 = { ...state.players[0], activeEffects: [...state.players[0].activeEffects] };
        const p1 = { ...state.players[1], activeEffects: [...state.players[1].activeEffects] };

        let log = state.battleLog;
        let counter = state.logCounter;

        // Apply poison/aura to each player at the END of their own turn
        const activeId = state.currentTurn;
        const activePlayer = activeId === '0' ? p0 : p1;
        const activeBuffs = activePlayer.activeEffects.filter(e => e.type === 'poison' || e.type === 'aura');
        for (const eff of activeBuffs) {
          const dmg = eff.value ?? 0;
          activePlayer.hp = Math.max(0, activePlayer.hp - dmg);
          const r = pushLog(log, counter, activePlayer.name, `${activePlayer.name} خسر ${dmg} من ${eff.type === 'poison' ? 'السم' : 'الهالة'}`);
          log = r.log; counter = r.counter;
        }

        // Remove expired effects (one-time buffs) — counterAttack, preventDmg, buffAtk, buffDef, doubleDmg, resurrect
        // Keep enduring poison/aura/freeze (they apply each turn until cleared)
        // Counter-attack should only trigger when player is attacked, but here we just track lifetime — simplest: clear counterAttack each turn
        const clearExpired = (p: Player): Player => ({
          ...p,
          activeEffects: p.activeEffects.filter(e =>
            e.type === 'poison' || e.type === 'aura' || e.type === 'freeze' || e.type === 'resurrect'
          ),
        });
        const cleanedP0 = clearExpired(p0);
        const cleanedP1 = clearExpired(p1);

        // Remove freeze from the player who just ended their turn (they survived being frozen)
        // Freeze means: the frozen player CAN'T play during their NEXT turn
        // So if the active player was frozen, clear it now since their turn just ended without playing
        // Implementation: clear freeze on the active player at end of their turn
        if (activeId === '0') {
          cleanedP0.activeEffects = cleanedP0.activeEffects.filter(e => e.type !== 'freeze');
        } else {
          cleanedP1.activeEffects = cleanedP1.activeEffects.filter(e => e.type !== 'freeze');
        }

        // Switch turn
        const nextTurn = activeId === '0' ? '1' : '0';

        set({
          players: { 0: cleanedP0, 1: cleanedP1 },
          currentTurn: nextTurn,
          turnCount: state.turnCount + 1,
          movesThisTurn: 0,
          battleLog: log,
          logCounter: counter,
          lastAction: nextTurn === '0' ? 'دورك — العب أو اسحب' : 'دور الخصم...',
        });

        // Broadcast for diwaniya
        if (state.gameMode === 'diwaniya' && state.roomCode) {
          try {
            fetch(`/api/wizardduel-room/${state.roomCode}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                players: { 0: cleanedP0, 1: cleanedP1 },
                currentTurn: nextTurn,
                turnCount: state.turnCount + 1,
                movesThisTurn: 0,
                battleLog: log,
                lastAction: nextTurn === '0' ? 'دورك — العب أو اسحب' : 'دور الخصم...',
              } as Partial<WizardDuelState>),
            }).catch(() => {});
          } catch { /* ignore */ }
        }

        // AI takes turn if currentTurn = 1
        if (nextTurn === '1' && get().phase === 'playing') {
          setTimeout(() => get().aiTakeTurn(), 800);
        }
      },

      aiTakeTurn: () => {
        const state = get();
        if (state.phase !== 'playing') return;
        if (state.currentTurn !== '1') return;
        if (state.winner) return;

        const ai = state.players[1];
        const enemy = state.players[0]; // the human wizard
        let log = state.battleLog;
        let counter = state.logCounter;

        // AI strategy:
        // - If HP < 30% max → heal (if heal card in hand)
        // - Else if enemy HP > 50% max → prioritize damage cards
        // - Else random play or draw
        const hpThreshold = ai.maxHp * 0.3;
        const enemyHighHp = enemy.hp > enemy.maxHp * 0.5;

        // Find damage cards
        const damageIdx = ai.hand.findIndex(c => c.keywords.includes('damage'));
        const healIdx = ai.hand.findIndex(c => c.keywords.includes('sustain'));
        const effectIdx = ai.hand.findIndex(c => c.keywords.includes('effect'));

        let action: 'play' | 'draw' = 'draw';
        let cardIdx = -1;

        if (ai.hp < hpThreshold && healIdx >= 0) {
          action = 'play';
          cardIdx = healIdx;
        } else if (enemyHighHp && damageIdx >= 0) {
          action = 'play';
          cardIdx = damageIdx;
        } else if (ai.hand.length === 0) {
          action = 'draw';
        } else if (effectIdx >= 0 && Math.random() < 0.5) {
          action = 'play';
          cardIdx = effectIdx;
        } else if (ai.hand.length > 0) {
          action = 'play';
          cardIdx = Math.floor(Math.random() * ai.hand.length);
        }

        // Use first move
        if (action === 'draw') {
          get().drawCard('1');
        } else if (cardIdx >= 0) {
          get().playCard('1', cardIdx);
        }

        // If still has moves (and game still playing), use second move
        setTimeout(() => {
          const s2 = get();
          if (s2.phase !== 'playing' || s2.winner || s2.currentTurn !== '1') return;
          if (s2.movesThisTurn >= MOVES_PER_TURN) return;

          const ai2 = s2.players[1];
          const enemy2 = s2.players[0];
          const hpThr2 = ai2.maxHp * 0.3;
          const enemyHigh2 = enemy2.hp > enemy2.maxHp * 0.5;
          const dmgIdx2 = ai2.hand.findIndex(c => c.keywords.includes('damage'));
          const healIdx2 = ai2.hand.findIndex(c => c.keywords.includes('sustain'));

          if (ai2.hp < hpThr2 && healIdx2 >= 0) {
            get().playCard('1', healIdx2);
          } else if (enemyHigh2 && dmgIdx2 >= 0) {
            get().playCard('1', dmgIdx2);
          } else if (ai2.hand.length > 0) {
            const idx = Math.floor(Math.random() * ai2.hand.length);
            get().playCard('1', idx);
          } else {
            get().drawCard('1');
          }
        }, 800);
      },

      checkWinCondition: () => {
        const state = get();
        if (state.winner) return;
        const p0 = state.players[0];
        const p1 = state.players[1];

        // Resurrect check: if a player is dead but has resurrect effect
        if (p0.hp <= 0 && p0.activeEffects.some(e => e.type === 'resurrect')) {
          const newEffects = p0.activeEffects.filter(e => e.type !== 'resurrect');
          const newP0 = { ...p0, hp: Math.floor(p0.maxHp / 2), activeEffects: newEffects };
          set({ players: { 0: newP0, 1: p1 } });
          let { log, counter } = pushLog(state.battleLog, state.logCounter, p0.name, `${p0.name} عاد للحياة بنصف الصحة!`);
          set({ battleLog: log, logCounter: counter });
          return;
        }
        if (p1.hp <= 0 && p1.activeEffects.some(e => e.type === 'resurrect')) {
          const newEffects = p1.activeEffects.filter(e => e.type !== 'resurrect');
          const newP1 = { ...p1, hp: Math.floor(p1.maxHp / 2), activeEffects: newEffects };
          set({ players: { 0: p0, 1: newP1 } });
          let { log, counter } = pushLog(state.battleLog, state.logCounter, p1.name, `${p1.name} عاد للحياة بنصف الصحة!`);
          set({ battleLog: log, logCounter: counter });
          return;
        }

        if (p0.hp <= 0 && p1.hp <= 0) {
          // Draw — pick lower id (rare case)
          set({ winner: '1', phase: 'game_over' });
        } else if (p1.hp <= 0) {
          set({ winner: '0', phase: 'game_over', lastAction: `${p0.name} فاز! 🏆` });
        } else if (p0.hp <= 0) {
          set({ winner: '1', phase: 'game_over', lastAction: `${p1.name} فاز! 💀` });
        }
      },
    }),
    {
      name: 'wizardduel-game-storage',
      version: 1,
      partialize: (state) => ({
        phase: state.phase,
        gameMode: state.gameMode,
        roomCode: state.roomCode,
        hostName: state.hostName,
        players: state.players,
        deck: state.deck,
        level: state.level,
        globalEffects: state.globalEffects,
        currentTurn: state.currentTurn,
        turnCount: state.turnCount,
        movesThisTurn: state.movesThisTurn,
        battleLog: state.battleLog,
        logCounter: state.logCounter,
        winner: state.winner,
        lastAction: state.lastAction,
      }),
      merge: (persisted: any, current: any) => ({
        ...current,
        ...(persisted as any),
      }),
    }
  )
);
