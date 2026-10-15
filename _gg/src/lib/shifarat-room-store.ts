// ============================================================
// الشيفرات (Shifarat) - Room Store using Turso
// Uses the Room table with gameType='shifarat' and stateJson
// Cloned from tobol-room-store.ts and adapted to shifarat's state shape
// (see /src/lib/shifarat-store.ts for the canonical Zustand state)
// ============================================================

import * as turso from './turso';
import type {
  BoardCard,
  TeamColor,
  GamePhase,
  Clue,
  GameLogEntry,
  TeamInfo,
} from './shifarat-types';

// ── Spectator info (read-only viewers) ──────────────────────
export interface SpectatorInfo {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
}

// ── Shifarat room state shape (mirrors shifarat-store state) ──
export interface ShifaratRoomState {
  code: string;
  hostName: string;
  createdAt: number;
  hostLastSeen: number;

  // Game mode + phase
  gameMode: 'godfather' | 'diwaniya' | null;
  phase: GamePhase;
  viewMode: 'spymaster' | 'team' | 'transition';

  // Board (5×5 = 25 cards)
  board: BoardCard[];

  // Teams
  redTeam: TeamInfo;
  blueTeam: TeamInfo;

  // Turn management
  startingTeam: TeamColor;
  currentTeam: TeamColor;
  roundNumber: number;

  // Clue & guessing
  currentClue: Clue | null;
  guessesThisTurn: number;
  guessesAllowed: number;
  lastGuessResult: 'correct' | 'wrong' | 'neutral' | 'assassin' | null;

  // Timer
  timerDuration: number;
  timerRemaining: number;
  isTimerActive: boolean;

  // History
  clues: Clue[];
  gameLog: GameLogEntry[];

  // Settings
  selectedCategories: string[];

  // Result
  winner: TeamColor | null;
  winReason: string | null;

  // Players (Diwaniya mode)
  players: Array<{
    id: string;
    name: string;
    team: 'red' | 'blue';
    role: 'spymaster' | 'player';
    hasJoined: boolean;
  }>;

  // Spectator list (managed here, not by the host store)
  spectators: SpectatorInfo[];
}

const ROOM_TTL_MS = 5 * 60 * 1000; // 5 minutes without host heartbeat

// ============================================================
// Helpers
// ============================================================

function packState(state: Partial<ShifaratRoomState>): string {
  return JSON.stringify(state);
}

