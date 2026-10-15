import { NextRequest, NextResponse } from 'next/server';
import { broadcastState, getBaharHarbRoom } from '@/lib/baharharb-room-store';

// POST /api/baharharb-room/[code]/action — Broadcast latest game state to spectators
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

// GET /api/baharharb-room/[code]/action — Convenience: fetch latest room state
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const room = await getBaharHarbRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, room });
}
