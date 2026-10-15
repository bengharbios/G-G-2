import { NextRequest, NextResponse } from 'next/server';
import { getWizardDuelRoom, updateWizardDuelRoom } from '@/lib/wizardduel-room-store';

// POST /api/wizardduel-room/[code]/action — Broadcast new game state to spectators
// The host sends a snapshot of the current state and we save it so spectators can pull it
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
    // body is a Partial<WizardDuelRoomState> snapshot
    const room = await updateWizardDuelRoom(code, body);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, room });
  } catch {
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }
  const room = await getWizardDuelRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, room });
}
