import { NextRequest, NextResponse } from 'next/server';
import { heartbeatRiskRoom } from '@/lib/risk-room-store';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const ok = await heartbeatRiskRoom(code);
  if (!ok) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
