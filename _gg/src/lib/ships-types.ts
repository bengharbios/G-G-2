// ════════════════════════════════════════════════════════════════════════
// سفن (Battleship / Ships) — Game Types
// Classic Battleship: place 5 ships on a 10×10 grid, then attack
// opponent's grid. Hit/miss. First to sink all opponent ships wins.
// ════════════════════════════════════════════════════════════════════════

export type GamePhase = 'landing' | 'setup' | 'placing' | 'attacking' | 'game_over' | 'pass_phone' | 'show_message';
export type PlayMode = 'ai' | 'teams' | 'watch';
export type Team = 'team1' | 'team2';
export type MessageType = 'explosion' | 'win' | 'sunk' | null;
export type GameMode = 'classic' | 'diwaniya';

export type Difficulty = 'easy' | 'medium' | 'hard';

// Ship types (5 per player)
export interface ShipType {
  id: string;
  name: string;       // Arabic name
  nameEn: string;
  length: number;     // number of cells the ship occupies
}

// Theme 1 (بحري — Navy)
export const SHIP_TYPES_THEME_1: ShipType[] = [
  { id: 'carrier',    name: 'حاملة الطائرات', nameEn: 'Carrier',     length: 5 },
  { id: 'submarine',  name: 'الغواصة',        nameEn: 'Submarine',   length: 4 },
  { id: 'destroyer',  name: 'المدمرة',        nameEn: 'Destroyer',   length: 3 },
  { id: 'battleship', name: 'البارجة',        nameEn: 'Battleship',  length: 3 },
  { id: 'patrol',     name: 'الزورق',          nameEn: 'Patrol Boat', length: 2 },
];

// Theme 2 (جوي — Air)
export const SHIP_TYPES_THEME_2: ShipType[] = [
  { id: 'fighter',    name: 'المقاتلة',       nameEn: 'Fighter',     length: 4 },
  { id: 'helicopter', name: 'المروحية',       nameEn: 'Helicopter',  length: 3 },
  { id: 'tank',       name: 'الدبابة',        nameEn: 'Tank',        length: 3 },
  { id: 'camp',       name: 'المعسكر',        nameEn: 'Camp',        length: 3 },
  { id: 'armored',    name: 'المصفحة',        nameEn: 'Armored',     length: 2 },
];

export const DIFFICULTY_CONFIG: Record<Difficulty, {
  label: string;
  scorePerHit: number;
  penaltyPerMiss: number;
}> = {
  easy:   { label: 'سهل',   scorePerHit: 100,  penaltyPerMiss: 5 },
  medium: { label: 'متوسط', scorePerHit: 150,  penaltyPerMiss: 10 },
  hard:   { label: 'صعب',   scorePerHit: 250,  penaltyPerMiss: 20 },
};

export interface RoundCountOption {
  value: number;
  label: string;
}

export const ROUND_COUNT_OPTIONS: RoundCountOption[] = [
  { value: 1, label: 'جولة واحدة' },
  { value: 3, label: '3 جولات' },
  { value: 5, label: '5 جولات' },
];

export interface GameLogEntry {
  round: number;
  message: string;
  type: 'info' | 'success' | 'danger' | 'system';
  timestamp: number;
}

// Grid cell state
export type CellState = 'empty' | 'ship' | 'hit' | 'miss';

export interface GridCell {
  row: number;
  col: number;
  state: CellState;
  shipId?: string;       // which ship occupies this cell
  shipModelNum?: number;  // 1-5 (for image URL)
  shipOrientation?: 'horizontal' | 'vertical';
  shipSegment?: number;   // 1-N (position within the ship for image segment)
}

// A placed ship on the grid
export interface PlacedShip {
  shipTypeId: string;
  row: number;
  col: number;
  orientation: 'horizontal' | 'vertical';
  cells: Array<{ row: number; col: number }>;  // occupied cells
  hits: number;  // how many cells of this ship have been hit
  sunk: boolean;
}

// A single round
export interface ShipsRound {
  id: string;
  title: string;
  themeId: number;           // 1 (navy) or 2 (air)
  playerGrid: GridCell[][];   // 10×10 grid — player's ships
  aiGrid: GridCell[][];       // 10×10 grid — AI's ships (hidden from player)
  playerShips: PlacedShip[];
  aiShips: PlacedShip[];
  currentTurn: 'player' | 'ai';
  playerScore: number;
  aiScore: number;
  playerHits: number;
  playerMisses: number;
  aiHits: number;
  aiMisses: number;
}

export const FLASHI_CATEGORY_LABELS: Record<string, string> = {
  random: 'عشوائي',
};

export const FLASHI_HIT_RADIUS_VMIN = 5.5;

export const GRID_SIZE = 10;  // 10×10 grid
