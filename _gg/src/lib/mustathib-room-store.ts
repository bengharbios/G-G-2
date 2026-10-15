// ============================================================
// المستئذب (Mustathib) - Room Store
// Uses the Room table with gameType='mustathib' and stateJson
// (mirrors /home/z/g-g/_gg/src/lib/tobol-room-store.ts structure)
// ============================================================

import * as turso from './turso';

export interface SpectatorInfo {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
}

export interface MustathibPlayerState {
  id: string;
  name: string;
  role: string;
  isAlive: boolean;
}

export interface MustathibRoomState {
  code: string;
  hostName: string;
  createdAt: number;
  hostLastSeen: number;
  phase: string;
  round: number;
  players: MustathibPlayerState[];
  roleRevealIndex: number;
  nightActions: Array<{ actorId: string; role: string; targetId: string | null; action: string }>;
  nightStep: number;
  lastNightDeathId: string | null;
  dayVotes: Array<{ voterId: string; targetId: string }>;
  gameLog: Array<{ round: number; message: string; type: string; timestamp: number }>;
  winner: string | null;
  lastAction: string | null;
  totalKills: number;
  totalSaves: number;
  spectators: SpectatorInfo[];
}

const ROOM_TTL_MS = 5 * 60 * 1000; // 5 minutes

function packState(state: Partial<MustathibRoomState>): string {
  return JSON.stringify(state);
}

function unpackState(json: string): Partial<MustathibRoomState> {
  try { return JSON.parse(json); } catch { return {}; }
}

// ============================================================
// CRUD (async — Turso)
// ============================================================

export async function createMustathibRoom(code: string, hostName: string): Promise<MustathibRoomState> {
  const now = Date.now();
  const state: MustathibRoomState = {
    code,
    hostName,
    createdAt: now,
    hostLastSeen: now,
    phase: 'setup',
    round: 0,
    players: [],
    roleRevealIndex: 0,
    nightActions: [],
    nightStep: 0,
    lastNightDeathId: null,
    dayVotes: [],
    gameLog: [],
    winner: null,
    lastAction: null,
    totalKills: 0,
    totalSaves: 0,
    spectators: [],
  };

  await turso.createRoom({
    id: `mustathib_${code}`,
    code,
    hostName,
    playerCount: 0,
    phase: 'setup',
    stateJson: packState(state),
    gameType: 'mustathib',
  });

  return state;
}

export async function getMustathibRoom(code: string): Promise<MustathibRoomState | null> {
  const room = await turso.getRoomByCode(code);
  if (!room || room.gameType !== 'mustathib') return null;
  if (room.phase === 'deleted') return null;

  const lastSeen = new Date(room.hostLastSeen).getTime();
  if (Date.now() - lastSeen > ROOM_TTL_MS) {
    await deleteMustathibRoom(code);
    return null;
  }

  const state = unpackState(room.stateJson) as MustathibRoomState;
  if (state.spectators) {
    state.spectators = state.spectators.filter(s => Date.now() - s.lastSeen < 30000);
  }

  return state;
}

export async function updateMustathibRoom(code: string, data: Partial<MustathibRoomState>): Promise<MustathibRoomState | null> {
  const existing = await getMustathibRoom(code);
  if (!existing) return null;

  const merged: MustathibRoomState = { ...existing, ...data, hostLastSeen: Date.now() };
  await turso.updateRoom(code, {
    stateJson: packState(merged),
    hostLastSeen: new Date().toISOString(),
    phase: merged.phase,
  });

  return merged;
}

export async function heartbeatMustathibRoom(code: string): Promise<boolean> {
  const room = await turso.getRoomByCode(code);
  if (!room || room.gameType !== 'mustathib') return false;

  await turso.updateRoom(code, { hostLastSeen: new Date().toISOString() });
  return true;
}

export async function deleteMustathibRoom(code: string): Promise<boolean> {
  try {
    const room = await turso.getRoomByCode(code);
    if (!room || room.gameType !== 'mustathib') return false;

    await turso.updateRoom(code, { phase: 'deleted', stateJson: '{}' });
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Spectator management
// ============================================================

export async function addSpectator(code: string, name: string): Promise<MustathibRoomState | null> {
  const room = await getMustathibRoom(code);
  if (!room) return null;

  const id = `spec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  room.spectators = room.spectators.filter(s => s.name !== name);
  room.spectators.push({ id, name, joinedAt: Date.now(), lastSeen: Date.now() });

  return updateMustathibRoom(code, { spectators: room.spectators });
}

export async function heartbeatSpectator(code: string, spectatorId: string): Promise<boolean> {
  const room = await getMustathibRoom(code);
  if (!room) return false;

  const spec = room.spectators.find(s => s.id === spectatorId);
  if (!spec) return false;
  spec.lastSeen = Date.now();

  await updateMustathibRoom(code, { spectators: room.spectators });
  return true;
}

export async function removeSpectator(code: string, spectatorId: string): Promise<boolean> {
  const room = await getMustathibRoom(code);
  if (!room) return false;

  const idx = room.spectators.findIndex(s => s.id === spectatorId);
  if (idx === -1) return false;
  room.spectators.splice(idx, 1);

  await updateMustathibRoom(code, { spectators: room.spectators });
  return true;
}

// ============================================================
// Action processing (broadcast state to spectators)
// ============================================================

export async function submitMustathibAction(
  code: string,
  data: { phase?: string; round?: number; stateJson?: string; gameWinner?: string | null }
): Promise<MustathibRoomState | null> {
  return updateMustathibRoom(code, data);
}
