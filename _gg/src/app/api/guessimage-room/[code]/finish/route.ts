import { NextRequest, NextResponse } from 'next/server';
import { finishSpectator } from '@/lib/guessimage-room-store';

// POST /api/guessimage-room/[code]/finish
//   body: { spectatorId }
//   → spectator manually finishes (e.g. ran out of reveals, gave up)
//   response: { success: true, room }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await request.json().catch(() => ({}));
  const spectatorId: string = body?.spectatorId;

  if (!spectatorId) {
    return NextResponse.json({ error: 'Missing spectatorId' }, { status: 400 });
  }

  const room = await finishSpectator(code, spectatorId);
  if (!room) {
    return NextResponse.json({ error: 'Room or spectator not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, room });
}
