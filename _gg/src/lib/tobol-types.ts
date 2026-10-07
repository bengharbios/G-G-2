// ============================================================
// طبول الحرب (War Drums / Tobol) - Game Types & Data
// Exact copy from original source
// ============================================================

export type Team = 'red' | 'blue';
export type GamePhase = 'landing' | 'setup' | 'playing' | 'game_over';

// ============================================================
// 64 Weapon Cards - exact armsArray from original
// Each card: [imgName, attack, trap]
// attack > 0 damages opponent
// trap > 0 damages current team (self)
// ============================================================

export interface WeaponCard {
  id: number;
  imgName: string;  // filename like "01.png"
  attack: number;   // damage to opponent if > 0
  trap: number;     // damage to self if > 0
}

const ARMS_ARRAY: [string, number, number][] = [
  ["01.png", 35, 0], ["02.png", 18, 0], ["03.png", 20, 0], ["04.png", 11, 0], ["05.png", 6, 0],
  ["06.png", 9, 0], ["07.png", 8, 0], ["08.png", 10, 0], ["09.png", 0, 0], ["10.png", 0, 7],
  ["11.png", 6, 0], ["12.png", 1, 0], ["13.png", 0, 4], ["14.png", 7, 0], ["15.png", 9, 0],
  ["16.png", 0, 6], ["17.png", 3, 0], ["18.png", 16, 0], ["19.png", 10, 0], ["20.png", 15, 0],
  ["21.png", 16, 0], ["22.png", 14, 0], ["23.png", 6, 0], ["24.png", 4, 0], ["25.png", 5, 0],
  ["26.png", 0, 25], ["27.png", 0, 0], ["28.png", 0, 0], ["29.png", 22, 0], ["30.png", 0, 15],
  ["31.png", 2, 0], ["32.png", 9, 0], ["33.png", 0, 2], ["34.png", 13, 0], ["35.png", 25, 0],
  ["36.png", 0, 10], ["37.png", 3, 0], ["38.png", 0, 8], ["39.png", 0, 1], ["40.png", 19, 0],
  ["41.png", 0, 7], ["42.png", 0, 4], ["43.png", 6, 0], ["44.png", 0, 10], ["45.png", 0, 0],
  ["46.png", 0, 6], ["47.png", 0, 9], ["48.png", 0, 3], ["49.png", 0, 4], ["50.png", 2, 0],
  ["51.png", 0, 6], ["52.png", 4, 0], ["53.png", 3, 0], ["54.png", 2, 0], ["55.png", 3, 0],
  ["56.png", 0, 9], ["57.png", 6, 0], ["58.png", 0, 4], ["59.png", 7, 0], ["60.png", 0, 1],
  ["61.png", 0, 6], ["62.png", 9, 0], ["63.png", 0, 0], ["64.png", 7, 0]
];

export const WEAPON_CARDS: WeaponCard[] = ARMS_ARRAY.map((entry, index) => ({
  id: index + 1,
  imgName: entry[0],
  attack: entry[1],
  trap: entry[2],
}));

// ============================================================
// Board Buttons - exact layout from original
// ============================================================

export interface BoardButton {
  id: string;
  icon: string;   // filename without .png, used as /images/{icon}.png
  color: string;  // CSS class: btn-red, btn-blue, etc.
}

export const RIGHT_COL1: BoardButton[] = [
  { id: 'btn1', icon: 'butterfly', color: 'btn-red' },
  { id: 'btn2', icon: 'pigeon', color: 'btn-red' },
  { id: 'btn3', icon: 'fish', color: 'btn-red' },
  { id: 'btn4', icon: 'giraffe', color: 'btn-red' },
  { id: 'btn5', icon: 'elephant', color: 'btn-pink' },
  { id: 'btn6', icon: 'deer', color: 'btn-pink' },
  { id: 'btn7', icon: 'camel', color: 'btn-pink' }
];

export const RIGHT_COL2: BoardButton[] = [
  { id: 'btn8', icon: 'donkey', color: 'btn-red' },
  { id: 'btn9', icon: 'duck', color: 'btn-red' },
  { id: 'btn10', icon: 'frog', color: 'btn-red' },
  { id: 'btn11', icon: 'lion', color: 'btn-pink' },
  { id: 'btn12', icon: 'mouse', color: 'btn-pink' },
  { id: 'btn13', icon: 'scorbion', color: 'btn-pink' },
  { id: 'btn14', icon: 'snail', color: 'btn-pink' }
];

