import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getClient, ensureAdminTables, validateToken } from '@/lib/admin-db';
import crypto from 'crypto';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'gg-platform-secret-key-2024');

async function getUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { const { payload } = await jwtVerify(token, JWT_SECRET); return payload.userId as string; }
  catch { return null; }
}

// GET user's notifications
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    await ensureAdminTables();
    const c = getClient();
    const result = await c.execute({
      sql: `SELECT * FROM UserNotification WHERE userId = ? ORDER BY createdAt DESC LIMIT 50`,
      args: [userId],
    });
    const unread = await c.execute({
      sql: `SELECT COUNT(*) as n FROM UserNotification WHERE userId = ? AND isRead = 0`,
      args: [userId],
    });
    return NextResponse.json({ success: true, notifications: result.rows, unreadCount: Number(unread.rows[0]?.n ?? 0) });
  } catch (error) {
    console.error('[Notifications GET]', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// POST send notification (admin only)
export async function POST(request: NextRequest) {
  try {
    const admin = await validateToken(request.cookies.get('admin_token')?.value || '');
    if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { userId, userIds, title, body, type, broadcastToAll } = await request.json();
    if (!title) return NextResponse.json({ error: 'العنوان مطلوب' }, { status: 400 });

    await ensureAdminTables();
    const c = getClient();

    if (broadcastToAll) {
      // Send to all users
      const users = await c.execute({ sql: 'SELECT id FROM AppUser WHERE isActive = 1', args: [] });
      for (const u of users.rows) {
        await c.execute({
          sql: `INSERT INTO UserNotification (id, userId, title, body, type, isRead, createdAt)
                VALUES (?, ?, ?, ?, ?, 0, datetime('now'))`,
          args: [crypto.randomUUID(), u.id, title, body || '', type || 'info'],
        });
      }
      return NextResponse.json({ success: true, sent: users.rows.length });
    } else if (userIds && Array.isArray(userIds)) {
      // Send to multiple users
      for (const uid of userIds) {
        await c.execute({
          sql: `INSERT INTO UserNotification (id, userId, title, body, type, isRead, createdAt)
                VALUES (?, ?, ?, ?, ?, 0, datetime('now'))`,
          args: [crypto.randomUUID(), uid, title, body || '', type || 'info'],
        });
      }
      return NextResponse.json({ success: true, sent: userIds.length });
    } else if (userId) {
      // Send to single user
      await c.execute({
        sql: `INSERT INTO UserNotification (id, userId, title, body, type, isRead, createdAt)
              VALUES (?, ?, ?, ?, ?, 0, datetime('now'))`,
        args: [crypto.randomUUID(), userId, title, body || '', type || 'info'],
      });
      return NextResponse.json({ success: true, sent: 1 });
    }
    return NextResponse.json({ error: 'حدد مستلم' }, { status: 400 });
  } catch (error) {
    console.error('[Notifications POST]', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// PUT mark as read
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const { notificationId } = await request.json();
    await ensureAdminTables();
    const c = getClient();
    if (notificationId) {
      await c.execute({ sql: `UPDATE UserNotification SET isRead = 1 WHERE id = ? AND userId = ?`, args: [notificationId, userId] });
    } else {
      await c.execute({ sql: `UPDATE UserNotification SET isRead = 1 WHERE userId = ?`, args: [userId] });
    }
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}
