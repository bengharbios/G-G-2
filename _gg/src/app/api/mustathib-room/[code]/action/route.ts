import { NextRequest, NextResponse } from 'next/server';
import { submitMustathibAction } from '@/lib/mustathib-room-store';

// POST /api/mustathib-room/[code]/action — Broadcast game state to spectators
// Body: { phase, round, stateJson, gameWinner }
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
    const room = await submitMustathibAction(code, body);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, room });
  } catch {
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
