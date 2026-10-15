// ============================================================
// الهروب من التابوت (Tabot) - Room Store using Turso
// Uses the Room table with gameType='tabot' and stateJson
// Cloned from tobol-room-store.ts and adapted to tabot's state shape
// (see /src/lib/tabot-store.ts for the canonical Zustand state)
// ============================================================

import * as turso from './turso';

// ── Spectator info (read-only viewers) ──────────────────────
export interface SpectatorInfo {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
}

// ── Tabot room state shape (mirrors tabot-store's syncToRoom payload) ──
export interface TabotRoomState {
  code: string;
  hostName: string;
  createdAt: number;
  hostLastSeen: number;
  phase: string;
  currentRound: number;

  // Game state (synced by host via /api/room/[code] PUT or our action POST)
  teamAlphaName: string;
  teamBetaName: string;
  players: Array<{
    id: string;
    name: string;
    team: 'alpha' | 'beta';
    role: string;
    status: 'active' | 'imprisoned' | 'killed';
    avatar: string;
  }>;
  doors: Array<{
    id: number;
    outcome: string;
    isRevealed: boolean;
    revealedBy: string | null;
  }>;
  currentPlayerIndex: number;
  currentTeam: 'alpha' | 'beta';
  lastRevealedDoor: {
    id: number;
    outcome: string;
    isRevealed: boolean;
    revealedBy: string | null;
  } | null;
  interactionState: string;
  votingForTeam: 'alpha' | 'beta' | null;
  teamVotes: Record<string, string | null>;
  roundLog: Array<{ round: number; message: string; type: string; timestamp: number }>;
  winner: 'alpha' | 'beta' | 'draw' | null;
  winReason: string;

  // Spectator list (managed here, not by the host store)
  spectators: SpectatorInfo[];
}

const ROOM_TTL_MS = 5 * 60 * 1000; // 5 minutes without host heartbeat

// ============================================================
// Helpers
// ============================================================

function packState(state: Partial<TabotRoomState>): string {
  return JSON.stringify(state);
}

