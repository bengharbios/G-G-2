import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getUserById, getAllSubscriptions, checkGameAccess } from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gg-platform-secret-key-2024'
);

/**
 * فحص وصول المستخدم إلى لعبة عبر **كل** اشتراكاته:
 * الاشتراك المرتبط بـ AppUser.subscriptionId + كل الاشتراكات المطابقة لبريده.
 * يُسمح بالدخول إذا وافق أي اشتراك — فيستطيع العميل استعمال أي اشتراك يريده في الألعاب.
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(
        { authenticated: false, allowed: false, reason: 'not_logged_in' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    if (!userId) {
      return NextResponse.json(
        { authenticated: false, allowed: false, reason: 'not_logged_in' },
        { status: 401 }
      );
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { authenticated: false, allowed: false, reason: 'user_not_found' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const gameSlug = String(body.gameSlug || '');
    const incrementUsage = !!body.incrementUsage;

    if (!gameSlug) {
      return NextResponse.json(
        { authenticated: true, allowed: false, reason: 'game_required' },
        { status: 400 }
      );
    }

    // اجمع كل اشتراكات المستخدم: المرتبط مباشرة + المطابقة بالبريد (بدون تكرار)
    const allSubs = await getAllSubscriptions();
    const emailLc = user.email.trim().toLowerCase();
    const byId = new Map<string, typeof allSubs[number]>();
    for (const s of allSubs) {
      if (s.id === user.subscriptionId || (s.email || '').trim().toLowerCase() === emailLc) {
        byId.set(s.id, s);
      }
    }
    const candidates = [...byId.values()];

    if (candidates.length === 0) {
      return NextResponse.json({
        authenticated: true,
        allowed: false,
        reason: 'no_subscriptions',
      });
    }

    // المرة الأولى: فحص بدون استهلاك جلسات تجربة
    const results = await Promise.all(
      candidates.map(async (s) => ({
        sub: s,
        result: await checkGameAccess(s.subscriptionCode, gameSlug, { incrementTrialUsage: false }),
      }))
    );

    const allowedOnes = results.filter((r) => r.result.allowed);

    if (allowedOnes.length === 0) {
      // أعِد أفضل سبب رفض (اشتراك واحد على الأقل موجود)
      const best = results[0];
      return NextResponse.json({
        authenticated: true,
        allowed: false,
        reason: best.result.reason,
        subscriber: best.result.subscriber
          ? {
              name: best.result.subscriber.name,
              subscriptionCode: best.result.subscriber.subscriptionCode,
              plan: best.result.subscriber.plan,
              isTrial: best.result.subscriber.isTrial,
              isActive: best.result.subscriber.isActive,
              endDate: best.result.subscriber.endDate,
            }
          : undefined,
        trialInfo: best.result.trialInfo,
        ownedCount: candidates.length,
      });
    }

    // اختر الأفضل: الأحدث انتهاءً (بلا انتهاء = الأفضل)
    const score = (endDate: string | null) =>
      endDate ? new Date(endDate).getTime() : Number.MAX_SAFE_INTEGER;
    allowedOnes.sort((a, b) => score(b.sub.endDate) - score(a.sub.endDate));
    const chosen = allowedOnes[0];

    // استهلاك جلسة التجربة على المشترك المختار فقط إذا طُلب
    let trialInfo = chosen.result.trialInfo;
    if (incrementUsage) {
      const consumed = await checkGameAccess(chosen.sub.subscriptionCode, gameSlug, {
        incrementTrialUsage: true,
      });
      trialInfo = consumed.trialInfo ?? trialInfo;
    }

    return NextResponse.json({
      authenticated: true,
      allowed: true,
      reason: chosen.result.reason,
      usedCode: chosen.sub.subscriptionCode,
      ownedCount: candidates.length,
      subscriber: chosen.result.subscriber
        ? {
            name: chosen.result.subscriber.name,
            subscriptionCode: chosen.result.subscriber.subscriptionCode,
            plan: chosen.result.subscriber.plan,
            isTrial: chosen.result.subscriber.isTrial,
            isActive: chosen.result.subscriber.isActive,
            endDate: chosen.result.subscriber.endDate,
          }
        : undefined,
      trialInfo,
    });
  } catch {
    return NextResponse.json(
      { authenticated: false, allowed: false, reason: 'server_error' },
      { status: 500 }
    );
  }
}
