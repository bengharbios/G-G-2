/* ═══════════════════════════════════════════════════════════════════════
   Push Notification Utility — Web Push API server-side helpers

   Uses web-push library with VAPID keys to send push notifications
   to subscribed browsers/devices via Push API.

   Features:
   - Store/retrieve push subscriptions per user
   - Send push notifications to specific users
   - Auto-cleanup of expired subscriptions
   - Works with @libsql/client (Turso/SQLite)
   ═══════════════════════════════════════════════════════════════════════ */

import webpush from 'web-push';
import { createClient, Client } from '@libsql/client';

// ── VAPID Configuration ──
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:push@ggames.app';

// Configure web-push with VAPID keys
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// ── DB Client ──
let _pushClient: Client | null = null;

function getPushDb(): Client {
  if (_pushClient) return _pushClient;

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const fallbackUrl = process.env.DATABASE_URL || 'file:db/data.db';
  const isLocalDev = !!process.env.NODE_ENV && process.env.NODE_ENV === 'development' && fallbackUrl.startsWith('file:');
  const dbUrl = (tursoUrl && !isLocalDev) ? tursoUrl : fallbackUrl;
  const isRemote = dbUrl.startsWith('libsql://');

  _pushClient = createClient({
    url: dbUrl,
    ...(isRemote ? { authToken: process.env.TURSO_AUTH_TOKEN || '' } : {}),
  });

  return _pushClient;
}

// ── Ensure PushSubscription table exists ──
let _pushTableReady = false;

export async function ensurePushTable(): Promise<void> {
  if (_pushTableReady) return;
  const db = getPushDb();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS PushSubscription (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      endpoint TEXT UNIQUE NOT NULL,
      keysAuth TEXT NOT NULL,
      keysP256dh TEXT NOT NULL,
      userAgent TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create index for fast lookup by userId
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_push_sub_userId ON PushSubscription(userId)
  `);

  _pushTableReady = true;
}

// ── Types ──
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
  userAgent?: string;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: Record<string, unknown>;
  vibrate?: number[];
}

// ── Store a push subscription ──
export async function storePushSubscription(
  userId: string,
  subscription: PushSubscriptionData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await ensurePushTable();
    const db = getPushDb();

    // Check if this endpoint already exists (replace subscription)
    const existing = await db.execute({
      sql: 'SELECT id FROM PushSubscription WHERE endpoint = ?',
      args: [subscription.endpoint],
    });

    if (existing.rows.length > 0) {
      // Update existing subscription
      const existingId = existing.rows[0].id as string;
      await db.execute({
        sql: `UPDATE PushSubscription
              SET userId = ?, keysAuth = ?, keysP256dh = ?, userAgent = ?, updatedAt = datetime('now')
              WHERE endpoint = ?`,
        args: [userId, subscription.keys.auth, subscription.keys.p256dh, subscription.userAgent || null, subscription.endpoint],
      });
      return { success: true, id: existingId };
    }

    // Create new subscription
    const id = `push_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db.execute({
      sql: `INSERT INTO PushSubscription (id, userId, endpoint, keysAuth, keysP256dh, userAgent)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, userId, subscription.endpoint, subscription.keys.auth, subscription.keys.p256dh, subscription.userAgent || null],
    });

    return { success: true, id };
  } catch (error) {
    console.error('[Push] Error storing subscription:', error);
    return { success: false, error: 'فشل في حفظ الاشتراك' };
  }
}

// ── Remove a push subscription ──
export async function removePushSubscription(
  userId: string,
  endpoint?: string
): Promise<{ success: boolean }> {
  try {
    await ensurePushTable();
    const db = getPushDb();

    if (endpoint) {
      await db.execute({
        sql: 'DELETE FROM PushSubscription WHERE userId = ? AND endpoint = ?',
        args: [userId, endpoint],
      });
    } else {
      // Remove all subscriptions for this user
      await db.execute({
        sql: 'DELETE FROM PushSubscription WHERE userId = ?',
        args: [userId],
      });
    }

    return { success: true };
  } catch (error) {
    console.error('[Push] Error removing subscription:', error);
    return { success: false };
  }
}

// ── Get all subscriptions for a user ──
export async function getUserPushSubscriptions(userId: string): Promise<PushSubscriptionData[]> {
  try {
    await ensurePushTable();
    const db = getPushDb();

    const result = await db.execute({
      sql: 'SELECT endpoint, keysAuth, keysP256dh FROM PushSubscription WHERE userId = ?',
      args: [userId],
    });

    return result.rows.map(row => ({
      endpoint: row.endpoint as string,
      keys: {
        auth: row.keysAuth as string,
        p256dh: row.keysP256dh as string,
      },
    }));
  } catch (error) {
    console.error('[Push] Error fetching subscriptions:', error);
    return [];
  }
}

// ── Send a push notification to a specific user ──
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  try {
    const subscriptions = await getUserPushSubscriptions(userId);

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;
    const expiredEndpoints: string[] = [];

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192.png',
      badge: payload.badge || '/icons/icon-72.png',
      tag: payload.tag || `ggames-${Date.now()}`,
      data: {
        url: payload.url || '/voice-rooms',
        ...payload.data,
      },
      vibrate: payload.vibrate || [200, 100, 200],
      requireInteraction: false,
    });

    // Send to all user subscriptions in parallel
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        await webpush.sendNotification(sub, notificationPayload);
      })
    );

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        sent++;
      } else {
        failed++;
        const error = result.reason as Error & { statusCode?: number };
        // 404 or 410 means subscription expired — clean it up
        if (error.statusCode === 404 || error.statusCode === 410) {
          expiredEndpoints.push(subscriptions[i].endpoint);
        }
        console.warn('[Push] Failed to send:', error.message);
      }
    });

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      const db = getPushDb();
      for (const endpoint of expiredEndpoints) {
        await db.execute({
          sql: 'DELETE FROM PushSubscription WHERE endpoint = ?',
          args: [endpoint],
        });
      }
      console.log(`[Push] Cleaned up ${expiredEndpoints.length} expired subscriptions`);
    }

    return { sent, failed };
  } catch (error) {
    console.error('[Push] Error sending push to user:', error);
    return { sent: 0, failed: 0 };
  }
}

// ── Send push to multiple users ──
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  const results = await Promise.allSettled(
    userIds.map(userId => sendPushToUser(userId, payload))
  );

  results.forEach(result => {
    if (result.status === 'fulfilled') {
      totalSent += result.value.sent;
      totalFailed += result.value.failed;
    }
  });

  return { sent: totalSent, failed: totalFailed };
}

// ── Get VAPID public key (for client-side) ──
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}
