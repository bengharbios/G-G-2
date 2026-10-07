import { NextRequest, NextResponse } from 'next/server';
import * as turso from '@/lib/turso';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { playerId, targetName } = body;

    if (!playerId || !targetName) {
      return NextResponse.json(
        { error: 'يجب تحديد اللاعب والهدف' },
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

    // Find the good son player
    const goodSon = room.players.find((p) => p.id === playerId);
    if (!goodSon) {
      return NextResponse.json(
        { error: 'اللاعب غير موجود' },
        { status: 404 }
      );
    }

    // Verify this player is the good son and was eliminated
    if (goodSon.role !== 'good_son') {
      return NextResponse.json(
        { error: 'فقط الولد الصالح يمكنه اختيار الضحية' },
        { status: 400 }
      );
    }

    // Find target player by name
    const targetPlayer = room.players.find((p) => p.name === targetName);
    if (!targetPlayer) {
      return NextResponse.json(
        { error: 'اللاعب المستهدف غير موجود' },
        { status: 400 }
      );
    }

    if (!targetPlayer.isAlive) {
      return NextResponse.json(
        { error: 'لا يمكنك اختيار لاعب ميت!' },
        { status: 400 }
      );
    }

    // Mark target as eliminated by good son
    await turso.updatePlayer(targetPlayer.id, {
      isAlive: false,
      eliminatedBy: 'good_son',
      eliminatedRound: room.round || 1,
    });

    return NextResponse.json({
      success: true,
      targetName: targetPlayer.name,
      targetRole: targetPlayer.role,
    });
  } catch (error) {
    console.error('Error in good son revenge:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء معالجة الانتقام' },
      { status: 500 }
    );
  }
}
