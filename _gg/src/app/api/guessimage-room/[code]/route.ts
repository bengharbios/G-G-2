import { NextRequest, NextResponse } from 'next/server';
import { getGuessImageRoom, updateGuessImageRoom, deleteGuessImageRoom } from '@/lib/guessimage-room-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const room = await getGuessImageRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, room });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await request.json().catch(() => ({}));

  // sendBeacon-friendly delete (can't use DELETE method from navigator.sendBeacon)
  if (body && body._method === 'DELETE') {
    const ok = await deleteGuessImageRoom(code);
    return NextResponse.json({ success: ok });
  }

  const updated = await updateGuessImageRoom(code, body || {});
  if (!updated) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, room: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const ok = await deleteGuessImageRoom(code);
  return NextResponse.json({ success: ok });
}
