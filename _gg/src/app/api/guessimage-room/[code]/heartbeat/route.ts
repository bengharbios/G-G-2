import { NextRequest, NextResponse } from 'next/server';
import { heartbeatGuessImageRoom } from '@/lib/guessimage-room-store';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const ok = await heartbeatGuessImageRoom(code);
  if (!ok) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
