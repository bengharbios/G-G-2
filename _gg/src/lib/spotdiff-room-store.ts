// ============================================================
// اختلاف الصور (Spot the Difference) - Room Store
// Uses the Room table with gameType='spotdiff' and stateJson
// Mirrors the structure of mustathib-room-store.ts
// ============================================================

import * as turso from './turso';

export interface SpotDiffSpectatorInfo {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
}

export interface SpotDiffRoomState {
  code: string;
  hostName: string;
  createdAt: number;
  hostLastSeen: number;
  phase: string;
  round: number;
  difficulty: string;
  totalRounds: number;
  currentRoundId: string | null;
  foundDifferences: string[];
  score: number;
  timeLeft: number;
  totalDifferences: number;
  totalFound: number;
  totalMisses: number;
  roundsPlayed: number;
  gameLog: Array<{ round: number; message: string; type: string; timestamp: number }>;
  lastAction: string | null;
  playerName: string | null;
  spectators: SpotDiffSpectatorInfo[];
}

const ROOM_TTL_MS = 5 * 60 * 1000; // 5 minutes

function packState(state: Partial<SpotDiffRoomState>): string {
  return JSON.stringify(state);
}

function unpackState(json: string): Partial<SpotDiffRoomState> {
  try { return JSON.parse(json); } catch { return {}; }
}

// ============================================================
// CRUD (async — Turso)
// ============================================================

export async function createSpotDiffRoom(code: string, hostName: string): Promise<SpotDiffRoomState> {
  const now = Date.now();
  const state: SpotDiffRoomState = {
    code,
    hostName,
    createdAt: now,
    hostLastSeen: now,
    phase: 'setup',
    round: 0,
    difficulty: 'medium',
    totalRounds: 5,
    currentRoundId: null,
    foundDifferences: [],
    score: 0,
    timeLeft: 0,
    totalDifferences: 0,
    totalFound: 0,
    totalMisses: 0,
    roundsPlayed: 0,
    gameLog: [],
    lastAction: null,
    playerName: null,
    spectators: [],
  };

  await turso.createRoom({
    id: `spotdiff_${code}`,
    code,
    hostName,
    playerCount: 1,
    phase: 'setup',
    stateJson: packState(state),
    gameType: 'spotdiff',
  });

  return state;
}

export async function getSpotDiffRoom(code: string): Promise<SpotDiffRoomState | null> {
  const room = await turso.getRoomByCode(code);
  if (!room || room.gameType !== 'spotdiff') return null;
  if (room.phase === 'deleted') return null;

  const lastSeen = new Date(room.hostLastSeen).getTime();
  if (Date.now() - lastSeen > ROOM_TTL_MS) {
    await deleteSpotDiffRoom(code);
    return null;
  }

  const state = unpackState(room.stateJson) as SpotDiffRoomState;
  if (state.spectators) {
    state.spectators = state.spectators.filter(s => Date.now() - s.lastSeen < 30000);
  }

  return state;
}

export async function updateSpotDiffRoom(code: string, data: Partial<SpotDiffRoomState>): Promise<SpotDiffRoomState | null> {
  const existing = await getSpotDiffRoom(code);
  if (!existing) return null;

  const merged: SpotDiffRoomState = { ...existing, ...data, hostLastSeen: Date.now() };
  await turso.updateRoom(code, {
    stateJson: packState(merged),
    hostLastSeen: new Date().toISOString(),
    phase: merged.phase,
  });

  return merged;
}

export async function heartbeatSpotDiffRoom(code: string): Promise<boolean> {
  const room = await turso.getRoomByCode(code);
  if (!room || room.gameType !== 'spotdiff') return false;

  await turso.updateRoom(code, { hostLastSeen: new Date().toISOString() });
  return true;
}

export async function deleteSpotDiffRoom(code: string): Promise<boolean> {
  try {
    const room = await turso.getRoomByCode(code);
    if (!room || room.gameType !== 'spotdiff') return false;

    await turso.updateRoom(code, { phase: 'deleted', stateJson: '{}' });
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Spectator management
// ============================================================

export async function addSpotDiffSpectator(code: string, name: string): Promise<SpotDiffRoomState | null> {
  const room = await getSpotDiffRoom(code);
  if (!room) return null;

  const id = `spec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  room.spectators = room.spectators.filter(s => s.name !== name);
  room.spectators.push({ id, name, joinedAt: Date.now(), lastSeen: Date.now() });

  return updateSpotDiffRoom(code, { spectators: room.spectators });
}

export async function heartbeatSpotDiffSpectator(code: string, spectatorId: string): Promise<boolean> {
  const room = await getSpotDiffRoom(code);
  if (!room) return false;

  const spec = room.spectators.find(s => s.id === spectatorId);
  if (!spec) return false;
  spec.lastSeen = Date.now();

  await updateSpotDiffRoom(code, { spectators: room.spectators });
  return true;
}

export async function removeSpotDiffSpectator(code: string, spectatorId: string): Promise<boolean> {
  const room = await getSpotDiffRoom(code);
  if (!room) return false;

  const idx = room.spectators.findIndex(s => s.id === spectatorId);
  if (idx === -1) return false;
  room.spectators.splice(idx, 1);

  await updateSpotDiffRoom(code, { spectators: room.spectators });
  return true;
}
