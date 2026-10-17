// ============================================================
// اختلاف الصور (Spot the Difference) - Room Store
// Uses the Room table with gameType='spotdiff' and stateJson
// Mirrors the structure of mustathib-room-store.ts
//
// Extended for the diwaniya (multiplayer watch) flow:
//   - Spectators now have a `status` field: 'pending' | 'approved' | 'rejected' | 'playing' | 'finished'
//   - Each spectator has their own score, foundDifferences, totalFound, totalMisses
//   - Host can approve/reject spectators before starting the battle
//   - When host clicks 'start battle', all approved spectators become 'playing'
//   - Each spectator plays independently — clicks send find/miss actions
//   - First spectator to find all differences (or highest score when time runs out) wins
// ============================================================

import * as turso from './turso';

export type SpotDiffSpectatorStatus = 'pending' | 'approved' | 'rejected' | 'playing' | 'finished';

export interface SpotDiffSpectatorInfo {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
  // Approval flow (host controls who can play)
  status: SpotDiffSpectatorStatus;
  // Per-spectator game state (filled when status === 'playing' or 'finished')
  score: number;
  foundDifferences: string[];  // diff IDs this spectator has found
  totalFound: number;
  totalMisses: number;
  hasFinished: boolean;
  // Auth user info (if spectator was authed when joining)
  authedUserId?: string | null;
  avatar?: string | null;
  frame?: string | null;
  displayName?: string | null;
}

