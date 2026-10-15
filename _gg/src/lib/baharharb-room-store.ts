// ============================================================
// بحر و حرب (BaharHarb) - Room Store using Turso
// Uses the Room table with gameType='baharharb' and stateJson
// Cloned from tobol-room-store.ts and adapted to baharharb's state shape
// (see /src/lib/baharharb-store.ts for the canonical Zustand state)
// ============================================================

import * as turso from './turso';

// ── Spectator info (read-only viewers) ──────────────────────
export interface SpectatorInfo {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
}

// ── BaharHarb question shape (from baharharb-questions.ts) ──
export interface BaharHarbQuestion {
  id: number;
  clues: [string, string];
  answers: [string, string];
}

// ── BaharHarb room state shape (mirrors baharharb-store state) ──
export interface BaharHarbRoomState {
  code: string;
  hostName: string;
  createdAt: number;
  hostLastSeen: number;

  // Game settings (BaharHarb specific)
  phase: string;
  gameMode: string;
  playMode: 'teams' | 'individuals';
  team1Name: string;
  team2Name: string;
  totalQuestions: number;
  currentQuestionIndex: number;
  questions: BaharHarbQuestion[];
  team1Score: number;
  team2Score: number;

  // Reveal flags per current question
  showClue1: boolean;
  showClue2: boolean;
  showAnswer1: boolean;
  showAnswer2: boolean;

  // Battle log
  battleLog: Array<{ id: number; team: 1 | 2; message: string }>;
  logCounter: number;

  // Spectator list (managed here, not by the host store)
  spectators: SpectatorInfo[];
}

const ROOM_TTL_MS = 5 * 60 * 1000; // 5 minutes without host heartbeat

// ============================================================
// Helpers
// ============================================================

function packState(state: Partial<BaharHarbRoomState>): string {
  return JSON.stringify(state);
}

