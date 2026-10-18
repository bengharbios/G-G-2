import { NextRequest, NextResponse } from 'next/server';
import {
  getGuessImageRoom,
  addGuessImageSpectator,
  heartbeatGuessImageSpectator,
  removeGuessImageSpectator,
  approveGuessImageSpectator,
  rejectGuessImageSpectator,
} from '@/lib/guessimage-room-store';

// POST /api/guessimage-room/[code]/spectator  → join as spectator
//   body: { name: string, authInfo?: { userId, avatar, frame, displayName } }
//   response: { success, spectatorId, spectatorStatus, spectatorCount, roomPhase }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await request.json().catch(() => ({}));
  const name: string = (body?.name || '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Missing name' }, { status: 400 });
  }

  const authInfo = body?.authInfo || undefined;
  const room = await addGuessImageSpectator(code, name, authInfo);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  // Find the spectator we just added (last entry with this name)
  const spec = room.spectators.find(s => s.name === name);
  if (!spec) {
    return NextResponse.json({ error: 'Spectator join failed' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    spectatorId: spec.id,
    spectatorStatus: spec.status,
    spectatorCount: room.spectators.length,
    roomPhase: room.phase,
  });
}

// PUT /api/guessimage-room/[code]/spectator
//   body variant 1: { action: 'approve', spectatorId }  → host approves
//   body variant 2: { action: 'reject', spectatorId }   → host rejects
//   body variant 3: { spectatorId }                        → heartbeat (every 5s)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await request.json().catch(() => ({}));
  const action = body?.action;
  const spectatorId: string = body?.spectatorId;

  if (action === 'approve' && spectatorId) {
    const room = await approveGuessImageSpectator(code, spectatorId);
    if (!room) return NextResponse.json({ error: 'Room or spectator not found' }, { status: 404 });
    return NextResponse.json({ success: true, room });
  }
  if (action === 'reject' && spectatorId) {
    const room = await rejectGuessImageSpectator(code, spectatorId);
    if (!room) return NextResponse.json({ error: 'Room or spectator not found' }, { status: 404 });
    return NextResponse.json({ success: true, room });
  }
  // Default: spectator heartbeat
  if (spectatorId) {
    const ok = await heartbeatGuessImageSpectator(code, spectatorId);
    if (!ok) return NextResponse.json({ error: 'Spectator not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Missing spectatorId or action' }, { status: 400 });
}

// DELETE /api/guessimage-room/[code]/spectator?id=SPECTATOR_ID
//   → spectator leaves the room (cleanup on unmount)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { searchParams } = new URL(request.url);
  const spectatorId = searchParams.get('id');
  if (!spectatorId) {
    return NextResponse.json({ error: 'Missing spectator id' }, { status: 400 });
  }
  const ok = await removeGuessImageSpectator(code, spectatorId);
  return NextResponse.json({ success: ok });
}

// GET /api/guessimage-room/[code]/spectator
//   → host's spectator list + room phase (polled every 2s by DiwaniyaApprovalCard)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const room = await getGuessImageRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }
  return NextResponse.json({
    success: true,
    spectators: room.spectators,
    roomPhase: room.phase,
    round: room.round,
    currentRoundId: room.currentRoundId,
    currentRoundImageId: room.currentRoundImageId,
    currentRoundImageUrl: room.currentRoundImageUrl,
    currentRoundChoices: room.currentRoundChoices,
    currentRoundCorrectChoiceIndex: room.currentRoundCorrectChoiceIndex,
    currentRoundAnswer: room.currentRoundAnswer,
    gridSize: room.gridSize,
    maxReveals: room.maxReveals,
    timerValueSec: room.timerValueSec,
    timeLeft: room.timeLeft,
    battleStartedAt: room.battleStartedAt,
  });
}