export interface SpotDiffRoomState {
  code: string;
  hostName: string;
  createdAt: number;
  hostLastSeen: number;
  phase: string;  // 'setup' | 'playing' | 'game_over' (host's view of the room)
  round: number;
  difficulty: string;
  totalRounds: number;
  currentRoundId: string | null;
  // Round config (host sets in GameSetup, spectators read when they join)
  timerValueSec: number;
  fastestFinish: boolean;
  wrongCount: number;
  flashiCategory: string;
  foundDifferences: string[];  // host's own (kept for compat — unused in diwaniya)
  score: number;  // host's own score (unused in diwaniya — host doesn't play)
  timeLeft: number;
  totalDifferences: number;
  totalFound: number;
  totalMisses: number;
  roundsPlayed: number;
  gameLog: Array<{ round: number; message: string; type: string; timestamp: number }>;
  lastAction: string | null;
  playerName: string | null;
  spectators: SpotDiffSpectatorInfo[];
  // Battle start timestamp (so spectators can sync their timers)
  battleStartedAt: number | null;
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
    timerValueSec: 60,
    fastestFinish: false,
    wrongCount: 5,
    flashiCategory: 'random',
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
    battleStartedAt: null,
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
    // Drop spectators who haven't sent a heartbeat in 30s
    state.spectators = state.spectators.filter(s => Date.now() - s.lastSeen < 30000);
  }
  // Backfill new fields for older rooms (defensive defaults)
  state.timerValueSec = state.timerValueSec ?? 60;
  state.fastestFinish = state.fastestFinish ?? false;
  state.wrongCount = state.wrongCount ?? 5;
  state.flashiCategory = state.flashiCategory ?? 'random';
  state.battleStartedAt = state.battleStartedAt ?? null;
  if (state.spectators) {
    state.spectators = state.spectators.map(s => ({
      status: s.status ?? 'pending',
      score: s.score ?? 0,
      foundDifferences: s.foundDifferences ?? [],
      totalFound: s.totalFound ?? 0,
      totalMisses: s.totalMisses ?? 0,
      hasFinished: s.hasFinished ?? false,
      authedUserId: s.authedUserId ?? null,
      avatar: s.avatar ?? null,
      frame: s.frame ?? null,
      displayName: s.displayName ?? null,
      ...s,
    }));
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

export async function addSpotDiffSpectator(
  code: string,
  name: string,
  authInfo?: { userId?: string; avatar?: string; frame?: string; displayName?: string }
): Promise<SpotDiffRoomState | null> {
  const room = await getSpotDiffRoom(code);
  if (!room) return null;

  const id = `spec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  // Remove any existing spectator with the same name (avoids dupes on reconnect)
  room.spectators = room.spectators.filter(s => s.name !== name);
  // If the room is already in 'playing' phase, late joiners start as 'playing'
  // (they can catch up — the round image is shared via currentRoundId)
  const status: SpotDiffSpectatorStatus = room.phase === 'playing' ? 'playing' : 'pending';

  room.spectators.push({
    id,
    name,
    joinedAt: Date.now(),
    lastSeen: Date.now(),
    status,
    score: 0,
    foundDifferences: [],
    totalFound: 0,
    totalMisses: 0,
    hasFinished: false,
    authedUserId: authInfo?.userId ?? null,
    avatar: authInfo?.avatar ?? null,
    frame: authInfo?.frame ?? null,
    displayName: authInfo?.displayName ?? null,
  });

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

// ============================================================
// Host approval flow (NEW)
// ============================================================

export async function setSpectatorStatus(
  code: string,
  spectatorId: string,
  status: SpotDiffSpectatorStatus
): Promise<SpotDiffRoomState | null> {
  const room = await getSpotDiffRoom(code);
  if (!room) return null;

  const spec = room.spectators.find(s => s.id === spectatorId);
  if (!spec) return null;
  spec.status = status;

  return updateSpotDiffRoom(code, { spectators: room.spectators });
}

export async function approveSpotDiffSpectator(code: string, spectatorId: string): Promise<SpotDiffRoomState | null> {
  return setSpectatorStatus(code, spectatorId, 'approved');
}

export async function rejectSpotDiffSpectator(code: string, spectatorId: string): Promise<SpotDiffRoomState | null> {
  return setSpectatorStatus(code, spectatorId, 'rejected');
}

// ============================================================
// Battle start (NEW) — host triggers this after approvals
// ============================================================

export async function startSpotDiffBattle(
  code: string,
  roundData: {
    currentRoundId: string;
    currentRoundImageUrl: string;
    currentRoundImageShift: number;
    currentRoundFlashiDiffs: Array<{ topVmin: number; leftVmin: number }>;
    totalDifferences: number;
    timerValueSec: number;
  }
): Promise<SpotDiffRoomState | null> {
  const room = await getSpotDiffRoom(code);
  if (!room) return null;

  // Promote all 'approved' spectators to 'playing'
  room.spectators = room.spectators.map(s => {
    if (s.status === 'approved') {
      return {
        ...s,
        status: 'playing' as SpotDiffSpectatorStatus,
        score: 0,
        foundDifferences: [],
        totalFound: 0,
        totalMisses: 0,
        hasFinished: false,
      };
    }
    return s;
  });

  room.phase = 'playing';
  room.round = (room.round || 0) + 1;
  room.currentRoundId = roundData.currentRoundId;
  // Stash round image + diff data into gameLog (cheap, avoids schema bump)
  room.timerValueSec = roundData.timerValueSec;
  room.totalDifferences = roundData.totalDifferences;
  room.timeLeft = roundData.timerValueSec;
  room.battleStartedAt = Date.now();
  // Stash the round's image + diff data so spectators can fetch it
  // (we piggyback on gameLog's type field as a 'round_setup' entry)
  room.gameLog = [
    ...room.gameLog,
    {
      round: room.round,
      message: `▶️ بدأت المعركة — الجولة ${room.round}`,
      type: 'round_setup',
      timestamp: Date.now(),
    },
  ];
  room.lastAction = `▶️ بدأت المعركة — الجولة ${room.round}`;

  // Stash round image + diffs in a separate field via JSON-encoded message
  // (we'll use a special prefix in lastAction to carry the data)
  // NOTE: This is a hack — a proper schema would store these as separate columns.
  // For now, spectators fetch round image directly from /img/spotdiff/images/{category}/{filename}.jpg
  // using the currentRoundId (which is `flashi-${roundIdx}-${filename slice}-${timestamp}`)
  // — they decode the filename to get diffs locally.

  return updateSpotDiffRoom(code, room);
}

// ============================================================
// Spectator game actions (NEW) — find/miss recorded per-spectator
// ============================================================

export async function recordSpectatorFound(
  code: string,
  spectatorId: string,
  diffId: string,
  scorePerHit: number = 100
): Promise<{ room: SpotDiffRoomState | null; spectator: SpotDiffSpectatorInfo | null; alreadyFound: boolean }> {
  const room = await getSpotDiffRoom(code);
  if (!room) return { room: null, spectator: null, alreadyFound: false };

  const spec = room.spectators.find(s => s.id === spectatorId);
  if (!spec) return { room: null, spectator: null, alreadyFound: false };
  if (spec.status !== 'playing') return { room: null, spectator: null, alreadyFound: false };

  if (spec.foundDifferences.includes(diffId)) {
    return { room, spectator: spec, alreadyFound: true };
  }

  spec.foundDifferences = [...spec.foundDifferences, diffId];
  spec.score += scorePerHit;
  spec.totalFound += 1;

  // If this spectator found all differences in the round → mark finished
  if (room.totalDifferences > 0 && spec.foundDifferences.length >= room.totalDifferences) {
    spec.hasFinished = true;
    spec.status = 'finished';
  }

  const updated = await updateSpotDiffRoom(code, { spectators: room.spectators });
  return { room: updated, spectator: spec, alreadyFound: false };
}

export async function recordSpectatorMiss(
  code: string,
  spectatorId: string,
  penaltyPerMiss: number = 10
): Promise<{ room: SpotDiffRoomState | null; spectator: SpotDiffSpectatorInfo | null }> {
  const room = await getSpotDiffRoom(code);
  if (!room) return { room: null, spectator: null };

  const spec = room.spectators.find(s => s.id === spectatorId);
  if (!spec) return { room: null, spectator: null };
  if (spec.status !== 'playing') return { room: null, spectator: null };

  spec.score = Math.max(0, spec.score - penaltyPerMiss);
  spec.totalMisses += 1;

  const updated = await updateSpotDiffRoom(code, { spectators: room.spectators });
  return { room: updated, spectator: spec };
}

export async function finishSpectator(code: string, spectatorId: string): Promise<SpotDiffRoomState | null> {
  const room = await getSpotDiffRoom(code);
  if (!room) return null;

  const spec = room.spectators.find(s => s.id === spectatorId);
  if (!spec) return null;
  spec.hasFinished = true;
  spec.status = 'finished';

  return updateSpotDiffRoom(code, { spectators: room.spectators });
}

// ============================================================
// Host ends the battle (when time runs out or all spectators finished)
// ============================================================

export async function endSpotDiffBattle(code: string): Promise<SpotDiffRoomState | null> {
  const room = await getSpotDiffRoom(code);
  if (!room) return null;

  room.phase = 'game_over';
  room.timeLeft = 0;
  // Mark any still-playing spectators as finished
  room.spectators = room.spectators.map(s =>
    s.status === 'playing' ? { ...s, status: 'finished' as SpotDiffSpectatorStatus, hasFinished: true } : s
  );
  room.lastAction = `🏆 انتهت المعركة`;
  room.gameLog = [...room.gameLog, {
    round: room.round,
    message: `🏆 انتهت المعركة`,
    type: 'system',
    timestamp: Date.now(),
  }];

  return updateSpotDiffRoom(code, room);
}
