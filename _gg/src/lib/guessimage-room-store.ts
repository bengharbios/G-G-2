// ============================================================
// خمن الصورة (Guess Image) - Room Store
// Uses the Room table with gameType='guessimage' and stateJson
// Mirrors the structure of spotdiff-room-store.ts
//
// Extended for the diwaniya (multiplayer watch) flow:
//   - Spectators have a `status` field: 'pending' | 'approved' | 'rejected' | 'playing' | 'finished'
//   - Each spectator has their own score, revealedSquares, totalCorrect, totalWrong
//   - Host can approve/reject spectators before starting the battle
//   - When host clicks 'start battle', all approved spectators become 'playing'
//   - Each spectator plays independently — clicks send correct-guess / wrong-guess actions
//   - First spectator to guess correctly (or highest score when time runs out) wins
// ============================================================

import * as turso from './turso';

export type GuessImageSpectatorStatus = 'pending' | 'approved' | 'rejected' | 'playing' | 'finished';

export interface GuessImageSpectatorInfo {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
  // Approval flow (host controls who can play)
  status: GuessImageSpectatorStatus;
  // Per-spectator game state (filled when status === 'playing' or 'finished')
  score: number;
  revealedSquares: string[];     // square IDs this spectator has revealed
  totalCorrect: number;          // correct guesses
  totalWrong: number;            // wrong guesses
  hasFinished: boolean;
  // Auth user info (if spectator was authed when joining)
  authedUserId?: string | null;
  avatar?: string | null;
  frame?: string | null;
  displayName?: string | null;
}

export interface GuessImageRoomState {
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
  themeId: number;
  gridSize: number;             // total squares in the grid (e.g., 16, 25, 36, 49)
  maxReveals: number;            // max squares a spectator can reveal
  scorePerCorrect: number;
  penaltyPerWrong: number;
  // Current round data (the host's pick — spectators see the same image)
  currentRoundImageId: number | null;
  currentRoundImageUrl: string | null;
  currentRoundChoices: string[];          // 4 multi-choice options
  currentRoundCorrectChoiceIndex: number; // 0..3
  currentRoundAnswer: string | null;      // the actual label (for verification)
  // Host's own state (kept for compat — unused in diwaniya)
  revealedSquares: string[];
  score: number;                 // host's own score (unused in diwaniya — host doesn't play)
  timeLeft: number;
  totalDifferences: number;      // alias for totalRounds for compat (unused)
  totalFound: number;
  totalMisses: number;
  roundsPlayed: number;
  gameLog: Array<{ round: number; message: string; type: string; timestamp: number }>;
  lastAction: string | null;
  playerName: string | null;
  spectators: GuessImageSpectatorInfo[];
  // Battle start timestamp (so spectators can sync their timers)
  battleStartedAt: number | null;
}

const ROOM_TTL_MS = 5 * 60 * 1000; // 5 minutes

function packState(state: Partial<GuessImageRoomState>): string {
  return JSON.stringify(state);
}

function unpackState(json: string): Partial<GuessImageRoomState> {
  try { return JSON.parse(json); } catch { return {}; }
}

// ============================================================
// CRUD (async — Turso)
// ============================================================

export async function createGuessImageRoom(code: string, hostName: string): Promise<GuessImageRoomState> {
  const now = Date.now();
  const state: GuessImageRoomState = {
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
    themeId: 1,
    gridSize: 25,
    maxReveals: 10,
    scorePerCorrect: 700,
    penaltyPerWrong: 30,
    currentRoundImageId: null,
    currentRoundImageUrl: null,
    currentRoundChoices: [],
    currentRoundCorrectChoiceIndex: 0,
    currentRoundAnswer: null,
    revealedSquares: [],
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
    id: `guessimage_${code}`,
    code,
    hostName,
    playerCount: 1,
    phase: 'setup',
    stateJson: packState(state),
    gameType: 'guessimage',
  });

  return state;
}

