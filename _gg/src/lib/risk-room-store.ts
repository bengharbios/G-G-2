// ============================================================
// المجازفة (Risk) - Room Store using Turso
// Uses the Room table with gameType='risk' and stateJson
// ============================================================

import * as turso from './turso';

export interface SpectatorInfo {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
}

export interface RiskRoomState {
  code: string;
  hostName: string;
  createdAt: number;
  hostLastSeen: number;
  teams: Array<{
    id: string;
    name: string;
    score: number;
    roundScore: number;
    color: string;
    colorHex: string;
    emoji: string;
  }>;
  currentTeamIndex: number;
  cards: Array<{
    id: string;
    type: string;
    value: number;
    revealed: boolean;
    index: number;
  }>;
  config: {
    teamCount: number;
    bombCount: number;
    skipCount: number;
    totalCards: number;
    teamNames: string[];
  };
  turnState: string;
  lastDrawnCard: {
    id: string;
    type: string;
    value: number;
    revealed: boolean;
    index: number;
  } | null;
  gameLog: Array<{
    id: number;
    teamId: string;
    teamName: string;
    action: string;
    cardType: string;
    cardValue: number;
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

function packState(state: Partial<RiskRoomState>): string {
  return JSON.stringify(state);
}

function unpackState(json: string): Partial<RiskRoomState> {
  try { return JSON.parse(json); } catch { return {}; }
}

// ============================================================
// Room CRUD (async — Turso)
// ============================================================

export async function createRiskRoom(code: string, hostName: string): Promise<RiskRoomState> {
  const now = Date.now();
  const state: RiskRoomState = {
    code,
    hostName,
    createdAt: now,
    hostLastSeen: now,
    teams: [],
    currentTeamIndex: 0,
    cards: [],
    config: {
      teamCount: 2,
      bombCount: 3,
      skipCount: 2,
      totalCards: 40,
      teamNames: [],
    },
    turnState: 'waiting_for_draw',
    lastDrawnCard: null,
    gameLog: [],
    winner: null,
    winReason: '',
    phase: 'playing',
    spectators: [],
  };

  await turso.createRoom({
    id: `risk_${code}`,
    code,
    hostName,
    playerCount: 0,
    phase: 'playing',
    stateJson: packState(state),
    gameType: 'risk',
  });

  return state;
}

export async function getRiskRoom(code: string): Promise<RiskRoomState | null> {
  const room = await turso.getRoomByCode(code);
  if (!room || room.gameType !== 'risk') return null;

  // Room expires after 5 minutes without heartbeat
  const lastSeen = new Date(room.hostLastSeen).getTime();
  if (Date.now() - lastSeen > ROOM_TTL_MS) {
    await deleteRiskRoom(code);
    return null;
  }

  const state = unpackState(room.stateJson) as RiskRoomState;

  // Clean stale spectators (not seen for 30 seconds)
  if (state.spectators) {
    state.spectators = state.spectators.filter(s => Date.now() - s.lastSeen < 30000);
  }

  return state;
}

export async function updateRiskRoom(code: string, data: Partial<RiskRoomState>): Promise<RiskRoomState | null> {
  const existing = await getRiskRoom(code);
  if (!existing) return null;

  const merged: RiskRoomState = { ...existing, ...data, hostLastSeen: Date.now() };
  await turso.updateRoom(code, {
    stateJson: packState(merged),
    hostLastSeen: new Date().toISOString(),
    phase: merged.phase,
    ...(merged.winner ? { gameWinner: merged.winner } : {}),
  });

  return merged;
}

export async function heartbeatRiskRoom(code: string): Promise<boolean> {
  const room = await turso.getRoomByCode(code);
  if (!room || room.gameType !== 'risk') return false;

  await turso.updateRoom(code, { hostLastSeen: new Date().toISOString() });
  return true;
}

export async function deleteRiskRoom(code: string): Promise<boolean> {
  try {
    const room = await turso.getRoomByCode(code);
    if (!room || room.gameType !== 'risk') return false;

    await turso.updateRoom(code, { phase: 'deleted', stateJson: '{}' });
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Spectator management
// ============================================================

export async function addSpectator(code: string, name: string): Promise<RiskRoomState | null> {
  const room = await getRiskRoom(code);
  if (!room) return null;

  const id = `spec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  room.spectators = room.spectators.filter(s => s.name !== name);
  room.spectators.push({ id, name, joinedAt: Date.now(), lastSeen: Date.now() });

  return updateRiskRoom(code, { spectators: room.spectators });
}

export async function heartbeatSpectator(code: string, spectatorId: string): Promise<boolean> {
  const room = await getRiskRoom(code);
  if (!room) return false;

  const spec = room.spectators.find(s => s.id === spectatorId);
  if (!spec) return false;
  spec.lastSeen = Date.now();

  await updateRiskRoom(code, { spectators: room.spectators });
  return true;
}

export async function removeSpectator(code: string, spectatorId: string): Promise<boolean> {
  const room = await getRiskRoom(code);
  if (!room) return false;

  const idx = room.spectators.findIndex(s => s.id === spectatorId);
  if (idx === -1) return false;
  room.spectators.splice(idx, 1);

  await updateRiskRoom(code, { spectators: room.spectators });
  return true;
}
