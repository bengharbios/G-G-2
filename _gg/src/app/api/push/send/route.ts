/* ═══════════════════════════════════════════════════════════════════════
   POST /api/push/send — Send a push notification to one or more users

   Body: {
     userIds: string[],        // Target user IDs
     payload: {
       title: string,
       body: string,
       icon?: string,
       badge?: string,
       tag?: string,
       url?: string,
       data?: Record<string, unknown>,
     }
   }

   This endpoint is called by the signaling server (voice-signal)
   when a user is not connected via WebSocket and needs to receive
   a notification via Web Push.
   ═══════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { sendPushToUsers } from '@/lib/push';

// Simple API key auth for server-to-server calls
const PUSH_API_KEY = process.env.PUSH_API_KEY || 'gg-push-internal-key-2024';

export async function POST(request: NextRequest) {
  try {
    // ── Server-to-server auth via API key ──
    const apiKey = request.headers.get('x-push-api-key');
    if (apiKey !== PUSH_API_KEY) {
      return NextResponse.json(
        { error: 'غير مصرح', success: false },
        { status: 401 }
      );
    }

    // ── Parse request body ──
    const body = await request.json();
    const { userIds, payload } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'userIds مطلوب', success: false },
        { status: 400 }
      );
    }

    if (!payload?.title || !payload?.body) {
      return NextResponse.json(
        { error: 'payload.title و payload.body مطلوبان', success: false },
        { status: 400 }
      );
    }

    // ── Send push notifications ──
    const result = await sendPushToUsers(userIds, {
      title: payload.title,
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      tag: payload.tag,
      url: payload.url,
      data: payload.data,
      vibrate: payload.vibrate,
    });

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error) {
    console.error('[Push Send] Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إرسال الإشعارات', success: false },
      { status: 500 }
    );
  }
}
