import { NextRequest, NextResponse } from 'next/server';
import * as turso from '@/lib/turso';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    const room = await turso.getRoomWithPlayers(code.toUpperCase());

    if (!room) {
      return NextResponse.json(
        { error: 'الغرفة غير موجودة' },
        { status: 404 }
      );
    }

    // Check if room was ended (reset to setup phase while game was in progress)
    const isEnded = room.phase === 'setup' && room.players.some((p) => p.hasJoined);

    // If playerId is provided, don't expose other players' roles
    let sanitizedPlayers = room.players;
    if (playerId && room.phase !== 'game_over') {
      sanitizedPlayers = room.players.map((p) => {
        if (p.id === playerId) {
          return p; // Player can see their own role
        }
        // Hide role from other players during active game
        return {
          ...p,
          role: null,
        };
      });
    }

    return NextResponse.json({
      ...room,
      players: sanitizedPlayers,
      isEnded: isEnded || undefined,
      // Ensure hostLastSeen is always sent as ISO string
      hostLastSeen: room.hostLastSeen || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب بيانات الغرفة' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { phase, round, stateJson, resultsJson, gameWinner, players } = body;

    const room = await turso.getRoomByCode(code.toUpperCase());

    if (!room) {
      return NextResponse.json(
        { error: 'الغرفة غير موجودة' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (phase !== undefined) updateData.phase = phase;
    if (round !== undefined) updateData.round = round;
    if (stateJson !== undefined) updateData.stateJson = stateJson;
    if (resultsJson !== undefined) updateData.resultsJson = resultsJson;
    if (gameWinner !== undefined) updateData.gameWinner = gameWinner;

    // Update room
    const updatedRoom = await turso.updateRoom(code.toUpperCase(), updateData);

    if (!updatedRoom) {
      return NextResponse.json(
        { error: 'الغرفة غير موجودة' },
        { status: 404 }
      );
    }

    // Clear all voteTargets when entering a new voting round (prevents stale votes from showing)
    if (phase === 'day_voting') {
      await turso.updatePlayersByRoomId(updatedRoom.id, { voteTarget: null });
    }

    // Clear all night actions when starting a new night (prevents stale night choices)
    if (phase === 'night_start') {
      await turso.updatePlayersByRoomId(updatedRoom.id, {
        nightActionTarget: null,
        nightActionType: null,
      });
    }

    // Update players if provided
    if (players && Array.isArray(players)) {
      for (const playerData of players) {
        await turso.updatePlayersByName(updatedRoom.id, playerData.name, {
          role: playerData.role,
          isAlive: playerData.isAlive,
          isSilenced: playerData.isSilenced,
          hasRevealedMayor: playerData.hasRevealedMayor,
        });
      }
    }

    // Fetch updated room with players
    const finalRoom = await turso.getRoomWithPlayers(code.toUpperCase());

    return NextResponse.json(finalRoom);
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الغرفة' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const room = await turso.getRoomByCode(code.toUpperCase());

    if (!room) {
      return NextResponse.json(
        { error: 'الغرفة غير موجودة' },
        { status: 404 }
      );
    }

    // Mark room as ended by resetting to setup phase
    await turso.updateRoom(code.toUpperCase(), {
      phase: 'setup',
      round: 0,
      gameWinner: null,
      stateJson: '{}',
      resultsJson: null,
      hostLastSeen: new Date(0).toISOString(),
    });

    // Reset all players
    await turso.updatePlayersByRoomId(room.id, {
      role: null,
      isAlive: true,
      isSilenced: false,
      hasRevealedMayor: false,
      voteTarget: null,
    });

    return NextResponse.json({ success: true, message: 'تم إنهاء اللعبة' });
  } catch (error) {
    console.error('Error ending room:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنهاء اللعبة' },
      { status: 500 }
    );
  }
}
