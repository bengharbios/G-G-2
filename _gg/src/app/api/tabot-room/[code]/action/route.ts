import { NextRequest, NextResponse } from 'next/server';
import { broadcastState, getTabotRoom } from '@/lib/tabot-room-store';

// POST /api/tabot-room/[code]/action — Broadcast the latest game state to spectators
// The host's zustand store calls this with the latest stateJson payload.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const room = await broadcastState(code, body);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, room });
  } catch {
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}

// GET /api/tabot-room/[code]/action — Convenience: fetch latest room state
// (same as GET /api/tabot-room/[code] — included so the action endpoint can
// also be polled by spectators that prefer that path)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const room = await getTabotRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, room });
}
