// ============================================================
// المجازفة (Risk) - Types & Constants
// 50 cards: 45 number cards (1-9 × 5 colors) + 5 special cards
// ============================================================

// Card types
export type CardType = 'number' | 'bomb' | 'skip' | 'double' | 'triple';

// Game phases
export type RiskGamePhase = 'landing' | 'setup' | 'playing' | 'game_over';

// Turn states during play
export type RiskTurnState =
  | 'waiting_for_draw'    // Player should draw a card
  | 'waiting_for_decision' // Player chose continue or bank (safe draw)
  | 'showing_result'      // Showing what was drawn (skip, double, triple)
  | 'turn_lost'           // Match found — lost all round points
  | 'bomb_exploded';      // Bomb was drawn

// Card colors
export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple';

// Card interface
export interface RiskCard {
  id: string;
  type: CardType;
  number: number;        // 1-9 for number cards, 0 for special
  color: CardColor | null; // null for special cards
  revealed: boolean;
  index: number;
  value: number;         // Point value (number for number cards, 0 for special)
}

// Player interface
export interface RiskPlayer {
  id: string;
  name: string;
  score: number;
  roundScore: number;
  color: string;         // Tailwind text color
  colorHex: string;      // Hex for borders/gradients
  emoji: string;
}

// Log entry
export interface RiskLogEntry {
  id: number;
  playerId: string;
  playerName: string;
  action: string;
  timestamp: number;
}

// Game config for setup
export interface RiskGameConfig {
  targetScore: number;
  playerNames: string[];
}

// ============================================================
// Constants
// ============================================================

// 5 card colors
export const CARD_COLORS: CardColor[] = ['red', 'blue', 'green', 'yellow', 'purple'];

// Color display config
export const CARD_COLOR_CONFIG: Record<CardColor, {
  emoji: string;
  bg: string;
  border: string;
  text: string;
  label: string;
  labelAr: string;
}> = {
  red: {
    emoji: '🔴',
    bg: 'bg-red-500/20',
    border: 'border-red-500/40',
    text: 'text-red-400',
    label: 'red',
    labelAr: 'أحمر',
  },
  blue: {
    emoji: '🔵',
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/40',
    text: 'text-blue-400',
    label: 'blue',
    labelAr: 'أزرق',
  },
  green: {
    emoji: '🟢',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    label: 'green',
    labelAr: 'أخضر',
  },
  yellow: {
    emoji: '🟡',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    label: 'yellow',
    labelAr: 'أصفر',
  },
  purple: {
    emoji: '🟣',
    bg: 'bg-violet-500/20',
    border: 'border-violet-500/40',
    text: 'text-violet-400',
    label: 'purple',
    labelAr: 'بنفسجي',
  },
};

// Player display colors (for scoreboard, not card colors)
export const PLAYER_COLORS = [
  { color: 'text-violet-400', colorHex: '#a78bfa', emoji: '🟣', bg: 'bg-violet-950/40', border: 'border-violet-500/30' },
  { color: 'text-emerald-400', colorHex: '#34d399', emoji: '🟢', bg: 'bg-emerald-950/40', border: 'border-emerald-500/30' },
  { color: 'text-amber-400', colorHex: '#fbbf24', emoji: '🟡', bg: 'bg-amber-950/40', border: 'border-amber-500/30' },
  { color: 'text-rose-400', colorHex: '#fb7185', emoji: '🔴', bg: 'bg-rose-950/40', border: 'border-rose-500/30' },
  { color: 'text-cyan-400', colorHex: '#22d3ee', emoji: '🔵', bg: 'bg-cyan-950/40', border: 'border-cyan-500/30' },
  { color: 'text-orange-400', colorHex: '#fb923c', emoji: '🟠', bg: 'bg-orange-950/40', border: 'border-orange-500/30' },
  { color: 'text-pink-400', colorHex: '#f472b6', emoji: '💗', bg: 'bg-pink-950/40', border: 'border-pink-500/30' },
  { color: 'text-teal-400', colorHex: '#2dd4bf', emoji: '💠', bg: 'bg-teal-950/40', border: 'border-teal-500/30' },
];

// Target score options
export const TARGET_SCORE_OPTIONS = [50, 60, 70, 100];

// ============================================================
// Deck Generation
// ============================================================