export async function getGuessImageRoom(code: string): Promise<GuessImageRoomState | null> {
  const room = await turso.getRoomByCode(code);
  if (!room || room.gameType !== 'guessimage') return null;
  if (room.phase === 'deleted') return null;

  const lastSeen = new Date(room.hostLastSeen).getTime();
  if (Date.now() - lastSeen > ROOM_TTL_MS) {
    await deleteGuessImageRoom(code);
    return null;
  }

  const state = unpackState(room.stateJson) as GuessImageRoomState;
  if (state.spectators) {
    // Drop spectators who haven't sent a heartbeat in 30s
    state.spectators = state.spectators.filter(s => Date.now() - s.lastSeen < 30000);
  }
  // Backfill new fields for older rooms (defensive defaults)
  state.timerValueSec = state.timerValueSec ?? 60;
  state.themeId = state.themeId ?? 1;
  state.gridSize = state.gridSize ?? 25;
  state.maxReveals = state.maxReveals ?? 10;
  state.scorePerCorrect = state.scorePerCorrect ?? 700;
  state.penaltyPerWrong = state.penaltyPerWrong ?? 30;
  state.currentRoundImageId = state.currentRoundImageId ?? null;
  state.currentRoundImageUrl = state.currentRoundImageUrl ?? null;
  state.currentRoundChoices = state.currentRoundChoices ?? [];
  state.currentRoundCorrectChoiceIndex = state.currentRoundCorrectChoiceIndex ?? 0;
  state.currentRoundAnswer = state.currentRoundAnswer ?? null;
  state.battleStartedAt = state.battleStartedAt ?? null;
  if (state.spectators) {
    state.spectators = state.spectators.map(s => ({
      ...s,
      status: s.status ?? 'pending',
      score: s.score ?? 0,
      revealedSquares: s.revealedSquares ?? [],
      totalCorrect: s.totalCorrect ?? 0,
      totalWrong: s.totalWrong ?? 0,
      hasFinished: s.hasFinished ?? false,
      authedUserId: s.authedUserId ?? null,
      avatar: s.avatar ?? null,
      frame: s.frame ?? null,
      displayName: s.displayName ?? null,
    }));
  }

  return state;
}

export async function updateGuessImageRoom(code: string, data: Partial<GuessImageRoomState>): Promise<GuessImageRoomState | null> {
  const existing = await getGuessImageRoom(code);
  if (!existing) return null;

  const merged: GuessImageRoomState = { ...existing, ...data, hostLastSeen: Date.now() };
  await turso.updateRoom(code, {
    stateJson: packState(merged),
    hostLastSeen: new Date().toISOString(),
    phase: merged.phase,
  });

  return merged;
}

export async function heartbeatGuessImageRoom(code: string): Promise<boolean> {
  const room = await turso.getRoomByCode(code);
  if (!room || room.gameType !== 'guessimage') return false;

  await turso.updateRoom(code, { hostLastSeen: new Date().toISOString() });
  return true;
}