export const LEFT_COL1: BoardButton[] = [
  { id: 'btn15', icon: 'magnifier', color: 'btn-blue' },
  { id: 'btn16', icon: 'camera', color: 'btn-blue' },
  { id: 'btn17', icon: 'cressent', color: 'btn-blue' },
  { id: 'btn18', icon: 'eye', color: 'btn-sky' },
  { id: 'btn19', icon: 'heart', color: 'btn-sky' },
  { id: 'btn20', icon: 'house', color: 'btn-sky' },
  { id: 'btn21', icon: 'key', color: 'btn-sky' }
];

export const LEFT_COL2: BoardButton[] = [
  { id: 'btn22', icon: 'lamp', color: 'btn-blue' },
  { id: 'btn23', icon: 'music', color: 'btn-blue' },
  { id: 'btn24', icon: 'message', color: 'btn-blue' },
  { id: 'btn25', icon: 'star', color: 'btn-blue' },
  { id: 'btn26', icon: 'plane', color: 'btn-sky' },
  { id: 'btn27', icon: 'phone', color: 'btn-sky' },
  { id: 'btn28', icon: 'pencil', color: 'btn-sky' }
];

export const BOTTOM_ROW1: BoardButton[] = [
  { id: 'btn29', icon: 'cow', color: 'btn-purple' },
  { id: 'btn30', icon: 'rabbit', color: 'btn-purple' },
  { id: 'btn31', icon: '1', color: 'btn-yellow' },
  { id: 'btn32', icon: '2', color: 'btn-yellow' },
  { id: 'btn33', icon: '3', color: 'btn-green' },
  { id: 'btn34', icon: '4', color: 'btn-green' },
  { id: 'btn35', icon: '5', color: 'btn-orange' },
  { id: 'btn40', icon: '6', color: 'btn-orange' },
  { id: 'btn36', icon: 'bomb', color: 'btn-teal' },
  { id: 'btn37', icon: 'case', color: 'btn-teal' }
];

export const BOTTOM_ROW2: BoardButton[] = [
  { id: 'btn38', icon: 'roaster', color: 'btn-purple' },
  { id: 'btn39', icon: 'snake', color: 'btn-purple' },
  { id: 'btn41', icon: '7', color: 'btn-yellow' },
  { id: 'btn42', icon: '8', color: 'btn-yellow' },
  { id: 'btn43', icon: '9', color: 'btn-green' },
  { id: 'btn44', icon: '10', color: 'btn-green' },
  { id: 'btn49', icon: '11', color: 'btn-orange' },
  { id: 'btn50', icon: '12', color: 'btn-orange' },
  { id: 'btn45', icon: 'feather', color: 'btn-teal' },
  { id: 'btn46', icon: 'lock', color: 'btn-teal' }
];

export const BOTTOM_ROW3: BoardButton[] = [
  { id: 'btn47', icon: 'sparrow', color: 'btn-purple' },
  { id: 'btn48', icon: 'turtle', color: 'btn-purple' },
  { id: 'btn51', icon: '13', color: 'btn-yellow' },
  { id: 'btn52', icon: '14', color: 'btn-yellow' },
  { id: 'btn53', icon: '15', color: 'btn-green' },
  { id: 'btn58', icon: '16', color: 'btn-green' },
  { id: 'btn59', icon: '17', color: 'btn-orange' },
  { id: 'btn60', icon: '18', color: 'btn-orange' },
  { id: 'btn54', icon: 'magnet', color: 'btn-teal' },
  { id: 'btn55', icon: 'globe', color: 'btn-teal' }
];

// All buttons combined in original order
export const ALL_BUTTONS: BoardButton[] = [
  ...RIGHT_COL1, ...RIGHT_COL2,
  ...LEFT_COL1, ...LEFT_COL2,
  ...BOTTOM_ROW1, ...BOTTOM_ROW2, ...BOTTOM_ROW3,
];

// Image base paths
export const IMG_BASE = '/img/tobol-icons/';
export const CARD_BASE = '/img/war/war_wpn_images/';
export const VS_BASE = '/img/random/vs/';
export const RANDOM_BASE = '/img/random/';

// ============================================================
// Battle Log Entry (simplified)
// ============================================================
export interface BattleLogEntry {
  id: number;
  team: Team;
  message: string;
  valueChange: number;
}
