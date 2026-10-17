import { NextRequest, NextResponse } from 'next/server';
import { createShipsRoom } from '@/lib/ships-room-store';

export async function POST(request: NextRequest) {
  try {
    const { code, hostName } = await request.json();
    if (!code || !hostName) return NextResponse.json({ error: 'Missing code/hostName' }, { status: 400 });
    const room = await createShipsRoom(code, hostName);
    if (!room) return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
    return NextResponse.json({ success: true, room });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
