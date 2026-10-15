// ============================================================
// فاميلي فيود (FamilyFeud) - Room Store using Turso
// Uses the Room table with gameType='familyfeud' and stateJson
// Cloned from tobol-room-store.ts and adapted to familyfeud's state shape
// (see /src/lib/familyfeud-store.ts for the canonical Zustand state)
// ============================================================

import * as turso from './turso';
import type { Question, Answer } from './familyfeud-questions';

// ── Spectator info (read-only viewers) ──────────────────────
export interface SpectatorInfo {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
}

// ── FamilyFeud room state shape (mirrors familyfeud-store state) ──
export interface FamilyFeudRoomState {
  code: string;
  hostName: string;
  createdAt: number;
  hostLastSeen: number;

  // Phase + mode
  phase: string; // maps to familyfeud-store.gamePhase + uiPhase combined
  gameMode: string;
  uiPhase: string;
  gamePhase: string;
  showGameOver: boolean;

  // Team info
  team1Name: string;
  team2Name: string;
  team1Emoji: string;
  team2Emoji: string;
  team1Score: number;
  team2Score: number;
  currentTeam: 1 | 2;
  strikes: number;
  round: number;
  totalRounds: number;
  stealTimerDuration: number;
  roundTimerDuration: number;

  // Questions
  selectedQuestions: Question[];
  currentAnswers: Answer[];
  roundScore: number;

  // Fast money
  fmQuestions: Question[];
  fmAnswers1: string[];
  fmAnswers2: string[];
  fmRevealed1: boolean[];
  fmRevealed2: boolean[];
  fmScore1: number;
  fmScore2: number;
  timeLeft: number;
  timerRunning: boolean;
  fmPhase: string;
  fmSelected1: number[];
  fmSelected2: number[];

  // Regular round scores (before fast money)
  regularRoundScore1: number;
  regularRoundScore2: number;

  // Round timer
  roundTimeLeft: number;
  roundTimerRunning: boolean;

  // Round history + stats
  roundHistory: Array<{ round: number; team: 1 | 2; points: number; type: string }>;
  gameStats: {
    team1Correct: number;
    team2Correct: number;
    team1Strikes: number;
    team2Strikes: number;
    totalSteals: number;
    successfulSteals: number;
    fastMoneyScore1: number;
    fastMoneyScore2: number;
  };

  // Spectator list (managed here, not by the host store)
  spectators: SpectatorInfo[];
}

const ROOM_TTL_MS = 5 * 60 * 1000; // 5 minutes without host heartbeat

// ============================================================
// Helpers
// ============================================================

function packState(state: Partial<FamilyFeudRoomState>): string {
  return JSON.stringify(state);
}

