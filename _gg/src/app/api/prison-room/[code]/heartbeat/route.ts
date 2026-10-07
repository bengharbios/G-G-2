import { NextRequest, NextResponse } from 'next/server';
import { heartbeatPrisonRoom } from '@/lib/prison-room-store';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const ok = await heartbeatPrisonRoom(code);
  if (!ok) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