export function generateDeck(): RiskCard[] {
  const cards: RiskCard[] = [];
  let idx = 0;

  // 45 number cards: numbers 1-9, each appearing 5 times (once per color)
  for (let num = 1; num <= 9; num++) {
    for (const color of CARD_COLORS) {
      cards.push({
        id: `card_${idx}`,
        type: 'number',
        number: num,
        color,
        revealed: false,
        index: idx,
        value: num,
      });
      idx++;
    }
  }

  // 5 special cards
  // 2x Bomb
  for (let i = 0; i < 2; i++) {
    cards.push({
      id: `card_${idx}`,
      type: 'bomb',
      number: 0,
      color: null,
      revealed: false,
      index: idx,
      value: 0,
    });
    idx++;
  }

  // 1x Skip
  cards.push({
    id: `card_${idx}`,
    type: 'skip',
    number: 0,
    color: null,
    revealed: false,
    index: idx,
    value: 0,
  });
  idx++;

  // 1x Double (×2)
  cards.push({
    id: `card_${idx}`,
    type: 'double',
    number: 0,
    color: null,
    revealed: false,
    index: idx,
    value: 0,
  });
  idx++;

  // 1x Triple (×3)
  cards.push({
    id: `card_${idx}`,
    type: 'triple',
    number: 0,
    color: null,
    revealed: false,
    index: idx,
    value: 0,
  });
  idx++;

  // Shuffle (Fisher-Yates)
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  // Re-index after shuffle
  cards.forEach((card, i) => {
    card.index = i;
    card.id = `card_${i}`;
  });

  return cards;
}

// ============================================================
// Matching Check
// ============================================================

// Check if a newly drawn card matches color or number with any previously drawn card
export function checkMatch(newCard: RiskCard, drawnCards: RiskCard[]): {
  matched: boolean;
  matchType: 'color' | 'number' | null;
  matchWith: RiskCard | null;
} {
  for (const drawn of drawnCards) {
    if (drawn.type !== 'number' || newCard.type !== 'number') continue;
    if (drawn.color === newCard.color) {
      return { matched: true, matchType: 'color', matchWith: drawn };
    }
    if (drawn.number === newCard.number) {
      return { matched: true, matchType: 'number', matchWith: drawn };
    }
  }
  return { matched: false, matchType: null, matchWith: null };
}

// ============================================================
// Card Stats
// ============================================================

export function getCardStats(cards: RiskCard[]) {
  const revealed = cards.filter(c => c.revealed);
  const hidden = cards.filter(c => !c.revealed);
  return {
    total: cards.length,
    revealed: revealed.length,
    hidden: hidden.length,
    numbers: hidden.filter(c => c.type === 'number').length,
    bombs: hidden.filter(c => c.type === 'bomb').length,
    skips: hidden.filter(c => c.type === 'skip').length,
    doubles: hidden.filter(c => c.type === 'double').length,
    triples: hidden.filter(c => c.type === 'triple').length,
  };
}

// ============================================================
// Grid columns (10 cols for 50 cards)
// ============================================================

export function getGridCols(totalCards: number): number {
  if (totalCards <= 25) return 5;
  if (totalCards <= 36) return 6;
  if (totalCards <= 49) return 7;
  return 5; // 50 cards → 10 rows × 5 cols
}

// ============================================================
// Card Info (for display in modals)
// ============================================================

export const CARD_INFO: Record<CardType, {
  emoji: string;
  label: string;
  desc: string;
  color: string;
}> = {
  number: { emoji: '🃏', label: 'رقم', desc: 'بطاقة رقم آمنة!', color: '#34d399' },
  bomb:   { emoji: '💣', label: 'قنبلة', desc: 'انفجار! خسرت كل رصيد الجولة!', color: '#ef4444' },
  skip:   { emoji: '⏭️', label: 'تخطي', desc: 'تم تخطي دورك!', color: '#94a3b8' },
  double: { emoji: '✨', label: 'دابل', desc: 'مضاعف النقاط ×٢!', color: '#f59e0b' },
  triple: { emoji: '🔥', label: 'تريبل', desc: 'مضاعف النقاط ×٣!', color: '#a855f7' },
};

// ============================================================
// Default player names
// ============================================================

export const DEFAULT_PLAYER_NAMES = ['لاعب ١', 'لاعب ٢', 'لاعب ٣', 'لاعب ٤', 'لاعب ٥', 'لاعب ٦', 'لاعب ٧', 'لاعب ٨'];