function unpackState(json: string): Partial<TabotRoomState> {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

// ============================================================
// Room CRUD (async — Turso)
// ============================================================

export async function createTabotRoom(code: string, hostName: string): Promise<TabotRoomState> {
  const now = Date.now();
  const state: TabotRoomState = {
    code,
    hostName,
    createdAt: now,
    hostLastSeen: now,
    phase: 'setup',
    currentRound: 1,
    teamAlphaName: 'فريق الرعب',
    teamBetaName: 'فريق الظلام',
    players: [],
    doors: [],
    currentPlayerIndex: -1,
    currentTeam: 'alpha',
    lastRevealedDoor: null,
    interactionState: 'none',
    votingForTeam: null,
    teamVotes: {},
    roundLog: [],
    winner: null,
    winReason: '',
    spectators: [],
  };

  await turso.createRoom({
    id: `tabot_${code}`,
    code,
    hostName,
    playerCount: 0,
    phase: 'setup',
    stateJson: packState(state),
    gameType: 'tabot',
  });

  return state;
}

export async function getTabotRoom(code: string): Promise<TabotRoomState | null> {
  const room = await turso.getRoomByCode(code);
  if (!room) return null;

  // Match rooms explicitly tagged as 'tabot' OR rooms created via the generic
  // /api/room POST (gameType null/undefined) — both are valid for tabot.
  if (room.gameType && room.gameType !== 'tabot') return null;

  // Skip soft-deleted rooms
  if (room.phase === 'deleted') return null;

  // Expire rooms whose host hasn't sent a heartbeat in 5 minutes
  const lastSeen = new Date(room.hostLastSeen).getTime();
  if (Date.now() - lastSeen > ROOM_TTL_MS) {
    await deleteTabotRoom(code);
    return null;
  }

  const state = unpackState(room.stateJson) as TabotRoomState;

  // Merge with row-level fields (hostName / phase / currentRound come from the
  // Room row if not present in stateJson, ensuring we never lose them).
  const merged: TabotRoomState = {
    code,
    hostName: state.hostName ?? room.hostName,
    createdAt: state.createdAt ?? new Date(room.createdAt).getTime(),
    hostLastSeen: lastSeen,
    phase: state.phase ?? room.phase,
    currentRound: state.currentRound ?? (room.round || 1),
    teamAlphaName: state.teamAlphaName ?? 'فريق الرعب',
    teamBetaName: state.teamBetaName ?? 'فريق الظلام',
    players: state.players ?? [],
    doors: state.doors ?? [],
    currentPlayerIndex: state.currentPlayerIndex ?? -1,
    currentTeam: state.currentTeam ?? 'alpha',
    lastRevealedDoor: state.lastRevealedDoor ?? null,
    interactionState: state.interactionState ?? 'none',
    votingForTeam: state.votingForTeam ?? null,
    teamVotes: state.teamVotes ?? {},
    roundLog: state.roundLog ?? [],
    winner: state.winner ?? null,
    winReason: state.winReason ?? '',
    spectators: state.spectators ?? [],
  };

  // Clean stale spectators (haven't sent heartbeat in 30s)
  if (merged.spectators) {
    merged.spectators = merged.spectators.filter(
      (s) => Date.now() - s.lastSeen < 30000,
    );
  }

  return merged;
}

export async function updateTabotRoom(
  code: string,
  data: Partial<TabotRoomState>,
): Promise<TabotRoomState | null> {
  const existing = await getTabotRoom(code);
  if (!existing) return null;

  const merged: TabotRoomState = { ...existing, ...data, hostLastSeen: Date.now() };
  await turso.updateRoom(code, {
    stateJson: packState(merged),
    hostLastSeen: new Date().toISOString(),
    phase: merged.phase,
  });

  return merged;
}

export async function heartbeatTabotRoom(code: string): Promise<boolean> {
  const room = await turso.getRoomByCode(code);
  if (!room) return false;
  if (room.gameType && room.gameType !== 'tabot') return false;

  await turso.updateRoom(code, { hostLastSeen: new Date().toISOString() });
  return true;
}

export async function deleteTabotRoom(code: string): Promise<boolean> {
  try {
    const room = await turso.getRoomByCode(code);
    if (!room) return false;
    if (room.gameType && room.gameType !== 'tabot') return false;

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
): Promise<TabotRoomState | null> {
  const room = await getTabotRoom(code);
  if (!room) return null;

  const id = `spec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  room.spectators = room.spectators.filter((s) => s.name !== name);
  room.spectators.push({
    id,
    name,
    joinedAt: Date.now(),
    lastSeen: Date.now(),
  });

  return updateTabotRoom(code, { spectators: room.spectators });
}

export async function heartbeatSpectator(
  code: string,
  spectatorId: string,
): Promise<boolean> {
  const room = await getTabotRoom(code);
  if (!room) return false;

  const spec = room.spectators.find((s) => s.id === spectatorId);
  if (!spec) return false;
  spec.lastSeen = Date.now();

  await updateTabotRoom(code, { spectators: room.spectators });
  return true;
}

export async function removeSpectator(
  code: string,
  spectatorId: string,
): Promise<boolean> {
  const room = await getTabotRoom(code);
  if (!room) return false;

  const idx = room.spectators.findIndex((s) => s.id === spectatorId);
  if (idx === -1) return false;
  room.spectators.splice(idx, 1);

  await updateTabotRoom(code, { spectators: room.spectators });
  return true;
}

// ============================================================
// Generic state broadcast (host → spectators)
// Host calls POST /api/tabot-room/[code]/action with the latest stateJson
// payload from its zustand store. We merge and persist.
// ============================================================

export async function broadcastState(
  code: string,
  payload: Partial<TabotRoomState>,
): Promise<TabotRoomState | null> {
  return updateTabotRoom(code, payload);
}
