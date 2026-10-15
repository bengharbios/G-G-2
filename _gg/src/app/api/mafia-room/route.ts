import { NextRequest, NextResponse } from 'next/server';
import { createMafiaRoom, getMafiaRoom } from '@/lib/mafia-room-store';

export async function POST(request: NextRequest) {
  try {
    const { code, hostName } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    const room = await createMafiaRoom(code, hostName || 'العراب');
    return NextResponse.json({ success: true, code: room.code });
  } catch {
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const room = await getMafiaRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, room });
}
