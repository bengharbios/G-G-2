// ============================================================
// طبول الحرب (Tobol) - Room Store using Turso (NOT in-memory)
// Uses the Room table with gameType='tobol' and stateJson
// ============================================================

import * as turso from './turso';

export interface SpectatorInfo {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
}

export interface PlayerInfo {
  id: string;
  name: string;
  team: 'red' | 'blue';
  joinedAt: number;
  lastSeen: number;
}

export interface PendingAction {
  id: string;
  playerId: string;
  playerName: string;
  team: 'red' | 'blue';
  btnId: string;
  timestamp: number;
}

export interface TobolRoomState {
  code: string;
  hostName: string;
  createdAt: number;
  hostLastSeen: number;
  redName: string;
  blueName: string;
  redScore: number;
  blueScore: number;
  currentTurn: 'red' | 'blue';
  clickedBtns: string[];
  lastAction: string | null;
  battleLog: Array<{ id: number; team: string; message: string; valueChange: number }>;
  modalData: { cardImg: string; points: number; team: string } | null;
  mainBgId: number;
  phase: string;
  spectators: SpectatorInfo[];
  players: PlayerInfo[];
  shuffledCards: [string, number, number][];
  pendingAction: PendingAction | null;
  processedActionIds: string[];
}

const ROOM_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================
// Helpers
// ============================================================

function packState(state: Partial<TobolRoomState>): string {
  return JSON.stringify(state);
}

function unpackState(json: string): Partial<TobolRoomState> {
  try { return JSON.parse(json); } catch { return {}; }
}

// ============================================================
// Room CRUD (async — Turso)
// ============================================================

export async function createTobolRoom(code: string, hostName: string): Promise<TobolRoomState> {
  const now = Date.now();
  const state: TobolRoomState = {
    code,
    hostName,
    createdAt: now,
    hostLastSeen: now,
    redName: 'الجيش الأحمر',
    blueName: 'الجيش الأزرق',
    redScore: 350,
    blueScore: 350,
    currentTurn: 'red',
    clickedBtns: [],
    lastAction: null,
    battleLog: [],
    modalData: null,
    mainBgId: 1,
    phase: 'playing',
    spectators: [],
    players: [],
    shuffledCards: [],
    pendingAction: null,
    processedActionIds: [],
  };

  await turso.createRoom({
    id: `tobol_${code}`,
    code,
    hostName,
    playerCount: 0,
    phase: 'playing',
    stateJson: packState(state),
    gameType: 'tobol',
  });

  return state;
}

export async function getTobolRoom(code: string): Promise<TobolRoomState | null> {
  const room = await turso.getRoomByCode(code);
  if (!room || room.gameType !== 'tobol') return null;

  // Skip soft-deleted rooms
  if (room.phase === 'deleted') return null;

  // Room expires after 5 minutes without heartbeat
  const lastSeen = new Date(room.hostLastSeen).getTime();
  if (Date.now() - lastSeen > ROOM_TTL_MS) {
    await deleteTobolRoom(code);
    return null;
  }

  const state = unpackState(room.stateJson) as TobolRoomState;

  // Clean stale spectators
  if (state.spectators) {
    state.spectators = state.spectators.filter(s => Date.now() - s.lastSeen < 30000);
  }

  return state;
}

export async function updateTobolRoom(code: string, data: Partial<TobolRoomState>): Promise<TobolRoomState | null> {
  const existing = await getTobolRoom(code);
  if (!existing) return null;

  const merged: TobolRoomState = { ...existing, ...data, hostLastSeen: Date.now() };
  await turso.updateRoom(code, {
    stateJson: packState(merged),
    hostLastSeen: new Date().toISOString(),
    phase: merged.phase,
  });

  return merged;
}

export async function heartbeatTobolRoom(code: string): Promise<boolean> {
  const room = await turso.getRoomByCode(code);
  if (!room || room.gameType !== 'tobol') return false;

  await turso.updateRoom(code, { hostLastSeen: new Date().toISOString() });
  return true;
}