function unpackState(json: string): Partial<ShifaratRoomState> {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

// ============================================================
// Room CRUD (async — Turso)
// ============================================================

export async function createShifaratRoom(
  code: string,
  hostName: string,
): Promise<ShifaratRoomState> {
  const now = Date.now();
  const state: ShifaratRoomState = {
    code,
    hostName,
    createdAt: now,
    hostLastSeen: now,
    gameMode: 'diwaniya',
    phase: 'setup',
    viewMode: 'team',
    board: [],
    redTeam: { name: 'الفريق الأحمر', score: 0, spymaster: null, wordsRemaining: 9 },
    blueTeam: { name: 'الفريق الأزرق', score: 0, spymaster: null, wordsRemaining: 8 },
    startingTeam: 'red',
    currentTeam: 'red',
    roundNumber: 1,
    currentClue: null,
    guessesThisTurn: 0,
    guessesAllowed: 0,
    lastGuessResult: null,
    timerDuration: 60,
    timerRemaining: 60,
    isTimerActive: false,
    clues: [],
    gameLog: [],
    selectedCategories: [],
    winner: null,
    winReason: null,
    players: [],
    spectators: [],
  };

  await turso.createRoom({
    id: `shifarat_${code}`,
    code,
    hostName,
    playerCount: 0,
    phase: 'setup',
    stateJson: packState(state),
    gameType: 'shifarat',
  });

  return state;
}

export async function getShifaratRoom(code: string): Promise<ShifaratRoomState | null> {
  const room = await turso.getRoomByCode(code);
  if (!room) return null;

  // Match rooms explicitly tagged as 'shifarat' OR rooms created via the generic
  // /api/room POST (gameType null/undefined) — shifarat DiwaniyaSetup uses the
  // generic endpoint without setting gameType.
  if (room.gameType && room.gameType !== 'shifarat') return null;

  if (room.phase === 'deleted') return null;

  const lastSeen = new Date(room.hostLastSeen).getTime();
  if (Date.now() - lastSeen > ROOM_TTL_MS) {
    await deleteShifaratRoom(code);
    return null;
  }

  const state = unpackState(room.stateJson) as ShifaratRoomState;

  const merged: ShifaratRoomState = {
    code,
    hostName: state.hostName ?? room.hostName,
    createdAt: state.createdAt ?? new Date(room.createdAt).getTime(),
    hostLastSeen: lastSeen,
    gameMode: state.gameMode ?? 'diwaniya',
    phase: state.phase ?? (room.phase as GamePhase) ?? 'setup',
    viewMode: state.viewMode ?? 'team',
    board: state.board ?? [],
    redTeam: state.redTeam ?? { name: 'الفريق الأحمر', score: 0, spymaster: null, wordsRemaining: 9 },
    blueTeam: state.blueTeam ?? { name: 'الفريق الأزرق', score: 0, spymaster: null, wordsRemaining: 8 },
    startingTeam: state.startingTeam ?? 'red',
    currentTeam: state.currentTeam ?? 'red',
    roundNumber: state.roundNumber ?? 1,
    currentClue: state.currentClue ?? null,
    guessesThisTurn: state.guessesThisTurn ?? 0,
    guessesAllowed: state.guessesAllowed ?? 0,
    lastGuessResult: state.lastGuessResult ?? null,
    timerDuration: state.timerDuration ?? 60,
    timerRemaining: state.timerRemaining ?? 60,
    isTimerActive: state.isTimerActive ?? false,
    clues: state.clues ?? [],
    gameLog: state.gameLog ?? [],
    selectedCategories: state.selectedCategories ?? [],
    winner: state.winner ?? null,
    winReason: state.winReason ?? null,
    players: state.players ?? [],
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

export async function updateShifaratRoom(
  code: string,
  data: Partial<ShifaratRoomState>,
): Promise<ShifaratRoomState | null> {
  const existing = await getShifaratRoom(code);
  if (!existing) return null;

  const merged: ShifaratRoomState = {
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

export async function heartbeatShifaratRoom(code: string): Promise<boolean> {
  const room = await turso.getRoomByCode(code);
  if (!room) return false;
  if (room.gameType && room.gameType !== 'shifarat') return false;

  await turso.updateRoom(code, { hostLastSeen: new Date().toISOString() });
  return true;
}

export async function deleteShifaratRoom(code: string): Promise<boolean> {
  try {
    const room = await turso.getRoomByCode(code);
    if (!room) return false;
    if (room.gameType && room.gameType !== 'shifarat') return false;

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
): Promise<ShifaratRoomState | null> {
  const room = await getShifaratRoom(code);
  if (!room) return null;

  const id = `spec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  room.spectators = room.spectators.filter((s) => s.name !== name);
  room.spectators.push({
    id,
    name,
    joinedAt: Date.now(),
    lastSeen: Date.now(),
  });

  return updateShifaratRoom(code, { spectators: room.spectators });
}

export async function heartbeatSpectator(
  code: string,
  spectatorId: string,
): Promise<boolean> {
  const room = await getShifaratRoom(code);
  if (!room) return false;

  const spec = room.spectators.find((s) => s.id === spectatorId);
  if (!spec) return false;
  spec.lastSeen = Date.now();

  await updateShifaratRoom(code, { spectators: room.spectators });
  return true;
}

export async function removeSpectator(
  code: string,
  spectatorId: string,
): Promise<boolean> {
  const room = await getShifaratRoom(code);
  if (!room) return false;

  const idx = room.spectators.findIndex((s) => s.id === spectatorId);
  if (idx === -1) return false;
  room.spectators.splice(idx, 1);

  await updateShifaratRoom(code, { spectators: room.spectators });
  return true;
}

// ============================================================
// Generic state broadcast (host → spectators)
// ============================================================

export async function broadcastState(
  code: string,
  payload: Partial<ShifaratRoomState>,
): Promise<ShifaratRoomState | null> {
  return updateShifaratRoom(code, payload);
}
