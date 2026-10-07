import { NextRequest, NextResponse } from 'next/server';
import { validateSubscriptionCode, getXPProgress, calculateXPForLevel, calculateTotalXPForLevel, assignPlayerId, MAX_LEVEL } from '@/lib/admin-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'كود الاشتراك مطلوب', success: false },
        { status: 400 }
      );
    }

    const trimmedCode = code.trim();
    const subscriber = await validateSubscriptionCode(trimmedCode);

    if (!subscriber) {
      return NextResponse.json(
        { error: 'كود الاشتراك غير صالح', success: false },
        { status: 404 }
      );
    }

    // Auto-assign player ID if not yet assigned
    let playerId = subscriber.playerId;
    if (!playerId) {
      const assignResult = await assignPlayerId(trimmedCode);
      playerId = assignResult.playerId ?? null;
    }

    // Re-fetch to get updated data
    const updated = await validateSubscriptionCode(trimmedCode);

    const progress = getXPProgress(updated?.xp ?? subscriber.xp);
    const currentLevel = progress.currentLevel;

    // Build level details response
    const levelDetails = {
      currentLevel,
      currentLevelXP: progress.currentLevelXP,
      nextLevelXP: progress.nextLevelXP,
      totalXP: updated?.xp ?? subscriber.xp,
      progress: progress.progress,
      isMaxLevel: progress.isMaxLevel,
      maxLevel: MAX_LEVEL,
      // XP needed for each of the next few levels (for display)
      upcomingLevels: [] as { level: number; xpNeeded: number; totalXPRequired: number }[],
    };

    // Add next 5 levels' XP requirements
    for (let i = currentLevel; i < Math.min(currentLevel + 5, MAX_LEVEL); i++) {
      levelDetails.upcomingLevels.push({
        level: i,
        xpNeeded: calculateXPForLevel(i),
        totalXPRequired: calculateTotalXPForLevel(i + 1),
      });
    }

    return NextResponse.json({
      success: true,
      playerId,
      levelDetails,
    });
  } catch (error) {
    console.error('[Player Level API] Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', success: false },
      { status: 500 }
    );
  }
}
