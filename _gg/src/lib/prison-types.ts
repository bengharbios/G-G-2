// ============================================================
// السجن (The Prison) - Game Types & Data
// ============================================================

export type PrisonTeam = 'alpha' | 'beta';
export type PrisonGamePhase = 'landing' | 'setup' | 'playing' | 'game_over';

// ============================================================
// Cell Item Types
// ============================================================
export type CellItemType = 'open' | 'uniform' | 'skull' | 'key' | 'skip';

export interface CellItem {
  type: CellItemType;
  title: string;
  desc: string;
  img: string;
  color: string;
  label: string;
  emoji: string;
}

export const CELL_ITEMS: Record<CellItemType, CellItem> = {
  open: {
    type: 'open',
    title: 'زنزانة فارغة',
    desc: '🔓 تم حبس لاعب من الخصم!',
    img: '/img/prison/open.png',
    color: '#00c6ff',
    label: 'زنزانة فارغة',
    emoji: '🔓',
  },
  uniform: {
    type: 'uniform',
    title: 'ملابس السجن',
    desc: '🚫 ارتدي الملابس! تم سجنك!',
    img: '/img/prison/uniform.png',
    color: '#e74c3c',
    label: 'ملابس',
    emoji: '🏚️',
  },
  skull: {
    type: 'skull',
    title: 'إعــــدام',
    desc: '💀 خروج نهائي!',
    img: '/img/prison/skull.png',
    color: '#c0392b',
    label: 'إعدام',
    emoji: '💀',
  },
  key: {
    type: 'key',
    title: 'مفتـــاح',
    desc: '🔑 حرر سجين من فريقك!',
    img: '/img/prison/key.png',
    color: '#f1c40f',
    label: 'مفتاح',
    emoji: '🔑',
  },
  skip: {
    type: 'skip',
    title: 'زنزانة ممتلئة',
    desc: '✋ تخطي الدور!',
    img: '/img/prison/skip.png',
    color: '#95a5a6',
    label: 'ممتلئة',
    emoji: '✋',
  },
};

// ============================================================
// Grid Configurations
// ============================================================
export interface GridConfig {
  size: number;
  cols: number;
  types: Record<CellItemType, number>;
}

export const GRID_CONFIGS: Record<number, GridConfig> = {
  9: {
    size: 9,
    cols: 3,
    types: { open: 3, uniform: 2, skull: 1, key: 2, skip: 1 },
  },
  16: {
    size: 16,
    cols: 4,
    types: { open: 5, uniform: 4, skull: 2, key: 3, skip: 2 },
  },
  20: {
    size: 20,
    cols: 5,
    types: { open: 6, uniform: 5, skull: 3, key: 3, skip: 3 },
  },
};

// ============================================================
// Grid Cell (on the board)
// ============================================================
export interface GridCell {
  id: string;
  index: number;
  type: CellItemType;
  status: 'hidden' | 'revealed';
}

// ============================================================
// Player
// ============================================================
export interface PrisonPlayer {
  id: string;
  name: string;
  team: PrisonTeam;
  status: 'active' | 'imprisoned' | 'executed';
  uniformCount: number; // number of times imprisoned
}

// ============================================================
// Game Log
// ============================================================
export interface PrisonLogEntry {
  id: number;
  team: PrisonTeam;
  playerName: string;
  action: string;
  itemType: CellItemType;
  timestamp: number;
}

// ============================================================
// Interaction States
// ============================================================
export type InteractionState =
  | 'waiting_for_player'      // Waiting for current team to pick a player
  | 'waiting_for_cell'        // Player picked, waiting to choose a cell
  | 'showing_result'          // Showing what was revealed
  | 'picking_opponent_jail'   // open: choose opponent to imprison
  | 'picking_teammate_free'   // key: choose teammate to free
  | 'game_over';

// ============================================================
// Helper functions
// ============================================================
export function generateGrid(size: number): GridCell[] {
  const config = GRID_CONFIGS[size];
  if (!config) return [];

  let deck: CellItemType[] = [];
  for (const [type, count] of Object.entries(config.types)) {
    for (let i = 0; i < count; i++) {
      deck.push(type as CellItemType);
    }
  }

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck.map((type, index) => ({
    id: `cell_${index}`,
    index,
    type,
    status: 'hidden' as const,
  }));
}

export function getRemainingItems(grid: GridCell[]): Record<CellItemType, number> {
  const counts: Record<CellItemType, number> = { open: 0, uniform: 0, skull: 0, key: 0, skip: 0 };
  grid.forEach(cell => {
    if (cell.status === 'hidden') counts[cell.type]++;
  });
  return counts;
}

export function getActivePlayers(players: PrisonPlayer[], team: PrisonTeam): PrisonPlayer[] {
  return players.filter(p => p.team === team && p.status === 'active');
}

export function getImprisonedPlayers(players: PrisonPlayer[], team: PrisonTeam): PrisonPlayer[] {
  return players.filter(p => p.team === team && p.status === 'imprisoned');
}

export function getTeamAliveCount(players: PrisonPlayer[], team: PrisonTeam): number {
  return players.filter(p => p.team === team && p.status !== 'executed').length;
}

export function checkGameEnd(players: PrisonPlayer[], grid: GridCell[]): { ended: boolean; winner: PrisonTeam | 'draw' | null; reason: string } {
  const alphaActive = players.filter(p => p.team === 'alpha' && p.status === 'active').length;
  const betaActive = players.filter(p => p.team === 'beta' && p.status === 'active').length;

  // A team loses if ALL its players are either executed OR imprisoned (no one can play)
  if (alphaActive === 0 && betaActive > 0) return { ended: true, winner: 'beta', reason: 'تم سجن/إعدام جميع لاعبي فريق أ' };
  if (betaActive === 0 && alphaActive > 0) return { ended: true, winner: 'alpha', reason: 'تم سجن/إعدام جميع لاعبي فريق ب' };
  if (alphaActive === 0 && betaActive === 0) return { ended: true, winner: 'draw', reason: 'تم سجن/إعدام لاعبي الفريقين!' };

  // All cells revealed
  const allRevealed = grid.every(c => c.status === 'revealed');
  if (allRevealed) {
    if (alphaActive > betaActive) return { ended: true, winner: 'alpha', reason: 'فريق أ لديه لاعبين أحرار أكثر' };
    if (betaActive > alphaActive) return { ended: true, winner: 'beta', reason: 'فريق ب لديه لاعبين أحرار أكثر' };
    return { ended: true, winner: 'draw', reason: 'تعادل! عدد اللاعبين الأحرار متساوٍ' };
  }

  return { ended: false, winner: null, reason: '' };
}
