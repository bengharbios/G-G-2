import { NextRequest, NextResponse } from 'next/server';
import { getRoomByCode, updateRoom, deleteRoomByCode } from '@/lib/turso';

// Extract room code from URL pathname: /api/risk2-room/{CODE}
function extractCode(req: NextRequest): string | null {
  const pathname = new URL(req.url).pathname;
  const segments = pathname.split('/').filter(Boolean);
  // segments: ['api', 'risk2-room', '{CODE}']
  const code = segments[2] || null;
  return code;
}

// GET /api/risk2-room/[code] — Get room state
export async function GET(req: NextRequest) {
  const code = extractCode(req);
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  try {
    const room = await getRoomByCode(code);
    if (!room || room.gameType !== 'risk2') {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Parse stateJson to get game data
    let stateData: Record<string, unknown> = {};
    try {
      stateData = JSON.parse(room.stateJson || '{}');
    } catch {}

    // Merge database fields with state data
    const responseData = {
      phase: room.phase,
      ...stateData,
    };

    return NextResponse.json({ ok: true, room: responseData });
  } catch (err) {
    console.error('Error getting risk2 room:', err);
    return NextResponse.json({ error: 'Failed to get room' }, { status: 500 });
  }
}

// PUT /api/risk2-room/[code] — Update room state
export async function PUT(req: NextRequest) {
  const code = extractCode(req);
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  try {
    // Check room exists
    const room = await getRoomByCode(code);
    if (!room || room.gameType !== 'risk2') {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const data = await req.json();

    // Separate phase from other data
    const { phase, ...stateData } = data;

    // Merge new state with existing state
    let existingState: Record<string, unknown> = {};
    try {
      existingState = JSON.parse(room.stateJson || '{}');
    } catch {}

    const mergedState = { ...existingState, ...stateData, lastHeartbeat: Date.now() };

    await updateRoom(code, {
      ...(phase ? { phase } : {}),
      stateJson: JSON.stringify(mergedState),
      hostLastSeen: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error updating risk2 room:', err);
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}

// DELETE /api/risk2-room/[code] — Delete room
export async function DELETE(req: NextRequest) {
  const code = extractCode(req);
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  try {
    await deleteRoomByCode(code);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error deleting risk2 room:', err);
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
}
