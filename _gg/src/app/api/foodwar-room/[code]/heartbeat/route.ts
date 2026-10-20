import { NextRequest, NextResponse } from 'next/server';
import { heartbeatFoodWarRoom } from '@/lib/foodwar-room-store';

// POST /api/foodwar-room/[code]/heartbeat — Host heartbeat
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const ok = await heartbeatFoodWarRoom(code);
  if (!ok) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
