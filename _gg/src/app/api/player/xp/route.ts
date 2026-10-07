import { NextRequest, NextResponse } from 'next/server';
import { validateSubscriptionCode, awardXP, getXPProgress, assignPlayerId } from '@/lib/admin-db';

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
    if (!subscriber.playerId) {
      await assignPlayerId(trimmedCode);
    }

    // Re-fetch to get updated data
    const updated = await validateSubscriptionCode(trimmedCode);
    const playerId = updated?.playerId ?? null;

    const xpInfo = getXPProgress(subscriber.xp);

    return NextResponse.json({
      success: true,
      playerId,
      xp: {
        total: subscriber.xp,
        level: subscriber.level,
        currentLevelXP: xpInfo.currentLevelXP,
        nextLevelXP: xpInfo.nextLevelXP,
        progress: xpInfo.progress,
        isMaxLevel: xpInfo.isMaxLevel,
      },
    });
  } catch (error) {
    console.error('[Player XP API] Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', success: false },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, amount, reason } = body;

    if (!code || !amount || !reason) {
      return NextResponse.json(
        { error: 'بيانات غير صالحة', success: false },
        { status: 400 }
      );
    }

    if (typeof code !== 'string' || typeof reason !== 'string') {
      return NextResponse.json(
        { error: 'بيانات غير صالحة', success: false },
        { status: 400 }
      );
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'كمية XP غير صالحة', success: false },
        { status: 400 }
      );
    }

    if (amount > 10000) {
      return NextResponse.json(
        { error: 'الحد الأقصى للـ XP في المرة الواحدة هو 10000', success: false },
        { status: 400 }
      );
    }

    const result = await awardXP(code.trim(), amount, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, success: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      newXPTotal: result.newXPTotal,
      newLevel: result.newLevel,
      leveledUp: result.leveledUp,
      awardedXP: amount,
      reason,
    });
  } catch (error) {
    console.error('[Player XP API] Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', success: false },
      { status: 500 }
    );
  }
}
