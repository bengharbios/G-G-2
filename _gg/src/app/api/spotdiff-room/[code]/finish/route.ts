import { NextRequest, NextResponse } from 'next/server';
import { finishSpectator } from '@/lib/spotdiff-room-store';

// POST /api/spotdiff-room/[code]/finish — Spectator finished the round
// (found all differences OR time ran out)
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

    if (!spectatorId) {
      return NextResponse.json({ error: 'Missing spectatorId' }, { status: 400 });
    }

    const room = await finishSpectator(code, spectatorId);
    if (!room) {
      return NextResponse.json({ error: 'Room or spectator not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, room });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
