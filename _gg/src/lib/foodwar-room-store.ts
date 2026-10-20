// ============================================================
// حرب الاكلات (Food War) - Room Store using Turso
// Uses the Room table with gameType='foodwar' and stateJson
// ============================================================

import * as turso from './turso';

export interface SpectatorInfo {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
}

export interface FoodWarRoomState {
  code: string;
  hostName: string;
  createdAt: number;
  hostLastSeen: number;
  phase: string;
  stateJson: string;
  spectators: SpectatorInfo[];
}

const ROOM_TTL_MS = 5 * 60 * 1000; // 5 minutes

function packState(state: Partial<FoodWarRoomState>): string {
  return JSON.stringify(state);
}

function unpackState(json: string): Partial<FoodWarRoomState> {
  try { return JSON.parse(json); } catch { return {}; }
}

export async function createFoodWarRoom(code: string, hostName: string): Promise<FoodWarRoomState> {
  const now = Date.now();
  const state: FoodWarRoomState = {
    code,
    hostName,
    createdAt: now,
    hostLastSeen: now,
    phase: 'setup',
    stateJson: '{}',
    spectators: [],
  };

  await turso.createRoom({
    id: `foodwar_${code}`,
    code,
    hostName,
    playerCount: 0,
    phase: 'setup',
    stateJson: packState(state),
    gameType: 'foodwar',
  });

  return state;
}

export async function getFoodWarRoom(code: string): Promise<FoodWarRoomState | null> {
  const room = await turso.getRoomByCode(code);
  if (!room || room.gameType !== 'foodwar') return null;

  const lastSeen = new Date(room.hostLastSeen).getTime();
  if (Date.now() - lastSeen > ROOM_TTL_MS) {
    await deleteFoodWarRoom(code);
    return null;
  }

  const state = unpackState(room.stateJson) as Partial<FoodWarRoomState>;

  const merged: FoodWarRoomState = {
    code,
    hostName: room.hostName,
    createdAt: new Date(room.createdAt).getTime(),
    hostLastSeen: lastSeen,
    phase: state.phase ?? room.phase ?? 'setup',
    stateJson: state.stateJson ?? '{}',
    spectators: state.spectators ?? [],
  };

  if (merged.spectators) {
    merged.spectators = merged.spectators.filter(s => Date.now() - s.lastSeen < 30000);
  }

  return merged;
}

export async function updateFoodWarRoom(code: string, data: Partial<FoodWarRoomState>): Promise<FoodWarRoomState | null> {
  const existing = await getFoodWarRoom(code);
  if (!existing) return null;

  const merged: FoodWarRoomState = { ...existing, ...data, hostLastSeen: Date.now() };
  await turso.updateRoom(code, {
    stateJson: packState(merged),
    hostLastSeen: new Date().toISOString(),
    phase: merged.phase,
  });

  return merged;
}

export async function heartbeatFoodWarRoom(code: string): Promise<boolean> {
  const room = await turso.getRoomByCode(code);
  if (!room || room.gameType !== 'foodwar') return false;

  await turso.updateRoom(code, { hostLastSeen: new Date().toISOString() });
  return true;
}

export async function deleteFoodWarRoom(code: string): Promise<boolean> {
  try {
    const room = await turso.getRoomByCode(code);
    if (!room || room.gameType !== 'foodwar') return false;

    await turso.updateRoom(code, { phase: 'deleted', stateJson: '{}' });
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Spectator management
// ============================================================

export async function addSpectator(code: string, name: string): Promise<FoodWarRoomState | null> {
  const room = await getFoodWarRoom(code);
  if (!room) return null;

  const id = `spec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  room.spectators = room.spectators.filter(s => s.name !== name);
  room.spectators.push({ id, name, joinedAt: Date.now(), lastSeen: Date.now() });

  return updateFoodWarRoom(code, { spectators: room.spectators });
}

export async function heartbeatSpectator(code: string, spectatorId: string): Promise<boolean> {
  const room = await getFoodWarRoom(code);
  if (!room) return false;

  const spec = room.spectators.find(s => s.id === spectatorId);
  if (!spec) return false;
  spec.lastSeen = Date.now();

  await updateFoodWarRoom(code, { spectators: room.spectators });
  return true;
}

export async function removeSpectator(code: string, spectatorId: string): Promise<boolean> {
  const room = await getFoodWarRoom(code);
  if (!room) return false;

  const idx = room.spectators.findIndex(s => s.id === spectatorId);
  if (idx === -1) return false;
  room.spectators.splice(idx, 1);

  await updateFoodWarRoom(code, { spectators: room.spectators });
  return true;
}
