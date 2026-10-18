import { NextRequest, NextResponse } from 'next/server';
import { recordSpectatorCorrectGuess, recordSpectatorWrongGuess } from '@/lib/guessimage-room-store';

// POST /api/guessimage-room/[code]/guess
//   body variant 1: { spectatorId, choiceIndex, correctChoiceIndex, scorePerCorrect, penaltyPerWrong }
//     → record a spectator's choice (correct or wrong)
//   response: { success, spectator, correct, alreadyFinished }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await request.json().catch(() => ({}));
  const spectatorId: string = body?.spectatorId;
  const choiceIndex: number | undefined = body?.choiceIndex;
  const correctChoiceIndex: number | undefined = body?.correctChoiceIndex;
  const scorePerCorrect: number = body?.scorePerCorrect ?? 700;
  const penaltyPerWrong: number = body?.penaltyPerWrong ?? 30;
  const revealedCount: number = body?.revealedCount ?? 0;

  if (!spectatorId || choiceIndex === undefined || correctChoiceIndex === undefined) {
    return NextResponse.json({ error: 'Missing spectatorId, choiceIndex, or correctChoiceIndex' }, { status: 400 });
  }

  const isCorrect = choiceIndex === correctChoiceIndex;

  if (isCorrect) {
    // Calculate score: base - (reveals × 50) - (wrongs × penalty)
    // Match the classic-mode scoring logic in guessimage-store.ts
    const earnedScore = Math.max(50, scorePerCorrect - revealedCount * 50);
    const result = await recordSpectatorCorrectGuess(code, spectatorId, earnedScore);
    if (!result.room) {
      return NextResponse.json({ error: 'Room or spectator not found (or not playing)' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      spectator: result.spectator,
      correct: true,
      alreadyFinished: result.alreadyFinished,
      earnedScore,
      roomPhase: result.room.phase,
    });
  } else {
    const result = await recordSpectatorWrongGuess(code, spectatorId, penaltyPerWrong);
    if (!result.room) {
      return NextResponse.json({ error: 'Room or spectator not found (or not playing)' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      spectator: result.spectator,
      correct: false,
      alreadyFinished: false,
      appliedPenalty: penaltyPerWrong,
      roomPhase: result.room.phase,
    });
  }
}
