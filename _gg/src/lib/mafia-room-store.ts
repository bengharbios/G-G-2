// ============================================================
// المافيا (Mafia) - Room Store using Turso
// Uses the Room table with gameType='mafia' and stateJson
// Cloned from tobol-room-store.ts and adapted to mafia's state shape
// (see /src/lib/game-store.ts for the canonical Zustand state)
// ============================================================

import * as turso from './turso';
import type {
  Player,
  GamePhase,
  NightActions,
  Vote,
  EliminationEvent,
  GameLogEntry,
  RoleType,
} from './game-types';

// ── Spectator info (read-only viewers) ──────────────────────
export interface SpectatorInfo {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
}

// ── Day results (stored after night processing) ─────────────
export interface DayResults {
  killedByMafia: Player | null;
  killedBySniper: Player | null;
  sniperSelfKilled: Player | null;
  medicSaved: boolean;
  silencedPlayer: Player | null;
  voteEliminated: Player | null;
  voteEvent: EliminationEvent | null;
  voteResults: Record<string, number>;
}

// ── Mafia room state shape (mirrors game-store state) ───────
export interface MafiaRoomState {
  code: string;
  hostName: string;
  createdAt: number;
  hostLastSeen: number;

  // Game mode + host
  gameMode: 'godfather' | 'diwaniya' | null;

  // Game state
  players: Player[];
  phase: GamePhase;
  round: number;
  nightActions: NightActions;
  votes: Vote[];
  eliminatedPlayers: EliminationEvent[];
  revealedCards: Record<string, RoleType>;
  gameWinner: 'mafia' | 'citizen' | null;
  gameLog: GameLogEntry[];

  // UI state
  firstNightSkipped: boolean;
  currentMafiaViewIndex: number;
  currentDistributionIndex: number;
  showCard: boolean;
  selectedTarget: string | null;
  discussionTimeLeft: number;
  goodSonTarget: string | null;
  showRolesToHost: boolean;

  // Day results (stored after night processing)
  dayResults: DayResults | null;
  nightEvents: EliminationEvent[];
  nightLog: GameLogEntry[];

  // Spectator list (managed here, not by the host store)
  spectators: SpectatorInfo[];
}

const ROOM_TTL_MS = 5 * 60 * 1000; // 5 minutes without host heartbeat

// ============================================================
// Helpers
// ============================================================

function packState(state: Partial<MafiaRoomState>): string {
  return JSON.stringify(state);
}

