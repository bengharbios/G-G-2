/* ═══════════════════════════════════════════════════════════════════════
   POST /api/push/vapid-key — Return the public VAPID key

   Called by the client before subscribing to push notifications.
   ═══════════════════════════════════════════════════════════════════════ */

import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/lib/push';

export async function GET() {
  const publicKey = getVapidPublicKey();

  if (!publicKey) {
    return NextResponse.json(
      { error: 'VAPID key not configured', success: false },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    publicKey,
  });
}
