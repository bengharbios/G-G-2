// ════════════════════════════════════════════════════════════════════════
// سفن (Ships) — Room Store for remote spectator mode
// Mirrors spotdiff-room-store.ts structure
// ════════════════════════════════════════════════════════════════════════

import * as turso from './turso';

export interface ShipsSpectatorInfo {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
}

export interface ShipsRoomState {
  code: string;
  hostName: string;
  createdAt: number;
  hostLastSeen: number;
  phase: string;
  themeId: number;
  playMode: string;
  team1Score: number;
  team2Score: number;
  team1Hits: number;
  team2Hits: number;
  currentTurn: string;
  winner: string | null;
  lastAction: string | null;
  gameLog: Array<{ round: number; message: string; type: string; timestamp: number }>;
  spectators: ShipsSpectatorInfo[];
}

const ROOM_TTL_MS = 5 * 60 * 1000;

function packState(state: Partial<ShipsRoomState>): string {
  return JSON.stringify(state);
}

function unpackState(json: string): Partial<ShipsRoomState> {
  try { return JSON.parse(json); } catch { return {}; }
}

export async function createShipsRoom(code: string, hostName: string): Promise<ShipsRoomState | null> {
  const now = Date.now();
  const state: ShipsRoomState = {
    code, hostName,
    createdAt: now,
    hostLastSeen: now,
    phase: 'setup',
    themeId: 1,
    playMode: 'teams',
    team1Score: 0,
    team2Score: 0,
    team1Hits: 0,
    team2Hits: 0,
    currentTurn: 'team1',
    winner: null,
    lastAction: null,
    gameLog: [],
    spectators: [],
  };
  try {
    await turso.createRoom({
      id: `ships_${code}`,
      code, hostName,
      playerCount: 2,
      phase: 'setup',
      stateJson: packState(state),
      gameType: 'ships',
    });
    return state;
  } catch { return null; }
}

export async function getShipsRoom(code: string): Promise<ShipsRoomState | null> {
  try {
    const room = await turso.getRoomByCode(code);
    if (!room || room.gameType !== 'ships') return null;
    if (room.phase === 'deleted') return null;
    const lastSeen = new Date(room.hostLastSeen).getTime();
    if (Date.now() - lastSeen > ROOM_TTL_MS) {
      await deleteShipsRoom(code);
      return null;
    }
    const state = unpackState(room.stateJson) as ShipsRoomState;
    if (state.spectators) {
      state.spectators = state.spectators.filter(s => Date.now() - s.lastSeen < 30000);
    }
    return state;
  } catch { return null; }
}

export async function updateShipsRoom(code: string, data: Partial<ShipsRoomState>): Promise<ShipsRoomState | null> {
  const existing = await getShipsRoom(code);
  if (!existing) return null;
  const merged: ShipsRoomState = { ...existing, ...data, hostLastSeen: Date.now() };
  try {
    await turso.updateRoom(code, {
      stateJson: packState(merged),
      hostLastSeen: new Date().toISOString(),
      phase: merged.phase,
    });
    return merged;
  } catch { return null; }
}

export async function deleteShipsRoom(code: string): Promise<boolean> {
  try {
    await turso.updateRoom(code, { phase: 'deleted', stateJson: '{}' });
    return true;
  } catch { return false; }
}

export async function addShipsSpectator(code: string, name: string): Promise<ShipsRoomState | null> {
  const room = await getShipsRoom(code);
  if (!room) return null;
  const id = `spec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  room.spectators = room.spectators.filter(s => s.name !== name);
  room.spectators.push({ id, name, joinedAt: Date.now(), lastSeen: Date.now() });
  return updateShipsRoom(code, { spectators: room.spectators });
}

export async function heartbeatShipsSpectator(code: string, spectatorId: string): Promise<boolean> {
  const room = await getShipsRoom(code);
  if (!room) return false;
  const spec = room.spectators.find(s => s.id === spectatorId);
  if (!spec) return false;
  spec.lastSeen = Date.now();
  await updateShipsRoom(code, { spectators: room.spectators });
  return true;
}

export async function removeShipsSpectator(code: string, spectatorId: string): Promise<boolean> {
  const room = await getShipsRoom(code);
  if (!room) return false;
  const idx = room.spectators.findIndex(s => s.id === spectatorId);
  if (idx === -1) return false;
  room.spectators.splice(idx, 1);
  await updateShipsRoom(code, { spectators: room.spectators });
  return true;
}
