import { NextRequest, NextResponse } from 'next/server';
import { getShipsRoom, addShipsSpectator, removeShipsSpectator, heartbeatShipsSpectator } from '@/lib/ships-room-store';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });
  const room = await addShipsSpectator(code, name.trim());
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  const spec = room.spectators.find(s => s.name === name.trim());
  return NextResponse.json({ success: true, spectatorId: spec?.id || null, spectatorCount: room.spectators.length, roomPhase: room.phase });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { spectatorId } = await request.json();
  const ok = await heartbeatShipsSpectator(code, spectatorId);
  if (!ok) return NextResponse.json({ error: 'Spectator not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await removeShipsSpectator(code, id);
  return NextResponse.json({ success: true });
}