export async function deleteGuessImageRoom(code: string): Promise<boolean> {
  try {
    const room = await turso.getRoomByCode(code);
    if (!room || room.gameType !== 'guessimage') return false;

    await turso.updateRoom(code, { phase: 'deleted', stateJson: '{}' });
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Spectator management
// ============================================================

export async function addGuessImageSpectator(
  code: string,
  name: string,
  authInfo?: { userId?: string; avatar?: string; frame?: string; displayName?: string }
): Promise<GuessImageRoomState | null> {
  const room = await getGuessImageRoom(code);
  if (!room) return null;

  const id = `spec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  // Remove any existing spectator with the same name (avoids dupes on reconnect)
  room.spectators = room.spectators.filter(s => s.name !== name);
  // If the room is already in 'playing' phase, late joiners start as 'playing'
  const status: GuessImageSpectatorStatus = room.phase === 'playing' ? 'playing' : 'pending';

  room.spectators.push({
    id,
    name,
    joinedAt: Date.now(),
    lastSeen: Date.now(),
    status,
    score: 0,
    revealedSquares: [],
    totalCorrect: 0,
    totalWrong: 0,
    hasFinished: false,
    authedUserId: authInfo?.userId ?? null,
    avatar: authInfo?.avatar ?? null,
    frame: authInfo?.frame ?? null,
    displayName: authInfo?.displayName ?? null,
  });

  return updateGuessImageRoom(code, { spectators: room.spectators });
}

export async function heartbeatGuessImageSpectator(code: string, spectatorId: string): Promise<boolean> {
  const room = await getGuessImageRoom(code);
  if (!room) return false;

  const spec = room.spectators.find(s => s.id === spectatorId);
  if (!spec) return false;
  spec.lastSeen = Date.now();

  await updateGuessImageRoom(code, { spectators: room.spectators });
  return true;
}

export async function removeGuessImageSpectator(code: string, spectatorId: string): Promise<boolean> {
  const room = await getGuessImageRoom(code);
  if (!room) return false;

  const idx = room.spectators.findIndex(s => s.id === spectatorId);
  if (idx === -1) return false;
  room.spectators.splice(idx, 1);

  await updateGuessImageRoom(code, { spectators: room.spectators });
  return true;
}

// ============================================================
// Host approval flow
// ============================================================

export async function setSpectatorStatus(
  code: string,
  spectatorId: string,
  status: GuessImageSpectatorStatus
): Promise<GuessImageRoomState | null> {
  const room = await getGuessImageRoom(code);
  if (!room) return null;

  const spec = room.spectators.find(s => s.id === spectatorId);
  if (!spec) return null;
  spec.status = status;

  return updateGuessImageRoom(code, { spectators: room.spectators });
}

export async function approveGuessImageSpectator(code: string, spectatorId: string): Promise<GuessImageRoomState | null> {
  return setSpectatorStatus(code, spectatorId, 'approved');
}

export async function rejectGuessImageSpectator(code: string, spectatorId: string): Promise<GuessImageRoomState | null> {
  return setSpectatorStatus(code, spectatorId, 'rejected');
}

// ============================================================
// Battle start — host triggers this after approvals
// ============================================================

export async function startGuessImageBattle(
  code: string,
  roundData: {
    currentRoundId: string;
    currentRoundImageId: number;
    currentRoundImageUrl: string;
    currentRoundChoices: string[];
    currentRoundCorrectChoiceIndex: number;
    currentRoundAnswer: string;
    totalRounds: number;
    timerValueSec: number;
    gridSize: number;
    maxReveals: number;
    scorePerCorrect: number;
    penaltyPerWrong: number;
    difficulty: string;
    themeId: number;
  }
): Promise<GuessImageRoomState | null> {
  const room = await getGuessImageRoom(code);
  if (!room) return null;

  // Promote all 'approved' spectators to 'playing'
  room.spectators = room.spectators.map(s => {
    if (s.status === 'approved') {
      return {
        ...s,
        status: 'playing' as GuessImageSpectatorStatus,
        score: 0,
        revealedSquares: [],
        totalCorrect: 0,
        totalWrong: 0,
        hasFinished: false,
      };
    }
    return s;
  });

  room.phase = 'playing';
  room.round = (room.round || 0) + 1;
  room.currentRoundId = roundData.currentRoundId;
  room.currentRoundImageId = roundData.currentRoundImageId;
  room.currentRoundImageUrl = roundData.currentRoundImageUrl;
  room.currentRoundChoices = roundData.currentRoundChoices;
  room.currentRoundCorrectChoiceIndex = roundData.currentRoundCorrectChoiceIndex;
  room.currentRoundAnswer = roundData.currentRoundAnswer;
  room.totalRounds = roundData.totalRounds;
  room.timerValueSec = roundData.timerValueSec;
  room.timeLeft = roundData.timerValueSec;
  room.gridSize = roundData.gridSize;
  room.maxReveals = roundData.maxReveals;
  room.scorePerCorrect = roundData.scorePerCorrect;
  room.penaltyPerWrong = roundData.penaltyPerWrong;
  room.difficulty = roundData.difficulty;
  room.themeId = roundData.themeId;
  room.battleStartedAt = Date.now();
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

  return updateGuessImageRoom(code, room);
}

// ============================================================
// Spectator game actions — correct-guess / wrong-guess recorded per-spectator
// ============================================================

export async function recordSpectatorCorrectGuess(
  code: string,
  spectatorId: string,
  earnedScore: number
): Promise<{ room: GuessImageRoomState | null; spectator: GuessImageSpectatorInfo | null; alreadyFinished: boolean }> {
  const room = await getGuessImageRoom(code);
  if (!room) return { room: null, spectator: null, alreadyFinished: false };

  const spec = room.spectators.find(s => s.id === spectatorId);
  if (!spec) return { room: null, spectator: null, alreadyFinished: false };
  if (spec.status !== 'playing') return { room: null, spectator: null, alreadyFinished: false };

  // If already finished, no-op
  if (spec.hasFinished) {
    return { room, spectator: spec, alreadyFinished: true };
  }

  spec.totalCorrect += 1;
  spec.score += earnedScore;
  spec.hasFinished = true;
  spec.status = 'finished';

  const updated = await updateGuessImageRoom(code, { spectators: room.spectators });
  return { room: updated, spectator: spec, alreadyFinished: false };
}

export async function recordSpectatorWrongGuess(
  code: string,
  spectatorId: string,
  penalty: number
): Promise<{ room: GuessImageRoomState | null; spectator: GuessImageSpectatorInfo | null }> {
  const room = await getGuessImageRoom(code);
  if (!room) return { room: null, spectator: null };

  const spec = room.spectators.find(s => s.id === spectatorId);
  if (!spec) return { room: null, spectator: null };
  if (spec.status !== 'playing') return { room: null, spectator: null };

  spec.score = Math.max(0, spec.score - penalty);
  spec.totalWrong += 1;

  const updated = await updateGuessImageRoom(code, { spectators: room.spectators });
  return { room: updated, spectator: spec };
}

export async function recordSpectatorReveal(
  code: string,
  spectatorId: string,
  squareId: string
): Promise<{ room: GuessImageRoomState | null; spectator: GuessImageSpectatorInfo | null; alreadyRevealed: boolean; maxReached: boolean }> {
  const room = await getGuessImageRoom(code);
  if (!room) return { room: null, spectator: null, alreadyRevealed: false, maxReached: false };

  const spec = room.spectators.find(s => s.id === spectatorId);
  if (!spec) return { room: null, spectator: null, alreadyRevealed: false, maxReached: false };
  if (spec.status !== 'playing') return { room: null, spectator: null, alreadyRevealed: false, maxReached: false };

  // Already revealed?
  if (spec.revealedSquares.includes(squareId)) {
    return { room, spectator: spec, alreadyRevealed: true, maxReached: false };
  }
  // Max reveals reached?
  if (spec.revealedSquares.length >= room.maxReveals) {
    return { room, spectator: spec, alreadyRevealed: false, maxReached: true };
  }

  spec.revealedSquares = [...spec.revealedSquares, squareId];

  const updated = await updateGuessImageRoom(code, { spectators: room.spectators });
  return { room: updated, spectator: spec, alreadyRevealed: false, maxReached: false };
}

export async function finishSpectator(code: string, spectatorId: string): Promise<GuessImageRoomState | null> {
  const room = await getGuessImageRoom(code);
  if (!room) return null;

  const spec = room.spectators.find(s => s.id === spectatorId);
  if (!spec) return null;
  spec.hasFinished = true;
  spec.status = 'finished';

  return updateGuessImageRoom(code, { spectators: room.spectators });
}

// ============================================================
// Host ends the battle (when time runs out or all spectators finished)
// ============================================================

export async function endGuessImageBattle(code: string): Promise<GuessImageRoomState | null> {
  const room = await getGuessImageRoom(code);
  if (!room) return null;

  room.phase = 'game_over';
  room.timeLeft = 0;
  // Mark any still-playing spectators as finished
  room.spectators = room.spectators.map(s =>
    s.status === 'playing' ? { ...s, status: 'finished' as GuessImageSpectatorStatus, hasFinished: true } : s
  );
  room.lastAction = `🏆 انتهت المعركة`;
  room.gameLog = [...room.gameLog, {
    round: room.round,
    message: `🏆 انتهت المعركة`,
    type: 'system',
    timestamp: Date.now(),
  }];

  return updateGuessImageRoom(code, room);
}
