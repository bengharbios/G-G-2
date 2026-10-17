import { NextRequest, NextResponse } from 'next/server';
import { recordSpectatorFound } from '@/lib/spotdiff-room-store';

// POST /api/spotdiff-room/[code]/find — Spectator found a difference
// Body: { spectatorId, diffId }
// Returns the updated spectator state + whether the round is complete for them.
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
    const spectatorId = String(body?.spectatorId || '');
    const diffId = String(body?.diffId || '');
    const scorePerHit = Number(body?.scorePerHit || 100);

    if (!spectatorId || !diffId) {
      return NextResponse.json({ error: 'Missing spectatorId or diffId' }, { status: 400 });
    }

    const { room, spectator, alreadyFound } = await recordSpectatorFound(code, spectatorId, diffId, scorePerHit);
    if (!room || !spectator) {
      return NextResponse.json({ error: 'Room or spectator not found (or not playing)' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      spectator,
      alreadyFound,
      roomPhase: room.phase,
    });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
