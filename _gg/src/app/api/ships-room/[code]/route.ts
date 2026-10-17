import { NextRequest, NextResponse } from 'next/server';
import { getShipsRoom, updateShipsRoom, deleteShipsRoom } from '@/lib/ships-room-store';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const room = await getShipsRoom(code);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  return NextResponse.json({ success: true, room });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = await request.json();
  const room = await updateShipsRoom(code, body);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  return NextResponse.json({ success: true, room });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  await deleteShipsRoom(code);
  return NextResponse.json({ success: true });
}
