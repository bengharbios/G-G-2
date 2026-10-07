/* ═══════════════════════════════════════════════════════════════════════
   POST /api/push/subscribe — Save a push subscription for a user

   Body: { subscription: { endpoint, keys: { auth, p256dh } } }
   Auth: Requires auth_token cookie
   ═══════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { storePushSubscription, type PushSubscriptionData } from '@/lib/push';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gg-platform-secret-key-2024'
);

export async function POST(request: NextRequest) {
  try {
    // ── Authenticate user ──
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'غير مصرح', success: false },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    if (!userId) {
      return NextResponse.json(
        { error: 'رمز غير صالح', success: false },
        { status: 401 }
      );
    }

    // ── Parse subscription data ──
    const body = await request.json();
    const subscription: PushSubscriptionData = body.subscription;

    if (!subscription?.endpoint || !subscription?.keys?.auth || !subscription?.keys?.p256dh) {
      return NextResponse.json(
        { error: 'بيانات الاشتراك غير صالحة', success: false },
        { status: 400 }
      );
    }

    // Add user agent for debugging
    subscription.userAgent = request.headers.get('user-agent') || undefined;

    // ── Store subscription ──
    const result = await storePushSubscription(userId, subscription);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: result.id,
    });
  } catch (error) {
    console.error('[Push Subscribe] Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الاشتراك بالإشعارات', success: false },
      { status: 500 }
    );
  }
}
