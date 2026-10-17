import { NextRequest, NextResponse } from 'next/server';
import { getShipsRoom, updateShipsRoom } from '@/lib/ships-room-store';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const room = await getShipsRoom(code);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  await updateShipsRoom(code, { hostLastSeen: Date.now() });
  return NextResponse.json({ success: true });
}