export async function deleteTobolRoom(code: string): Promise<boolean> {
  try {
    const room = await turso.getRoomByCode(code);
    if (!room || room.gameType !== 'tobol') return false;

    await turso.updateRoom(code, { phase: 'deleted', stateJson: '{}' });
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Spectator management
// ============================================================

export async function addSpectator(code: string, name: string): Promise<TobolRoomState | null> {
  const room = await getTobolRoom(code);
  if (!room) return null;

  const id = `spec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  room.spectators = room.spectators.filter(s => s.name !== name);
  room.spectators.push({ id, name, joinedAt: Date.now(), lastSeen: Date.now() });

  return updateTobolRoom(code, { spectators: room.spectators });
}

export async function heartbeatSpectator(code: string, spectatorId: string): Promise<boolean> {
  const room = await getTobolRoom(code);
  if (!room) return false;

  const spec = room.spectators.find(s => s.id === spectatorId);
  if (!spec) return false;
  spec.lastSeen = Date.now();

  await updateTobolRoom(code, { spectators: room.spectators });
  return true;
}

// ============================================================
// Player management (join as player, not just spectator)
// ============================================================

export async function addPlayer(code: string, name: string, team: 'red' | 'blue'): Promise<TobolRoomState | null> {
  const room = await getTobolRoom(code);
  if (!room) return null;

  const id = `player_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  room.players = room.players.filter(p => p.name !== name);
  room.players.push({ id, name, team, joinedAt: Date.now(), lastSeen: Date.now() });

  return updateTobolRoom(code, { players: room.players });
}

export async function heartbeatPlayer(code: string, playerId: string): Promise<boolean> {
  const room = await getTobolRoom(code);
  if (!room) return false;

  const player = room.players.find(p => p.id === playerId);
  if (!player) return false;
  player.lastSeen = Date.now();

  await updateTobolRoom(code, { players: room.players });
  return true;
}

export async function removePlayer(code: string, playerId: string): Promise<boolean> {
  const room = await getTobolRoom(code);
  if (!room) return false;

  const idx = room.players.findIndex(p => p.id === playerId);
  if (idx === -1) return false;
  room.players.splice(idx, 1);

  await updateTobolRoom(code, { players: room.players });
  return true;
}

// ============================================================
// Server-side game action processing
// ============================================================

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function submitAction(code: string, playerId: string, btnId: string): Promise<{ success: boolean; error?: string; room?: TobolRoomState }> {
  const room = await getTobolRoom(code);
  if (!room) return { success: false, error: 'الغرفة غير موجودة' };
  if (room.phase !== 'playing') return { success: false, error: 'اللعبة غير جارية' };

  // Find player
  const player = room.players.find(p => p.id === playerId);
  if (!player) return { success: false, error: 'اللاعب غير موجود' };

  // Validate turn
  if (player.team !== room.currentTurn) return { success: false, error: 'ليس دور فريقك' };

  // Check if button already clicked
  if (room.clickedBtns.includes(btnId)) return { success: false, error: 'هذا الزر تم ضغطه' };

  // Check if modal is showing (previous card not closed)
  if (room.modalData) return { success: false, error: 'بانتظار إغلاق البطاقة' };

  // Ensure shuffledCards exist (initialize if not)
  let cards = room.shuffledCards;
  if (!cards || cards.length === 0) {
    // Import WEAPON_CARDS dynamically
    const { WEAPON_CARDS } = await import('./tobol-types');
    cards = shuffleArray(WEAPON_CARDS.map((c: { imgName: string; attack: number; trap: number }) => [c.imgName, c.attack, c.trap]));
    room.shuffledCards = cards;
  }

  // Process action (same logic as handleButtonClick in tobol-store.ts)
  const newClicked = [...room.clickedBtns, btnId];
  const cardData = cards[newClicked.length % cards.length];
  if (!cardData) return { success: false, error: 'خطأ في البطاقات' };

  const [imgName, attack, trap] = cardData;
  const opponent: 'red' | 'blue' = room.currentTurn === 'red' ? 'blue' : 'red';
  let addedPoints = 0;
  let newRedScore = room.redScore;
  let newBlueScore = room.blueScore;

  if (attack > 0) {
    addedPoints = attack;
    if (room.currentTurn === 'red') {
      newBlueScore = Math.max(0, room.blueScore - attack);
    } else {
      newRedScore = Math.max(0, room.redScore - attack);
    }
  } else if (trap > 0) {
    addedPoints = trap;
    if (room.currentTurn === 'red') {
      newRedScore = Math.max(0, room.redScore - trap);
    } else {
      newBlueScore = Math.max(0, room.blueScore - trap);
    }
  }

  const teamName = room.currentTurn === 'red' ? room.redName : room.blueName;
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

  const newLogEntry = {
    id: (room.battleLog.length) + 1,
    team: room.currentTurn,
    message: logMsg,
    valueChange: attack > 0 ? -attack : trap > 0 ? -trap : 0,
  };

  // Check end conditions
  const allButtonsClicked = newClicked.length >= 60;
  const teamEliminated = newRedScore <= 0 || newBlueScore <= 0;
  const shouldEndGame = allButtonsClicked || teamEliminated;

  const updateData: Partial<TobolRoomState> = {
    redScore: newRedScore,
    blueScore: newBlueScore,
    clickedBtns: newClicked,
    modalData: {
      cardImg: `/img/war/war_wpn_images/${imgName}`,
      points: addedPoints,
      team: room.currentTurn,
    },
    battleLog: [...room.battleLog, newLogEntry],
    lastAction: actionNotif,
    currentTurn: opponent,
    shuffledCards: cards,
    pendingAction: null,
    processedActionIds: [...(room.processedActionIds || []), `action_${Date.now()}`],
  };

  if (shouldEndGame) {
    updateData.phase = 'game_over';
  }

  const updated = await updateTobolRoom(code, updateData);
  if (!updated) return { success: false, error: 'فشل تحديث الغرفة' };

  return { success: true, room: updated };
}

export async function clearModal(code: string): Promise<TobolRoomState | null> {
  const room = await getTobolRoom(code);
  if (!room) return null;

  // If modal is showing and game should end, set game_over
  if (room.modalData && room.phase === 'playing') {
    const allButtonsClicked = room.clickedBtns.length >= 60;
    const teamEliminated = room.redScore <= 0 || room.blueScore <= 0;
    if (allButtonsClicked || teamEliminated) {
      return updateTobolRoom(code, { modalData: null, phase: 'game_over' });
    }
  }

  return updateTobolRoom(code, { modalData: null });
}

export async function removeSpectator(code: string, spectatorId: string): Promise<boolean> {
  const room = await getTobolRoom(code);
  if (!room) return false;

  const idx = room.spectators.findIndex(s => s.id === spectatorId);
  if (idx === -1) return false;
  room.spectators.splice(idx, 1);

  await updateTobolRoom(code, { spectators: room.spectators });
  return true;
}
