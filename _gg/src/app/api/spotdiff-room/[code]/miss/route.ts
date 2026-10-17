import { NextRequest, NextResponse } from 'next/server';
import { recordSpectatorMiss } from '@/lib/spotdiff-room-store';

// POST /api/spotdiff-room/[code]/miss — Spectator missed (clicked outside any diff)
// Body: { spectatorId }
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
    const penaltyPerMiss = Number(body?.penaltyPerMiss || 10);

    if (!spectatorId) {
      return NextResponse.json({ error: 'Missing spectatorId' }, { status: 400 });
    }

    const { room, spectator } = await recordSpectatorMiss(code, spectatorId, penaltyPerMiss);
    if (!room || !spectator) {
      return NextResponse.json({ error: 'Room or spectator not found (or not playing)' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      spectator,
      roomPhase: room.phase,
    });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
