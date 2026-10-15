import { NextRequest, NextResponse } from 'next/server';
import { getSpotDiffRoom, updateSpotDiffRoom, deleteSpotDiffRoom } from '@/lib/spotdiff-room-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const room = await getSpotDiffRoom(code);
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
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const body = await request.json();
  // Accept _method=DELETE for sendBeacon fallback
  if (body._method === 'DELETE') {
    await deleteSpotDiffRoom(code);
    return NextResponse.json({ success: true });
  }

  const room = await updateSpotDiffRoom(code, body);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, room });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  await deleteSpotDiffRoom(code);
  return NextResponse.json({ success: true });
}
