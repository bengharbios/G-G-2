// ============================================================
// المجازفة 2 (Risk 2) - Types & Constants
// ============================================================

export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple';
export type CardType = 'number' | 'bomb' | 'skip' | 'double' | 'triple';
export type Risk2GamePhase = 'landing' | 'setup' | 'playing' | 'game_over';
export type Risk2TurnState =
  | 'waiting_for_draw'       // Current player should pick a card
  | 'waiting_for_decision'   // Safe card drawn: continue or bank
  | 'showing_result'         // Showing effect (skip, double, triple, bomb)
  | 'turn_lost'              // Matched color/number: lost all round points
  | 'bomb_exploded';         // Bomb animation playing

// ============================================================
// Card
// ============================================================
export interface Risk2Card {
  id: string;
  type: CardType;
  number: number;          // 1-9 for number cards, 0 for special
  color: CardColor | null; // null for special cards
  revealed: boolean;
  index: number;
}

// ============================================================
// Player
// ============================================================
export interface Risk2Player {
  id: string;
  name: string;
  score: number;
  roundScore: number;
  multiplier: number;      // 1, 2, or 3
  joinOrder: number;       // Order of joining
}

// ============================================================
// Log Entry
// ============================================================
export interface Risk2LogEntry {
  id: number;
  playerName: string;
  action: string;
  cardType: CardType;
  timestamp: number;
}

// ============================================================
// Game Config
// ============================================================
export interface Risk2GameConfig {
  targetScore: number;
  bombCount: number;
  skipCount: number;
  doubleCount: number;
  tripleCount: number;
}

// ============================================================
// Match Result
// ============================================================
export interface MatchResult {
  matched: boolean;
  reason: string;
  matchCard: Risk2Card | null;
}

// ============================================================
// Color Config (for number cards)
// ============================================================
export const CARD_COLORS: Record<CardColor, { bg: string; border: string; text: string; label: string; emoji: string; hex: string }> = {
  red:    { bg: 'bg-red-500/15',     border: 'border-red-500/40',     text: 'text-red-400',     label: 'أحمر',     emoji: '🔴', hex: '#ef4444' },
  blue:   { bg: 'bg-blue-500/15',    border: 'border-blue-500/40',    text: 'text-blue-400',    label: 'أزرق',     emoji: '🔵', hex: '#3b82f6' },
  green:  { bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-400', label: 'أخضر',     emoji: '🟢', hex: '#10b981' },
  yellow: { bg: 'bg-amber-500/15',   border: 'border-amber-500/40',   text: 'text-amber-400',   label: 'أصفر',     emoji: '🟡', hex: '#f59e0b' },
  purple: { bg: 'bg-violet-500/15',  border: 'border-violet-500/40',  text: 'text-violet-400',  label: 'بنفسجي',  emoji: '🟣', hex: '#8b5cf6' },
};

// ============================================================
// Special Card Info
// ============================================================
export const SPECIAL_CARD_INFO: Record<string, { emoji: string; label: string; desc: string; color: string; bg: string; border: string }> = {
  bomb:   { emoji: '💣', label: 'قنبلة',       desc: 'انفجار! خسرت كل رصيد الجولة!',     color: '#ef4444', bg: 'from-red-900/40 to-red-950/60', border: 'border-red-500/40' },
  skip:   { emoji: '⏭️', label: 'تخطي',        desc: 'تم تخطي دورك! خسرت رصيد الجولة!',        color: '#94a3b8', bg: 'from-slate-800/60 to-slate-900/60', border: 'border-slate-600/40' },
  double: { emoji: '✨', label: '×2 مضاعف',     desc: 'رصيد الجولة × 2! يمكنك المتابعة أو الحفظ', color: '#fcd34d', bg: 'from-yellow-600/50 to-amber-700/60', border: 'border-yellow-400/60' },
  triple: { emoji: '🔥', label: '×3 ثلاثي', desc: 'رصيد الجولة × 3! يمكنك المتابعة أو الحفظ', color: '#fbbf24', bg: 'from-amber-500/50 to-yellow-600/60', border: 'border-amber-400/60' },
};

// ============================================================
// Target Score Options
// ============================================================
export const TARGET_SCORE_OPTIONS = [50, 60, 70, 100];

// ============================================================
// Default config
// ============================================================
export const DEFAULT_CONFIG: Risk2GameConfig = {
  targetScore: 50,
  bombCount: 2,
  skipCount: 1,
  doubleCount: 1,
  tripleCount: 1,
};

// ============================================================
// Generate deck with configurable special card counts
// ============================================================
export function generateDeck(config?: Partial<Risk2GameConfig>): Risk2Card[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const cards: Risk2Card[] = [];
  let idx = 0;
  const colors: CardColor[] = ['red', 'blue', 'green', 'yellow', 'purple'];

  // Number cards: 1-9 × 5 colors = 45 always
  for (const color of colors) {
    for (let num = 1; num <= 9; num++) {
      cards.push({
        id: `card_${idx}`,
        type: 'number',
        number: num,
        color,
        revealed: false,
        index: idx,
      });
      idx++;
    }
  }

  // Special cards based on config
  for (let i = 0; i < cfg.bombCount; i++) {
    cards.push({ id: `card_${idx}`, type: 'bomb', number: 0, color: null, revealed: false, index: idx }); idx++;
  }
  for (let i = 0; i < cfg.skipCount; i++) {
    cards.push({ id: `card_${idx}`, type: 'skip', number: 0, color: null, revealed: false, index: idx }); idx++;
  }
  for (let i = 0; i < cfg.doubleCount; i++) {
    cards.push({ id: `card_${idx}`, type: 'double', number: 0, color: null, revealed: false, index: idx }); idx++;
  }
  for (let i = 0; i < cfg.tripleCount; i++) {
    cards.push({ id: `card_${idx}`, type: 'triple', number: 0, color: null, revealed: false, index: idx }); idx++;
  }

  // Fisher-Yates shuffle
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
// Check if a drawn card matches any previously drawn card this turn
// Rule: Same NUMBER (different color) = LOSS. Same COLOR = OK (continue).
// Multiplier/special cards are excluded from matching.
// ============================================================
export function checkMatch(newCard: Risk2Card, drawnCards: Risk2Card[]): MatchResult {
  if (newCard.type !== 'number') return { matched: false, reason: '', matchCard: null };

  for (const existing of drawnCards) {
    if (existing.type !== 'number') continue;

    // Same NUMBER → LOSS (regardless of color)
    if (existing.number === newCard.number) {
      return {
        matched: true,
        reason: `نفس الرقم! (${newCard.number}) ${CARD_COLORS[existing.color!].emoji} = ${CARD_COLORS[newCard.color!].emoji}`,
        matchCard: existing,
      };
    }
  }

  return { matched: false, reason: '', matchCard: null };
}

// ============================================================
// Get remaining card stats
// ============================================================
export function getCardStats(cards: Risk2Card[]) {
  const hidden = cards.filter(c => !c.revealed);
  return {
    total: cards.length,
    revealed: cards.filter(c => c.revealed).length,
    hidden: hidden.length,
    bombs: hidden.filter(c => c.type === 'bomb').length,
    skips: hidden.filter(c => c.type === 'skip').length,
    doubles: hidden.filter(c => c.type === 'double').length,
    triples: hidden.filter(c => c.type === 'triple').length,
    numbers: hidden.filter(c => c.type === 'number').length,
  };
}

// ============================================================
// Grid columns (5 cols for 50 cards)
// ============================================================
export function getGridCols(totalCards: number): number {
  if (totalCards <= 30) return 5;
  return 5;
}
