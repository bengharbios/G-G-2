// ============================================================
// مبارزة السحرة (WizardDuel) - Room Store using Turso (NOT in-memory)
// Uses the Room table with gameType='wizardduel' and stateJson
// ============================================================

import * as turso from './turso';
import type { WizardDuelState } from './wizardduel-types';

export interface SpectatorInfo {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
}

export interface WizardDuelRoomState {
  code: string;
  hostName: string;
  createdAt: number;
  hostLastSeen: number;
  phase: string;                  // 'playing' | 'game_over' | 'deleted'
  spectators: SpectatorInfo[];
  // Mirror of WizardDuelState fields (only what we need to broadcast)
  players?: WizardDuelState['players'];
  deck?: WizardDuelState['deck'];
  level?: number;
  currentTurn?: '0' | '1';
  turnCount?: number;
  movesThisTurn?: number;
  battleLog?: WizardDuelState['battleLog'];
  lastAction?: string | null;
  winner?: '0' | '1' | null;
}

const ROOM_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================
// Helpers
// ============================================================
function packState(state: Partial<WizardDuelRoomState>): string {
  return JSON.stringify(state);
}
function unpackState(json: string): Partial<WizardDuelRoomState> {
  try { return JSON.parse(json); } catch { return {}; }
}

// ============================================================
// Room CRUD (async — Turso)
// ============================================================
export async function createWizardDuelRoom(code: string, hostName: string): Promise<WizardDuelRoomState> {
  const now = Date.now();
  const state: WizardDuelRoomState = {
    code,
    hostName,
    createdAt: now,
    hostLastSeen: now,
    phase: 'playing',
    spectators: [],
    currentTurn: '0',
    turnCount: 1,
    movesThisTurn: 0,
    battleLog: [],
    lastAction: 'بدأت المبارزة',
    winner: null,
  };

  await turso.createRoom({
    id: `wizardduel_${code}`,
    code,
    hostName,
    playerCount: 0,
    phase: 'playing',
    stateJson: packState(state),
    gameType: 'wizardduel',
  });

  return state;
}

export async function getWizardDuelRoom(code: string): Promise<WizardDuelRoomState | null> {
  const room = await turso.getRoomByCode(code);
  if (!room || room.gameType !== 'wizardduel') return null;
  if (room.phase === 'deleted') return null;

  const lastSeen = new Date(room.hostLastSeen).getTime();
  if (Date.now() - lastSeen > ROOM_TTL_MS) {
    await deleteWizardDuelRoom(code);
    return null;
  }

  const state = unpackState(room.stateJson) as WizardDuelRoomState;

  if (state.spectators) {
    state.spectators = state.spectators.filter(s => Date.now() - s.lastSeen < 30000);
  }

  return state;
}

export async function updateWizardDuelRoom(code: string, data: Partial<WizardDuelRoomState>): Promise<WizardDuelRoomState | null> {
  const existing = await getWizardDuelRoom(code);
  if (!existing) return null;

  const merged: WizardDuelRoomState = { ...existing, ...data, hostLastSeen: Date.now() };
  await turso.updateRoom(code, {
    stateJson: packState(merged),
    hostLastSeen: new Date().toISOString(),
    phase: merged.phase,
  });

  return merged;
}

export async function heartbeatWizardDuelRoom(code: string): Promise<boolean> {
  const room = await turso.getRoomByCode(code);
  if (!room || room.gameType !== 'wizardduel') return false;
  await turso.updateRoom(code, { hostLastSeen: new Date().toISOString() });
  return true;
}

export async function deleteWizardDuelRoom(code: string): Promise<boolean> {
  try {
    const room = await turso.getRoomByCode(code);
    if (!room || room.gameType !== 'wizardduel') return false;
    await turso.updateRoom(code, { phase: 'deleted', stateJson: '{}' });
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Spectator management
// ============================================================
export async function addSpectator(code: string, name: string): Promise<WizardDuelRoomState | null> {
  const room = await getWizardDuelRoom(code);
  if (!room) return null;

  const id = `spec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  room.spectators = room.spectators.filter(s => s.name !== name);
  room.spectators.push({ id, name, joinedAt: Date.now(), lastSeen: Date.now() });

  return updateWizardDuelRoom(code, { spectators: room.spectators });
}

export async function heartbeatSpectator(code: string, spectatorId: string): Promise<boolean> {
  const room = await getWizardDuelRoom(code);
  if (!room) return false;

  const spec = room.spectators.find(s => s.id === spectatorId);
  if (!spec) return false;
  spec.lastSeen = Date.now();

  await updateWizardDuelRoom(code, { spectators: room.spectators });
  return true;
}

export async function removeSpectator(code: string, spectatorId: string): Promise<boolean> {
  const room = await getWizardDuelRoom(code);
  if (!room) return false;

  const idx = room.spectators.findIndex(s => s.id === spectatorId);
  if (idx === -1) return false;
  room.spectators.splice(idx, 1);

  await updateWizardDuelRoom(code, { spectators: room.spectators });
  return true;
}
