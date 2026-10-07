import { NextRequest, NextResponse } from 'next/server';
import { createRoom, getRoomByCode, updateRoom, generateId } from '@/lib/turso';

// POST /api/risk2-room — Create room
export async function POST(req: NextRequest) {
  try {
    const { code, hostName } = await req.json();
    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

    // Check if room already exists
    const existing = await getRoomByCode(code);
    if (existing) {
      // Update existing room instead of creating duplicate
      await updateRoom(code, {
        hostLastSeen: new Date().toISOString(),
        phase: 'playing',
      });
      return NextResponse.json({ ok: true, code });
    }

    // Create new room in database
    await createRoom({
      id: generateId(),
      code,
      hostName: hostName || 'العراب',
      playerCount: 2,
      phase: 'playing',
      stateJson: JSON.stringify({ spectators: [], lastHeartbeat: Date.now() }),
      gameType: 'risk2',
    });

    return NextResponse.json({ ok: true, code });
  } catch (err) {
    console.error('Error creating risk2 room:', err);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}

// GET /api/risk2-room — Redirect to path-based route
export async function GET() {
  return NextResponse.json({ error: 'Use /api/risk2-room/{CODE} to get a room' }, { status: 400 });
}

// PUT /api/risk2-room — Redirect to path-based route
export async function PUT() {
  return NextResponse.json({ error: 'Use /api/risk2-room/{CODE} to update a room' }, { status: 400 });
}

// DELETE /api/risk2-room — Redirect to path-based route
export async function DELETE() {
  return NextResponse.json({ error: 'Use /api/risk2-room/{CODE} to delete a room' }, { status: 400 });
}
