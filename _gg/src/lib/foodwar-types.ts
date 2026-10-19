// ════════════════════════════════════════════════════════════════
// حرب الاكلات (Food War) — Game Types
// Players spin a wheel → selected player picks food → hidden player eliminated
// Last player standing wins
// ════════════════════════════════════════════════════════════════

export type GamePhase = 'landing' | 'setup' | 'playing' | 'game_over';
export type GameMode = 'classic' | 'diwaniya';
export type TurnPhase = 'spinning' | 'selecting' | 'revealing' | 'next_round';

export interface FoodWarPlayer {
  id: number;
  name: string;
  color: string;
  emoji: string;
  isAlive: boolean;
  isHidden: boolean;       // hidden behind a food item
  hiddenBehind: number | null; // food item index
}

export interface FoodItem {
  id: number;
  emoji: string;
  name: string;
  color: string;
  hiddenPlayerId: number | null;
  revealed: boolean;
}

export interface FoodWarRound {
  roundNumber: number;
  selectorId: number;        // player who selects food
  foodItems: FoodItem[];
  selectedFoodId: number | null;
  eliminatedPlayerId: number | null;
}

export interface GameLogEntry {
  round: number;
  message: string;
  type: 'info' | 'success' | 'danger' | 'system';
  timestamp: number;
}

export const PLAYER_COLORS = [
  { color: '#ef4444', emoji: '🔴', name: 'أحمر' },
  { color: '#3b82f6', emoji: '🔵', name: 'أزرق' },
  { color: '#22c55e', emoji: '🟢', name: 'أخضر' },
  { color: '#f59e0b', emoji: '🟡', name: 'أصفر' },
  { color: '#8b5cf6', emoji: '🟣', name: 'بنفسجي' },
  { color: '#ec4899', emoji: '🩷', name: 'وردي' },
  { color: '#06b6d4', emoji: '🩵', name: 'سماوي' },
  { color: '#84cc16', emoji: '🟢', name: 'ليموني' },
];

export const FOOD_ITEMS = [
  { emoji: '🍕', name: 'بيتزا', color: '#f59e0b' },
  { emoji: '🍔', name: 'برجر', color: '#dc2626' },
  { emoji: '🌮', name: 'تاكو', color: '#22c55e' },
  { emoji: '🍣', name: 'سوشي', color: '#3b82f6' },
  { emoji: '🍝', name: 'باستا', color: '#f97316' },
  { emoji: '🍰', name: 'كيك', color: '#ec4899' },
  { emoji: '🍟', name: 'بطاطس', color: '#eab308' },
  { emoji: '🥗', name: 'سلطة', color: '#22c55e' },
  { emoji: '🍜', name: 'نودلز', color: '#8b5cf6' },
  { emoji: '🍩', name: 'دونات', color: '#f59e0b' },
  { emoji: '🍦', name: 'آيس كريم', color: '#06b6d4' },
  { emoji: '🥘', name: 'يخنة', color: '#dc2626' },
];

export const ROUND_COUNT_OPTIONS = [
  { value: 1, label: 'جولة واحدة' },
  { value: 3, label: '3 جولات' },
  { value: 5, label: '5 جولات' },
];

export interface FoodWarRound {
  roundNumber: number;
  selectorId: number;
  foodItems: FoodItem[];
  selectedFoodId: number | null;
  eliminatedPlayerId: number | null;
}
