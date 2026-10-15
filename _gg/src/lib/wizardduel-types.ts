// ============================================================
// مبارزة السحرة (Wizard Duel) — Type definitions
// Solo turn-based card game (wizard vs AI enemy)
// 36 unique cards with 20 effect types, 2 moves per turn (draw OR play)
// Win condition: enemy HP = 0
// ============================================================

export type GamePhase = 'landing' | 'setup' | 'playing' | 'game_over';
export type GameMode = 'classic' | 'diwaniya';

// 20 effect types — adapted from github.com/ruichen199801/wizard-duel
export type EffectType =
  | 'damage'
  | 'heal'
  | 'buffAtk'
  | 'buffDef'
  | 'debuffAtk'
  | 'debuffDef'
  | 'removeBuff'
  | 'removeDebuff'
  | 'doubleDmg'
  | 'preventDmg'
  | 'resurrect'
  | 'freeze'
  | 'aura'
  | 'replaceHand'
  | 'swapHp'
  | 'stealBuff'
  | 'copyEnemyHand'
  | 'lifesteal'
  | 'counterAttack'
  | 'poison';

export type EffectDuration = 'instant' | 'enduring';
export type EffectTarget = 'self' | 'opponent';
export type CardKeyword = 'damage' | 'sustain' | 'effect';

export interface Effect {
  type: EffectType;
  duration: EffectDuration;
  target: EffectTarget;
  value?: number;
}

export interface Card {
  id: string;
  name: string;          // Arabic card name
  text: string;          // Arabic description (used in logs)
  effects: Effect[];
  keywords: CardKeyword[];
  artPath?: string;      // optional card image path (e.g. '/yalla-games/cards/wizardduel/fireball.png')
}

export interface Player {
  id: '0' | '1';
  name: string;
  hp: number;
  maxHp: number;
  hand: Card[];
  activeEffects: Effect[];
  isWizard: boolean;     // true for player 0 (the human), false for player 1 (AI)
}

export interface BattleLogEntry {
  id: number;
  playerName: string;
  message: string;
  cardName?: string;
  valueChange?: number;
}

export interface WizardDuelState {
  phase: GamePhase;
  gameMode: GameMode;
  players: { 0: Player; 1: Player };
  deck: Card[];
  level: number;
  globalEffects: Record<string, Effect>;
  currentTurn: '0' | '1';
  turnCount: number;
  movesThisTurn: number;
  battleLog: BattleLogEntry[];
  logCounter: number;
  winner: '0' | '1' | null;
  hostName: string | null;
  roomCode: string | null;
  // For diwaniya state broadcast
  lastAction: string | null;
}
