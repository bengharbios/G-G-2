import { NextRequest, NextResponse } from 'next/server';
import { getRoomByCode, updateRoom } from '@/lib/turso';

// Extract room code from URL pathname: /api/risk2-room/{CODE}/spectator
function extractCode(req: NextRequest): string | null {
  const pathname = new URL(req.url).pathname;
  const segments = pathname.split('/').filter(Boolean);
  // segments: ['api', 'risk2-room', '{CODE}', 'spectator']
  const code = segments[2] || null;
  return code;
}

// POST /api/risk2-room/[code]/spectator — Join as spectator
export async function POST(req: NextRequest) {
  const code = extractCode(req);
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  try {
    const room = await getRoomByCode(code);
    if (!room || room.gameType !== 'risk2') {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const spectator = {
      id: `spec_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name,
      joinedAt: Date.now(),
    };

    // Parse existing state and add spectator
    let stateData: Record<string, unknown> = {};
    try {
      stateData = JSON.parse(room.stateJson || '{}');
    } catch {}

    const spectators = Array.isArray(stateData.spectators) ? [...stateData.spectators, spectator] : [spectator];

    await updateRoom(code, {
      stateJson: JSON.stringify({ ...stateData, spectators }),
      hostLastSeen: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, spectatorId: spectator.id, spectatorCount: spectators.length });
  } catch (err) {
    console.error('Error joining spectator:', err);
    return NextResponse.json({ error: 'Failed to join' }, { status: 500 });
  }
}
