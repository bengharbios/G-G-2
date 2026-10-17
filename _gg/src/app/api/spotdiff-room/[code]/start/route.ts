import { NextRequest, NextResponse } from 'next/server';
import { startSpotDiffBattle, getSpotDiffRoom } from '@/lib/spotdiff-room-store';

// POST /api/spotdiff-room/[code]/start — Host starts the battle after approvals
// Body: { currentRoundId, totalDifferences, timerValueSec }
// All 'approved' spectators are promoted to 'playing' status.
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
    const roundData = {
      currentRoundId: String(body?.currentRoundId || `round_${Date.now()}`),
      currentRoundImageUrl: String(body?.currentRoundImageUrl || ''),
      currentRoundImageShift: Number(body?.currentRoundImageShift || 53.5),
      currentRoundFlashiDiffs: Array.isArray(body?.currentRoundFlashiDiffs)
        ? body.currentRoundFlashiDiffs
        : [],
      totalDifferences: Number(body?.totalDifferences || 5),
      timerValueSec: Number(body?.timerValueSec || 60),
    };

    const room = await startSpotDiffBattle(code, roundData);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      room,
      message: 'Battle started — approved spectators are now playing',
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to start battle' }, { status: 500 });
  }
}