function unpackState(json: string): Partial<MafiaRoomState> {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

// ============================================================
// Room CRUD (async — Turso)
// ============================================================

export async function createMafiaRoom(
  code: string,
  hostName: string,
): Promise<MafiaRoomState> {
  const now = Date.now();
  const state: MafiaRoomState = {
    code,
    hostName,
    createdAt: now,
    hostLastSeen: now,
    gameMode: 'diwaniya',
    players: [],
    phase: 'setup',
    round: 0,
    nightActions: {
      bossTarget: null,
      silencerTarget: null,
      medicTarget: null,
      sniperTarget: null,
      sniperShooting: false,
    },
    votes: [],
    eliminatedPlayers: [],
    revealedCards: {},
    gameWinner: null,
    gameLog: [],
    firstNightSkipped: false,
    currentMafiaViewIndex: 0,
    currentDistributionIndex: 0,
    showCard: false,
    selectedTarget: null,
    discussionTimeLeft: 120,
    goodSonTarget: null,
    showRolesToHost: false,
    dayResults: null,
    nightEvents: [],
    nightLog: [],
    spectators: [],
  };

  await turso.createRoom({
    id: `mafia_${code}`,
    code,
    hostName,
    playerCount: 0,
    phase: 'setup',
    stateJson: packState(state),
    gameType: 'mafia',
  });

  return state;
}

export async function getMafiaRoom(code: string): Promise<MafiaRoomState | null> {
  const room = await turso.getRoomByCode(code);
  if (!room) return null;

  // Match rooms explicitly tagged as 'mafia' OR rooms created via the generic
  // /api/room POST (gameType null/undefined) — mafia DiwaniyaSetup uses the
  // generic endpoint without setting gameType.
  if (room.gameType && room.gameType !== 'mafia') return null;

  if (room.phase === 'deleted') return null;

  const lastSeen = new Date(room.hostLastSeen).getTime();
  if (Date.now() - lastSeen > ROOM_TTL_MS) {
    await deleteMafiaRoom(code);
    return null;
  }

  const state = unpackState(room.stateJson) as MafiaRoomState;

  const merged: MafiaRoomState = {
    code,
    hostName: state.hostName ?? room.hostName,
    createdAt: state.createdAt ?? new Date(room.createdAt).getTime(),
    hostLastSeen: lastSeen,
    gameMode: state.gameMode ?? 'diwaniya',
    players: state.players ?? [],
    phase: (state.phase ?? (room.phase as GamePhase) ?? 'setup') as GamePhase,
    round: state.round ?? (room.round || 0),
    nightActions: state.nightActions ?? {
      bossTarget: null,
      silencerTarget: null,
      medicTarget: null,
      sniperTarget: null,
      sniperShooting: false,
    },
    votes: state.votes ?? [],
    eliminatedPlayers: state.eliminatedPlayers ?? [],
    revealedCards: state.revealedCards ?? {},
    gameWinner: state.gameWinner ?? null,
    gameLog: state.gameLog ?? [],
    firstNightSkipped: state.firstNightSkipped ?? false,
    currentMafiaViewIndex: state.currentMafiaViewIndex ?? 0,
    currentDistributionIndex: state.currentDistributionIndex ?? 0,
    showCard: state.showCard ?? false,
    selectedTarget: state.selectedTarget ?? null,
    discussionTimeLeft: state.discussionTimeLeft ?? 120,
    goodSonTarget: state.goodSonTarget ?? null,
    showRolesToHost: state.showRolesToHost ?? false,
    dayResults: state.dayResults ?? null,
    nightEvents: state.nightEvents ?? [],
    nightLog: state.nightLog ?? [],
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

export async function updateMafiaRoom(
  code: string,
  data: Partial<MafiaRoomState>,
): Promise<MafiaRoomState | null> {
  const existing = await getMafiaRoom(code);
  if (!existing) return null;

  const merged: MafiaRoomState = {
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

export async function heartbeatMafiaRoom(code: string): Promise<boolean> {
  const room = await turso.getRoomByCode(code);
  if (!room) return false;
  if (room.gameType && room.gameType !== 'mafia') return false;

  await turso.updateRoom(code, { hostLastSeen: new Date().toISOString() });
  return true;
}

export async function deleteMafiaRoom(code: string): Promise<boolean> {
  try {
    const room = await turso.getRoomByCode(code);
    if (!room) return false;
    if (room.gameType && room.gameType !== 'mafia') return false;

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
): Promise<MafiaRoomState | null> {
  const room = await getMafiaRoom(code);
  if (!room) return null;

  const id = `spec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  room.spectators = room.spectators.filter((s) => s.name !== name);
  room.spectators.push({
    id,
    name,
    joinedAt: Date.now(),
    lastSeen: Date.now(),
  });

  return updateMafiaRoom(code, { spectators: room.spectators });
}

export async function heartbeatSpectator(
  code: string,
  spectatorId: string,
): Promise<boolean> {
  const room = await getMafiaRoom(code);
  if (!room) return false;

  const spec = room.spectators.find((s) => s.id === spectatorId);
  if (!spec) return false;
  spec.lastSeen = Date.now();

  await updateMafiaRoom(code, { spectators: room.spectators });
  return true;
}

export async function removeSpectator(
  code: string,
  spectatorId: string,
): Promise<boolean> {
  const room = await getMafiaRoom(code);
  if (!room) return false;

  const idx = room.spectators.findIndex((s) => s.id === spectatorId);
  if (idx === -1) return false;
  room.spectators.splice(idx, 1);

  await updateMafiaRoom(code, { spectators: room.spectators });
  return true;
}

// ============================================================
// Generic state broadcast (host → spectators)
// ============================================================

export async function broadcastState(
  code: string,
  payload: Partial<MafiaRoomState>,
): Promise<MafiaRoomState | null> {
  return updateMafiaRoom(code, payload);
}
