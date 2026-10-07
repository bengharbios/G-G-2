import { NextRequest, NextResponse } from 'next/server';
import * as turso from '@/lib/turso';
import { generateCardDeck } from '@/lib/game-types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const room = await turso.getRoomWithPlayers(code.toUpperCase());

    if (!room) {
      return NextResponse.json(
        { error: 'الغرفة غير موجودة' },
        { status: 404 }
      );
    }

    if (room.phase !== 'waiting') {
      return NextResponse.json(
        { error: 'اللعبة بدأت بالفعل' },
        { status: 400 }
      );
    }

    // Get approved players only
    const approvedPlayers = room.players.filter((p) => p.hasJoined);

    if (approvedPlayers.length < 6) {
      return NextResponse.json(
        { error: 'يجب أن يكون 6 لاعبين على الأقل' },
        { status: 400 }
      );
    }

    // Check if there are pending players
    const pendingPlayers = room.players.filter((p) => !p.hasJoined);
    if (pendingPlayers.length > 0) {
      return NextResponse.json(
        { error: 'لا تزال هناك طلبات انضمام معلقة، وافق أو ارفضها أولاً' },
        { status: 400 }
      );
    }

    // Generate roles based on approved player count
    const roles = generateCardDeck(approvedPlayers.length);

    // Shuffle roles
    const shuffled = [...roles];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Assign roles to approved players
    for (let i = 0; i < approvedPlayers.length; i++) {
      await turso.updatePlayer(approvedPlayers[i].id, {
        role: shuffled[i],
        isAlive: true,
        isSilenced: false,
        hasRevealedMayor: false,
      });
    }

    // Update room phase
    await turso.updateRoom(code.toUpperCase(), {
      phase: 'card_distribution',
      round: 1,
      playerCount: approvedPlayers.length,
    });

    const updatedRoom = await turso.getRoomWithPlayers(code.toUpperCase());

    return NextResponse.json({ room: updatedRoom });
  } catch (error) {
    console.error('Error starting game:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء بدء اللعبة' },
      { status: 500 }
    );
  }
}
