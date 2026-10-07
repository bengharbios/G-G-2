import { NextRequest, NextResponse } from 'next/server';
import { getTobolRoom, addPlayer, removePlayer, heartbeatPlayer } from '@/lib/tobol-room-store';

// POST /api/tobol-room/[code]/player — Join as player (pick team)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  try {
    const { name, team } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Missing name' }, { status: 400 });
    }
    if (team !== 'red' && team !== 'blue') {
      return NextResponse.json({ error: 'Invalid team' }, { status: 400 });
    }

    const room = await addPlayer(code, name.trim(), team);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const player = room.players.find(p => p.name === name.trim());

    return NextResponse.json({
      success: true,
      playerId: player?.id || null,
      playerCount: room.players.length,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to join' }, { status: 500 });
  }
}

// PUT /api/tobol-room/[code]/player — Heartbeat
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  try {
    const { playerId } = await request.json();
    if (!playerId) {
      return NextResponse.json({ error: 'Missing playerId' }, { status: 400 });
    }

    const ok = await heartbeatPlayer(code, playerId);
    if (!ok) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// DELETE /api/tobol-room/[code]/player — Leave
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
    const playerId = searchParams.get('id');
    if (!playerId) {
      return NextResponse.json({ error: 'Missing playerId' }, { status: 400 });
    }

    await removePlayer(code, playerId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
