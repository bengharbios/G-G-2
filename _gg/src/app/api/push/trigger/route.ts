/* ═══════════════════════════════════════════════════════════════════════
   POST /api/push/trigger — Trigger push notification from voice room API

   Called by voice room API routes when events happen that need
   push notifications (e.g., role invite, seat granted, etc.)

   Body: {
     targetUserId: string,
     type: 'invite' | 'mention' | 'kick' | 'seat_request' | 'seat_granted' | 'room_event',
     title: string,
     body: string,
     roomId: string,
     fromUserId?: string,
     fromDisplayName?: string,
   }
   Auth: Requires auth_token cookie
   ═══════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { sendPushToUser } from '@/lib/push';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gg-platform-secret-key-2024'
);

export async function POST(request: NextRequest) {
  try {
    // ── Authenticate user (the sender) ──
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'غير مصرح', success: false },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const senderUserId = payload.userId as string;
    if (!senderUserId) {
      return NextResponse.json(
        { error: 'رمز غير صالح', success: false },
        { status: 401 }
      );
    }

    // ── Parse body ──
    const body = await request.json();
    const { targetUserId, type, title, body: notifBody, roomId, fromUserId, fromDisplayName } = body;

    if (!targetUserId || !type || !title || !notifBody) {
      return NextResponse.json(
        { error: 'بيانات غير كافية', success: false },
        { status: 400 }
      );
    }

    // ── Send push notification ──
    const result = await sendPushToUser(targetUserId, {
      title,
      body: notifBody,
      tag: `ggames-${type}-${roomId || 'global'}`,
      url: '/voice-rooms',
      data: {
        type,
        roomId,
        fromUserId: fromUserId || senderUserId,
        fromDisplayName,
        timestamp: Date.now(),
      },
    });

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error) {
    console.error('[Push Trigger] Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إرسال الإشعار', success: false },
      { status: 500 }
    );
  }
}
