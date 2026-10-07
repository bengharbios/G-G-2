import { NextRequest, NextResponse } from 'next/server';
import { getRiskRoom, addSpectator, removeSpectator, heartbeatSpectator } from '@/lib/risk-room-store';

// POST /api/risk-room/[code]/spectator — Join as spectator
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  try {
    const { name } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Missing name' }, { status: 400 });
    }

    const room = await addSpectator(code, name.trim());
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const spectator = room.spectators.find(s => s.name === name.trim());

    return NextResponse.json({
      success: true,
      spectatorId: spectator?.id || null,
      spectatorCount: room.spectators.length,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to join' }, { status: 500 });
  }
}

// PUT /api/risk-room/[code]/spectator — Heartbeat
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  try {
    const { spectatorId } = await request.json();
    if (!spectatorId) {
      return NextResponse.json({ error: 'Missing spectatorId' }, { status: 400 });
    }

    const ok = await heartbeatSpectator(code, spectatorId);
    if (!ok) {
      return NextResponse.json({ error: 'Spectator not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// DELETE /api/risk-room/[code]/spectator — Leave
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const spectatorId = searchParams.get('id');
    if (!spectatorId) {
      return NextResponse.json({ error: 'Missing spectatorId' }, { status: 400 });
    }

    await removeSpectator(code, spectatorId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
