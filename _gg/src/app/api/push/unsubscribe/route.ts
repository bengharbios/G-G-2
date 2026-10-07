/* ═══════════════════════════════════════════════════════════════════════
   DELETE /api/push/unsubscribe — Remove a push subscription

   Body: { endpoint?: string } — if no endpoint, removes all for user
   Auth: Requires auth_token cookie
   ═══════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { removePushSubscription } from '@/lib/push';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gg-platform-secret-key-2024'
);

export async function DELETE(request: NextRequest) {
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

    // ── Parse body for optional endpoint ──
    let endpoint: string | undefined;
    try {
      const body = await request.json();
      endpoint = body.endpoint;
    } catch {
      // No body — remove all subscriptions
    }

    // ── Remove subscription ──
    const result = await removePushSubscription(userId, endpoint);

    return NextResponse.json({
      success: result.success,
    });
  } catch (error) {
    console.error('[Push Unsubscribe] Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إلغاء الاشتراك', success: false },
      { status: 500 }
    );
  }
}