function unpackState(json: string): Partial<FamilyFeudRoomState> {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

// ============================================================
// Room CRUD (async — Turso)
// ============================================================

export async function createFamilyFeudRoom(
  code: string,
  hostName: string,
): Promise<FamilyFeudRoomState> {
  const now = Date.now();
  const state: FamilyFeudRoomState = {
    code,
    hostName,
    createdAt: now,
    hostLastSeen: now,
    phase: 'landing',
    gameMode: 'diwaniya',
    uiPhase: 'landing',
    gamePhase: 'faceoff',
    showGameOver: false,
    team1Name: 'فريق 1',
    team2Name: 'فريق 2',
    team1Emoji: '👑',
    team2Emoji: '🏛️',
    team1Score: 0,
    team2Score: 0,
    currentTeam: 1,
    strikes: 0,
    round: 1,
    totalRounds: 5,
    stealTimerDuration: 0,
    roundTimerDuration: 0,
    selectedQuestions: [],
    currentAnswers: [],
    roundScore: 0,
    fmQuestions: [],
    fmAnswers1: [],
    fmAnswers2: [],
    fmRevealed1: [],
    fmRevealed2: [],
    fmScore1: 0,
    fmScore2: 0,
    timeLeft: 20,
    timerRunning: false,
    fmPhase: 'intro',
    fmSelected1: [],
    fmSelected2: [],
    regularRoundScore1: 0,
    regularRoundScore2: 0,
    roundTimeLeft: 0,
    roundTimerRunning: false,
    roundHistory: [],
    gameStats: {
      team1Correct: 0,
      team2Correct: 0,
      team1Strikes: 0,
      team2Strikes: 0,
      totalSteals: 0,
      successfulSteals: 0,
      fastMoneyScore1: 0,
      fastMoneyScore2: 0,
    },
    spectators: [],
  };

  await turso.createRoom({
    id: `familyfeud_${code}`,
    code,
    hostName,
    playerCount: 0,
    phase: 'landing',
    stateJson: packState(state),
    gameType: 'familyfeud',
  });

  return state;
}

export async function getFamilyFeudRoom(
  code: string,
): Promise<FamilyFeudRoomState | null> {
  const room = await turso.getRoomByCode(code);
  if (!room) return null;

  // Match rooms explicitly tagged as 'familyfeud' OR rooms created via the generic
  // /api/room POST (gameType null/undefined).
  if (room.gameType && room.gameType !== 'familyfeud') return null;

  if (room.phase === 'deleted') return null;

  const lastSeen = new Date(room.hostLastSeen).getTime();
  if (Date.now() - lastSeen > ROOM_TTL_MS) {
    await deleteFamilyFeudRoom(code);
    return null;
  }

  const state = unpackState(room.stateJson) as FamilyFeudRoomState;

  const merged: FamilyFeudRoomState = {
    code,
    hostName: state.hostName ?? room.hostName,
    createdAt: state.createdAt ?? new Date(room.createdAt).getTime(),
    hostLastSeen: lastSeen,
    phase: state.phase ?? room.phase,
    gameMode: state.gameMode ?? 'diwaniya',
    uiPhase: state.uiPhase ?? 'landing',
    gamePhase: state.gamePhase ?? 'faceoff',
    showGameOver: state.showGameOver ?? false,
    team1Name: state.team1Name ?? 'فريق 1',
    team2Name: state.team2Name ?? 'فريق 2',
    team1Emoji: state.team1Emoji ?? '👑',
    team2Emoji: state.team2Emoji ?? '🏛️',
    team1Score: state.team1Score ?? 0,
    team2Score: state.team2Score ?? 0,
    currentTeam: state.currentTeam ?? 1,
    strikes: state.strikes ?? 0,
    round: state.round ?? 1,
    totalRounds: state.totalRounds ?? 5,
    stealTimerDuration: state.stealTimerDuration ?? 0,
    roundTimerDuration: state.roundTimerDuration ?? 0,
    selectedQuestions: state.selectedQuestions ?? [],
    currentAnswers: state.currentAnswers ?? [],
    roundScore: state.roundScore ?? 0,
    fmQuestions: state.fmQuestions ?? [],
    fmAnswers1: state.fmAnswers1 ?? [],
    fmAnswers2: state.fmAnswers2 ?? [],
    fmRevealed1: state.fmRevealed1 ?? [],
    fmRevealed2: state.fmRevealed2 ?? [],
    fmScore1: state.fmScore1 ?? 0,
    fmScore2: state.fmScore2 ?? 0,
    timeLeft: state.timeLeft ?? 20,
    timerRunning: state.timerRunning ?? false,
    fmPhase: state.fmPhase ?? 'intro',
    fmSelected1: state.fmSelected1 ?? [],
    fmSelected2: state.fmSelected2 ?? [],
    regularRoundScore1: state.regularRoundScore1 ?? 0,
    regularRoundScore2: state.regularRoundScore2 ?? 0,
    roundTimeLeft: state.roundTimeLeft ?? 0,
    roundTimerRunning: state.roundTimerRunning ?? false,
    roundHistory: state.roundHistory ?? [],
    gameStats: state.gameStats ?? {
      team1Correct: 0,
      team2Correct: 0,
      team1Strikes: 0,
      team2Strikes: 0,
      totalSteals: 0,
      successfulSteals: 0,
      fastMoneyScore1: 0,
      fastMoneyScore2: 0,
    },
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

export async function updateFamilyFeudRoom(
  code: string,
  data: Partial<FamilyFeudRoomState>,
): Promise<FamilyFeudRoomState | null> {
  const existing = await getFamilyFeudRoom(code);
  if (!existing) return null;

  const merged: FamilyFeudRoomState = {
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

export async function heartbeatFamilyFeudRoom(code: string): Promise<boolean> {
  const room = await turso.getRoomByCode(code);
  if (!room) return false;
  if (room.gameType && room.gameType !== 'familyfeud') return false;

  await turso.updateRoom(code, { hostLastSeen: new Date().toISOString() });
  return true;
}

export async function deleteFamilyFeudRoom(code: string): Promise<boolean> {
  try {
    const room = await turso.getRoomByCode(code);
    if (!room) return false;
    if (room.gameType && room.gameType !== 'familyfeud') return false;

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
): Promise<FamilyFeudRoomState | null> {
  const room = await getFamilyFeudRoom(code);
  if (!room) return null;

  const id = `spec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  room.spectators = room.spectators.filter((s) => s.name !== name);
  room.spectators.push({
    id,
    name,
    joinedAt: Date.now(),
    lastSeen: Date.now(),
  });

  return updateFamilyFeudRoom(code, { spectators: room.spectators });
}

export async function heartbeatSpectator(
  code: string,
  spectatorId: string,
): Promise<boolean> {
  const room = await getFamilyFeudRoom(code);
  if (!room) return false;

  const spec = room.spectators.find((s) => s.id === spectatorId);
  if (!spec) return false;
  spec.lastSeen = Date.now();

  await updateFamilyFeudRoom(code, { spectators: room.spectators });
  return true;
}

export async function removeSpectator(
  code: string,
  spectatorId: string,
): Promise<boolean> {
  const room = await getFamilyFeudRoom(code);
  if (!room) return false;

  const idx = room.spectators.findIndex((s) => s.id === spectatorId);
  if (idx === -1) return false;
  room.spectators.splice(idx, 1);

  await updateFamilyFeudRoom(code, { spectators: room.spectators });
  return true;
}

// ============================================================
// Generic state broadcast (host → spectators)
// ============================================================

export async function broadcastState(
  code: string,
  payload: Partial<FamilyFeudRoomState>,
): Promise<FamilyFeudRoomState | null> {
  return updateFamilyFeudRoom(code, payload);
}
