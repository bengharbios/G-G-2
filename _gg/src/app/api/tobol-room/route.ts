import { NextRequest, NextResponse } from 'next/server';
import { createTobolRoom, getTobolRoom } from '@/lib/tobol-room-store';

export async function POST(request: NextRequest) {
  try {
    const { code, hostName } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    const room = await createTobolRoom(code, hostName || 'العراب');
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

  const room = await getTobolRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, room });
}
