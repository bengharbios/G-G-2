// ============================================================
// السجن (The Prison) - Room Store using Turso (NOT in-memory)
// Uses the Room table with gameType='prison' and stateJson
// ============================================================

import * as turso from './turso';

export interface SpectatorInfo {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
}

export interface PrisonRoomState {
  code: string;
  hostName: string;
  createdAt: number;
  hostLastSeen: number;
  alphaName: string;
  betaName: string;
  currentTeam: 'alpha' | 'beta';
  players: Array<{
    id: string;
    name: string;
    team: string;
    status: string;
    uniformCount: number;
  }>;
  gridSize: number;
  grid: Array<{
    id: string;
    index: number;
    type: string;
    status: string;
  }>;
  interactionState: string;
  revealedCell: {
    id: string;
    index: number;
    type: string;
    status: string;
  } | null;
  selectedTargetId: string | null;
  currentPlayerId: string | null;
  gameLog: Array<{
    id: number;
    team: string;
    playerName: string;
    action: string;
    itemType: string;
    timestamp: number;
  }>;
  winner: string | null;
  winReason: string;
  phase: string;
  spectators: SpectatorInfo[];
}

const ROOM_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================
// Serialize / Deserialize state to/from stateJson
// ============================================================

function packState(state: Partial<PrisonRoomState>): string {
  return JSON.stringify(state);
}

function unpackState(json: string): Partial<PrisonRoomState> {
  try { return JSON.parse(json); } catch { return {}; }
}

// ============================================================
// Room CRUD (async — Turso)
// ============================================================

export async function createPrisonRoom(code: string, hostName: string): Promise<PrisonRoomState> {
  const now = Date.now();
  const state: PrisonRoomState = {
    code,
    hostName,
    createdAt: now,
    hostLastSeen: now,
    alphaName: 'فريق أ',
    betaName: 'فريق ب',
    currentTeam: 'alpha',
    players: [],
    gridSize: 16,
    grid: [],
    interactionState: 'waiting_for_player',
    revealedCell: null,
    selectedTargetId: null,
    currentPlayerId: null,
    gameLog: [],
    winner: null,
    winReason: '',
    phase: 'playing',
    spectators: [],
  };

  await turso.createRoom({
    id: `prison_${code}`,
    code,
    hostName,
    playerCount: 0,
    phase: 'playing',
    stateJson: packState(state),
    gameType: 'prison',
  });

  return state;
}

export async function getPrisonRoom(code: string): Promise<PrisonRoomState | null> {
  const room = await turso.getRoomByCode(code);
  if (!room || room.gameType !== 'prison') return null;

  // Room expires after 5 minutes without heartbeat
  const lastSeen = new Date(room.hostLastSeen).getTime();
  if (Date.now() - lastSeen > ROOM_TTL_MS) {
    await deletePrisonRoom(code);
    return null;
  }

  const state = unpackState(room.stateJson) as PrisonRoomState;

  // Clean stale spectators (not seen for 30 seconds)
  if (state.spectators) {
    state.spectators = state.spectators.filter(s => Date.now() - s.lastSeen < 30000);
  }

  return state;
}

export async function updatePrisonRoom(code: string, data: Partial<PrisonRoomState>): Promise<PrisonRoomState | null> {
  const existing = await getPrisonRoom(code);
  if (!existing) return null;

  const merged: PrisonRoomState = { ...existing, ...data, hostLastSeen: Date.now() };
  await turso.updateRoom(code, {
    stateJson: packState(merged),
    hostLastSeen: new Date().toISOString(),
    phase: merged.phase,
    ...(merged.winner ? { gameWinner: merged.winner } : {}),
  });

  return merged;
}

export async function heartbeatPrisonRoom(code: string): Promise<boolean> {
  const room = await turso.getRoomByCode(code);
  if (!room || room.gameType !== 'prison') return false;

  await turso.updateRoom(code, { hostLastSeen: new Date().toISOString() });
  return true;
}

export async function deletePrisonRoom(code: string): Promise<boolean> {
  try {
    const room = await turso.getRoomByCode(code);
    if (!room || room.gameType !== 'prison') return false;

    // Delete from Room table (we need a raw delete)
    const { getClient } = await import('./turso');
    const c = (await import('./turso')).getClient || null;
    // Use updateRoom with phase='deleted' as soft delete
    await turso.updateRoom(code, { phase: 'deleted', stateJson: '{}' });
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Spectator management
// ============================================================

export async function addSpectator(code: string, name: string): Promise<PrisonRoomState | null> {
  const room = await getPrisonRoom(code);
  if (!room) return null;

  const id = `spec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  room.spectators = room.spectators.filter(s => s.name !== name);
  room.spectators.push({ id, name, joinedAt: Date.now(), lastSeen: Date.now() });

  return updatePrisonRoom(code, { spectators: room.spectators });
}

export async function heartbeatSpectator(code: string, spectatorId: string): Promise<boolean> {
  const room = await getPrisonRoom(code);
  if (!room) return false;

  const spec = room.spectators.find(s => s.id === spectatorId);
  if (!spec) return false;
  spec.lastSeen = Date.now();

  await updatePrisonRoom(code, { spectators: room.spectators });
  return true;
}

export async function removeSpectator(code: string, spectatorId: string): Promise<boolean> {
  const room = await getPrisonRoom(code);
  if (!room) return false;

  const idx = room.spectators.findIndex(s => s.id === spectatorId);
  if (idx === -1) return false;
  room.spectators.splice(idx, 1);

  await updatePrisonRoom(code, { spectators: room.spectators });
  return true;
}