function unpackState(json: string): Partial<BaharHarbRoomState> {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

// ============================================================
// Room CRUD (async — Turso)
// ============================================================

export async function createBaharHarbRoom(
  code: string,
  hostName: string,
): Promise<BaharHarbRoomState> {
  const now = Date.now();
  const state: BaharHarbRoomState = {
    code,
    hostName,
    createdAt: now,
    hostLastSeen: now,
    phase: 'landing',
    gameMode: 'diwaniya',
    playMode: 'teams',
    team1Name: 'الفريق الأول',
    team2Name: 'الفريق الثاني',
    totalQuestions: 10,
    currentQuestionIndex: 0,
    questions: [],
    team1Score: 0,
    team2Score: 0,
    showClue1: false,
    showClue2: false,
    showAnswer1: false,
    showAnswer2: false,
    battleLog: [],
    logCounter: 0,
    spectators: [],
  };

  await turso.createRoom({
    id: `baharharb_${code}`,
    code,
    hostName,
    playerCount: 0,
    phase: 'landing',
    stateJson: packState(state),
    gameType: 'baharharb',
  });

  return state;
}

export async function getBaharHarbRoom(
  code: string,
): Promise<BaharHarbRoomState | null> {
  const room = await turso.getRoomByCode(code);
  if (!room) return null;

  // Match rooms explicitly tagged as 'baharharb' OR rooms created via the generic
  // /api/room POST (gameType null/undefined).
  if (room.gameType && room.gameType !== 'baharharb') return null;

  if (room.phase === 'deleted') return null;

  const lastSeen = new Date(room.hostLastSeen).getTime();
  if (Date.now() - lastSeen > ROOM_TTL_MS) {
    await deleteBaharHarbRoom(code);
    return null;
  }

  const state = unpackState(room.stateJson) as BaharHarbRoomState;

  const merged: BaharHarbRoomState = {
    code,
    hostName: state.hostName ?? room.hostName,
    createdAt: state.createdAt ?? new Date(room.createdAt).getTime(),
    hostLastSeen: lastSeen,
    phase: state.phase ?? room.phase,
    gameMode: state.gameMode ?? 'diwaniya',
    playMode: state.playMode ?? 'teams',
    team1Name: state.team1Name ?? 'الفريق الأول',
    team2Name: state.team2Name ?? 'الفريق الثاني',
    totalQuestions: state.totalQuestions ?? 10,
    currentQuestionIndex: state.currentQuestionIndex ?? 0,
    questions: state.questions ?? [],
    team1Score: state.team1Score ?? 0,
    team2Score: state.team2Score ?? 0,
    showClue1: state.showClue1 ?? false,
    showClue2: state.showClue2 ?? false,
    showAnswer1: state.showAnswer1 ?? false,
    showAnswer2: state.showAnswer2 ?? false,
    battleLog: state.battleLog ?? [],
    logCounter: state.logCounter ?? 0,
    spectators: state.spectators ?? [],
  };

  // Clean stale spectators
  if (merged.spectators) {
    merged.spectators = merged.spectators.filter(
      (s) => Date.now() - s.lastSeen < 30000,
    );
  }

  return merged;
}

export async function updateBaharHarbRoom(
  code: string,
  data: Partial<BaharHarbRoomState>,
): Promise<BaharHarbRoomState | null> {
  const existing = await getBaharHarbRoom(code);
  if (!existing) return null;

  const merged: BaharHarbRoomState = {
    ...existing,
    ...data,
    hostLastSeen: Date.now(),
  };
  await turso.updateRoom(code, {
    stateJson: packState(merged),
    hostLastSeen: new Date().toISOString(),
    phase: merged.phase,
  });

  return merged;
}

export async function heartbeatBaharHarbRoom(code: string): Promise<boolean> {
  const room = await turso.getRoomByCode(code);
  if (!room) return false;
  if (room.gameType && room.gameType !== 'baharharb') return false;

  await turso.updateRoom(code, { hostLastSeen: new Date().toISOString() });
  return true;
}

export async function deleteBaharHarbRoom(code: string): Promise<boolean> {
  try {
    const room = await turso.getRoomByCode(code);
    if (!room) return false;
    if (room.gameType && room.gameType !== 'baharharb') return false;

    await turso.updateRoom(code, { phase: 'deleted', stateJson: '{}' });
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Spectator management
// ============================================================

export async function addSpectator(
  code: string,
  name: string,
): Promise<BaharHarbRoomState | null> {
  const room = await getBaharHarbRoom(code);
  if (!room) return null;

  const id = `spec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  room.spectators = room.spectators.filter((s) => s.name !== name);
  room.spectators.push({
    id,
    name,
    joinedAt: Date.now(),
    lastSeen: Date.now(),
  });

  return updateBaharHarbRoom(code, { spectators: room.spectators });
}

export async function heartbeatSpectator(
  code: string,
  spectatorId: string,
): Promise<boolean> {
  const room = await getBaharHarbRoom(code);
  if (!room) return false;

  const spec = room.spectators.find((s) => s.id === spectatorId);
  if (!spec) return false;
  spec.lastSeen = Date.now();

  await updateBaharHarbRoom(code, { spectators: room.spectators });
  return true;
}

export async function removeSpectator(
  code: string,
  spectatorId: string,
): Promise<boolean> {
  const room = await getBaharHarbRoom(code);
  if (!room) return false;

  const idx = room.spectators.findIndex((s) => s.id === spectatorId);
  if (idx === -1) return false;
  room.spectators.splice(idx, 1);

  await updateBaharHarbRoom(code, { spectators: room.spectators });
  return true;
}

// ============================================================
// Generic state broadcast (host → spectators)
// ============================================================

export async function broadcastState(
  code: string,
  payload: Partial<BaharHarbRoomState>,
): Promise<BaharHarbRoomState | null> {
  return updateBaharHarbRoom(code, payload);
}
