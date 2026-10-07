import { NextRequest, NextResponse } from 'next/server';
import * as turso from '@/lib/turso';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { playerId, playerName, reveal } = body;

    if (reveal === undefined) {
      return NextResponse.json(
        { error: 'يجب تحديد القرار' },
        { status: 400 }
      );
    }

    if (!playerId && !playerName) {
      return NextResponse.json(
        { error: 'يجب تحديد اللاعب' },
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

    // Only allow during mayor reveal phase
    if (room.phase !== 'day_mayor_reveal') {
      return NextResponse.json(
        { error: 'ليس الوقت المناسب لهذا الفعل' },
        { status: 400 }
      );
    }

    // Find player by ID or name
    const player = playerId
      ? room.players.find((p) => p.id === playerId)
      : room.players.find((p) => p.name === playerName);
    if (!player) {
      return NextResponse.json(
        { error: 'اللاعب غير موجود في الغرفة' },
        { status: 404 }
      );
    }

    // Verify this player is the mayor
    if (player.role !== 'mayor') {
      return NextResponse.json(
        { error: 'فقط العمده يمكنه اتخاذ هذا القرار' },
        { status: 400 }
      );
    }

    // Verify player is alive
    if (!player.isAlive) {
      return NextResponse.json(
        { error: 'يجب أن تكون حياً' },
        { status: 400 }
      );
    }

    // If reveal is true, set hasRevealedMayor
    if (reveal) {
      await turso.updatePlayer(player.id, { hasRevealedMayor: true });
    }

    return NextResponse.json({ success: true, reveal, playerName: player.name });
  } catch (error) {
    console.error('Error submitting mayor reveal:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء معالجة القرار' },
      { status: 500 }
    );
  }
}
