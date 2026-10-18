import { NextRequest, NextResponse } from 'next/server';
import { startGuessImageBattle } from '@/lib/guessimage-room-store';

// POST /api/guessimage-room/[code]/start
//   body: {
//     currentRoundId, currentRoundImageId, currentRoundImageUrl,
//     currentRoundChoices: string[], currentRoundCorrectChoiceIndex,
//     currentRoundAnswer: string,
//     totalRounds, timerValueSec, gridSize, maxReveals,
//     scorePerCorrect, penaltyPerWrong, difficulty, themeId
//   }
//   → host triggers battle start — all 'approved' spectators become 'playing'
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await request.json().catch(() => ({}));

  const currentRoundId = body?.currentRoundId || `round_${Date.now()}`;
  const currentRoundImageId = body?.currentRoundImageId;
  const currentRoundImageUrl = body?.currentRoundImageUrl;
  const currentRoundChoices: string[] = body?.currentRoundChoices || [];
  const currentRoundCorrectChoiceIndex: number = body?.currentRoundCorrectChoiceIndex ?? 0;
  const currentRoundAnswer: string = body?.currentRoundAnswer || '';

  if (currentRoundImageId === undefined || !currentRoundImageUrl) {
    return NextResponse.json({ error: 'Missing currentRoundImageId or currentRoundImageUrl' }, { status: 400 });
  }
  if (!Array.isArray(currentRoundChoices) || currentRoundChoices.length < 2) {
    return NextResponse.json({ error: 'currentRoundChoices must be an array with at least 2 entries' }, { status: 400 });
  }

  const roundData = {
    currentRoundId,
    currentRoundImageId,
    currentRoundImageUrl,
    currentRoundChoices,
    currentRoundCorrectChoiceIndex,
    currentRoundAnswer,
    totalRounds: body?.totalRounds || 5,
    timerValueSec: body?.timerValueSec || 60,
    gridSize: body?.gridSize || 25,
    maxReveals: body?.maxReveals || 10,
    scorePerCorrect: body?.scorePerCorrect || 700,
    penaltyPerWrong: body?.penaltyPerWrong || 30,
    difficulty: body?.difficulty || 'medium',
    themeId: body?.themeId || 1,
  };

  const room = await startGuessImageBattle(code, roundData);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    room,
    message: 'Battle started — approved spectators are now playing',
  });
}
