import { NextRequest, NextResponse } from 'next/server';
import * as turso from '@/lib/turso';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { playerId, playerName, targetId, clearVote } = body;

    if ((!playerId && !playerName)) {
      return NextResponse.json(
        { error: 'يجب تحديد اللاعب' },
        { status: 400 }
      );
    }

    // If not clearing vote, target is required
    if (!clearVote && !targetId) {
      return NextResponse.json(
        { error: 'يجب تحديد الهدف' },
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

    // Find the voting player by ID or name
    const voter = playerId
      ? room.players.find((p) => p.id === playerId)
      : room.players.find((p) => p.name === playerName);
    if (!voter) {
      return NextResponse.json(
        { error: 'اللاعب غير موجود في الغرفة' },
        { status: 404 }
      );
    }

    if (!voter.isAlive) {
      return NextResponse.json(
        { error: 'للتصويت يجب أن تكون حياً' },
        { status: 400 }
      );
    }

    if (voter.isSilenced) {
      return NextResponse.json(
        { error: 'هذا اللاعب مسكت ولا يمكنه التصويت' },
        { status: 400 }
      );
    }

    // If clearing vote (skip)
    if (clearVote) {
      await turso.updatePlayer(voter.id, { voteTarget: null });
      return NextResponse.json({ success: true });
    }

    // Validate that the target is an ALIVE player (targetId is the player name)
    const targetPlayer = room.players.find((p) => p.name === targetId);
    if (!targetPlayer) {
      return NextResponse.json(
        { error: 'اللاعب المستهدف غير موجود' },
        { status: 400 }
      );
    }

    if (!targetPlayer.isAlive) {
      return NextResponse.json(
        { error: 'لا يمكنك التصويت على لاعب ميت!' },
        { status: 400 }
      );
    }

    // Don't allow voting for yourself
    if (voter.id === targetPlayer.id) {
      return NextResponse.json(
        { error: 'لا يمكنك التصويت لنفسك!' },
        { status: 400 }
      );
    }

    // Update vote target
    await turso.updatePlayer(voter.id, { voteTarget: targetId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error voting:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التصويت' },
      { status: 500 }
    );
  }
}
