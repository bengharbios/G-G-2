import { NextRequest, NextResponse } from 'next/server';
import { recordSpectatorReveal } from '@/lib/guessimage-room-store';

// POST /api/guessimage-room/[code]/reveal
//   body: { spectatorId, squareId }
//   → spectator reveals a grid square (records their reveal count)
//   response: { success, spectator, alreadyRevealed, maxReached }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await request.json().catch(() => ({}));
  const spectatorId: string = body?.spectatorId;
  const squareId: string = body?.squareId;

  if (!spectatorId || !squareId) {
    return NextResponse.json({ error: 'Missing spectatorId or squareId' }, { status: 400 });
  }

  const result = await recordSpectatorReveal(code, spectatorId, squareId);
  if (!result.room) {
    return NextResponse.json({ error: 'Room or spectator not found (or not playing)' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    spectator: result.spectator,
    alreadyRevealed: result.alreadyRevealed,
    maxReached: result.maxReached,
    roomPhase: result.room.phase,
  });
}
