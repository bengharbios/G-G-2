import { NextRequest, NextResponse } from 'next/server';
import {
  getSpotDiffRoom,
  addSpotDiffSpectator,
  removeSpotDiffSpectator,
  heartbeatSpotDiffSpectator,
  approveSpotDiffSpectator,
  rejectSpotDiffSpectator,
} from '@/lib/spotdiff-room-store';

// POST /api/spotdiff-room/[code]/spectator — Join as spectator
// Body: { name, authInfo?: { userId, avatar, frame, displayName } }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const name = (body?.name || '').trim();
    if (!name) {
      return NextResponse.json({ error: 'Missing name' }, { status: 400 });
    }

    const authInfo = body?.authInfo
      ? {
          userId: String(body.authInfo.userId || ''),
          avatar: body.authInfo.avatar ? String(body.authInfo.avatar) : undefined,
          frame: body.authInfo.frame ? String(body.authInfo.frame) : undefined,
          displayName: body.authInfo.displayName ? String(body.authInfo.displayName) : undefined,
        }
      : undefined;

    const room = await addSpotDiffSpectator(code, name, authInfo);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const spectator = room.spectators.find(s => s.name === name);

    return NextResponse.json({
      success: true,
      spectatorId: spectator?.id || null,
      spectatorStatus: spectator?.status || 'pending',
      spectatorCount: room.spectators.length,
      roomPhase: room.phase,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to join' }, { status: 500 });
  }
}

// PUT /api/spotdiff-room/[code]/spectator — Heartbeat OR approve/reject (host action)
// Body variants:
//   { spectatorId }                              → heartbeat (spectator → server)
//   { action: 'approve', spectatorId }           → host approves a pending spectator
//   { action: 'reject', spectatorId }             → host rejects a pending spectator
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  try {
    const body = await request.json();

    // ── Host approval actions ─────────────────────────────────────────
    if (body?.action === 'approve' && body?.spectatorId) {
      const room = await approveSpotDiffSpectator(code, body.spectatorId);
      if (!room) {
        return NextResponse.json({ error: 'Room or spectator not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, room });
    }
    if (body?.action === 'reject' && body?.spectatorId) {
      const room = await rejectSpotDiffSpectator(code, body.spectatorId);
      if (!room) {
        return NextResponse.json({ error: 'Room or spectator not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, room });
    }

    // ── Default: heartbeat ──────────────────────────────────────────
    const spectatorId = body?.spectatorId;
    if (!spectatorId) {
      return NextResponse.json({ error: 'Missing spectatorId' }, { status: 400 });
    }

    const ok = await heartbeatSpotDiffSpectator(code, spectatorId);
    if (!ok) {
      return NextResponse.json({ error: 'Spectator not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// DELETE /api/spotdiff-room/[code]/spectator?id=SPEC_ID — Leave the room
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const spectatorId = searchParams.get('id');
    if (!spectatorId) {
      return NextResponse.json({ error: 'Missing spectatorId' }, { status: 400 });
    }

    const ok = await removeSpotDiffSpectator(code, spectatorId);
    if (!ok) {
      return NextResponse.json({ error: 'Spectator not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// GET /api/spotdiff-room/[code]/spectator — Get the spectator list (host uses this
// to render the approval list; spectators use it to know who's in the room)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  try {
    const room = await getSpotDiffRoom(code);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      spectators: room.spectators,
      roomPhase: room.phase,
      round: room.round,
      currentRoundId: room.currentRoundId,
      totalDifferences: room.totalDifferences,
      timeLeft: room.timeLeft,
      battleStartedAt: room.battleStartedAt,
      timerValueSec: room.timerValueSec,
    });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
