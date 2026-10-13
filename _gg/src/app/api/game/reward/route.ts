import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { awardGameRewards, getUserById, validateSubscriptionCode } from '@/lib/admin-db';

export const runtime = 'nodejs';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gg-platform-secret-key-2024'
);

/**
 * POST /api/game/reward
 * يُستدعى من الألعاب (مافيا، سجن، تبل، ...) عند:
 *   - بدء لعبة (outcome: 'play')
 *   - الفوز (outcome: 'win')
 *   - خسارة (outcome: 'loss')
 *   - إنجاز (outcome: 'achievement')
 *
 * Body:
 *   { gameSlug, outcome, playerCount? }
 *
 * Returns:
 *   { success, xpAwarded, goldAwarded, newLevel, leveledUp, newGoldBalance, reason }
 */
export async function POST(request: NextRequest) {
  try {
    // 1) المصادقة: JWT من cookie
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'يجب تسجيل الدخول', reason: 'not_logged_in' },
        { status: 401 }
      );
    }
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'رمز غير صالح', reason: 'invalid_token' },
        { status: 401 }
      );
    }

    // 2) اقرأ الـ body
    const body = await request.json().catch(() => ({}));
    const gameSlug = String(body.gameSlug || '');
    const outcome = String(body.outcome || 'play') as 'play' | 'win' | 'loss' | 'achievement';
    const playerCount = Math.max(1, Math.min(100, Number(body.playerCount || 1)));

    if (!gameSlug) {
      return NextResponse.json(
        { success: false, error: 'gameSlug مطلوب', reason: 'game_required' },
        { status: 400 }
      );
    }
    if (!['play', 'win', 'loss', 'achievement'].includes(outcome)) {
      return NextResponse.json(
        { success: false, error: 'outcome غير صالح', reason: 'invalid_outcome' },
        { status: 400 }
      );
    }

    // 3) احصل على المستخدم + اشتراكه
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'المستخدم غير موجود', reason: 'user_not_found' },
        { status: 404 }
      );
    }

    // ابحث عن كود اشتراك مرتبط
    let subscriptionCode = '';
    if (user.subscriptionId) {
      try {
        // اقرأ الـ Subscription مباشرة
        const { getClient, ensureAdminTables } = await import('@/lib/admin-db');
        await ensureAdminTables();
        const c = getClient();
        const r = await c.execute({
          sql: 'SELECT subscriptionCode FROM Subscription WHERE id = ?',
          args: [user.subscriptionId],
        });
        if (r.rows.length > 0) {
          subscriptionCode = String((r.rows[0] as Record<string, unknown>).subscriptionCode ?? '');
        }
      } catch {
        // تجاهل — استمر بدون اشتراك
      }
    }

    // 4) امنح المكافأة
    const result = await awardGameRewards(userId, subscriptionCode, gameSlug, outcome, playerCount);
    if (!result.success) {
      // لو فشل بسبب حد يومي أو إعداد معطّل — نرجع 200 مع التفاصيل (ليس خطأ مستخدم)
      return NextResponse.json({
        success: false,
        reason: result.reason,
        xpAwarded: 0,
        goldAwarded: 0,
      });
    }

    return NextResponse.json({
      success: true,
      xpAwarded: result.xpAwarded,
      goldAwarded: result.goldAwarded,
      newLevel: result.newLevel,
      leveledUp: result.leveledUp,
      newGoldBalance: result.newGoldBalance,
      reason: result.reason,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err), reason: 'server_error' },
      { status: 500 }
    );
  }
}
