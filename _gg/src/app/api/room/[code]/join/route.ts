import { NextRequest, NextResponse } from 'next/server';
import * as turso from '@/lib/turso';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'يجب إدخال اسمك' },
        { status: 400 }
      );
    }

    const room = await turso.getRoomWithPlayers(code.toUpperCase());

    if (!room) {
      return NextResponse.json(
        { error: 'الغرفة غير موجودة' },
        { status: 404 }
      );
    }

    // Check if player already exists in the room (re-joining after refresh)
    const existingPlayer = room.players.find(
      (p) => p.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (existingPlayer) {
      // Player is re-joining after page refresh
      // Return their existing data so they can continue playing
      const updatedRoom = await turso.getRoomWithPlayers(code.toUpperCase());

      return NextResponse.json({
        player: existingPlayer,
        room: updatedRoom,
        rejoining: true,
      });
    }

    // New player joining
    if (room.phase !== 'waiting') {
      return NextResponse.json(
        { error: 'اللعبة بدأت بالفعل، لا يمكنك الانضمام الآن' },
        { status: 400 }
      );
    }

    const currentPlayers = room.players.length;
    if (currentPlayers >= room.playerCount) {
      return NextResponse.json(
        { error: 'الغرفة ممتلئة' },
        { status: 400 }
      );
    }

    // Create player as pending (hasJoined = false)
    const player = await turso.createPlayer({
      id: turso.generateId(),
      roomId: room.id,
      name: name.trim(),
      hasJoined: false,
    });

    // Fetch updated room with players
    const updatedRoom = await turso.getRoomWithPlayers(code.toUpperCase());

    return NextResponse.json({ player, room: updatedRoom });
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء الانضمام للغرفة' },
      { status: 500 }
    );
  }
}

// PATCH: Approve or reject a pending player
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { playerId, action } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'يجب تحديد الإجراء' },
        { status: 400 }
      );
    }

    const room = await turso.getRoomWithPlayers(code.toUpperCase());

    if (!room) {
      return NextResponse.json(
        { error: 'الغرفة غير موجودة' },
        { status: 404 }
      );
    }

    // Batch approve all pending players
    if (action === 'approve_all') {
      const pendingPlayers = room.players.filter((p) => !p.hasJoined);
      const approvedCount = room.players.filter((p) => p.hasJoined).length;
      const availableSlots = room.playerCount - approvedCount;

      if (availableSlots <= 0) {
        return NextResponse.json(
          { error: 'الغرفة ممتلئة' },
          { status: 400 }
        );
      }

      // Approve up to available slots
      const toApprove = pendingPlayers.slice(0, availableSlots);
      for (const p of toApprove) {
        await turso.updatePlayer(p.id, { hasJoined: true });
      }

      const updatedRoom = await turso.getRoomWithPlayers(code.toUpperCase());

      return NextResponse.json({ room: updatedRoom });
    }

    if (!playerId) {
      return NextResponse.json(
        { error: 'يجب تحديد اللاعب' },
        { status: 400 }
      );
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'اللاعب غير موجود' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      const approvedCount = room.players.filter((p) => p.hasJoined).length;
      if (approvedCount >= room.playerCount) {
        return NextResponse.json(
          { error: 'الغرفة ممتلئة' },
          { status: 400 }
        );
      }

      await turso.updatePlayer(playerId, { hasJoined: true });
    } else if (action === 'reject') {
      await turso.deletePlayer(playerId);
    } else {
      return NextResponse.json(
        { error: 'إجراء غير صالح' },
        { status: 400 }
      );
    }

    const updatedRoom = await turso.getRoomWithPlayers(code.toUpperCase());

    return NextResponse.json({ room: updatedRoom });
  } catch (error) {
    console.error('Error updating player status:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث حالة اللاعب' },
      { status: 500 }
    );
  }
}
