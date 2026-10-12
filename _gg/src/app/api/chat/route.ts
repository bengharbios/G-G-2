import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getClient, ensureAdminTables, areFriends } from '@/lib/admin-db';
import { randomUUID } from 'crypto';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'gg-platform-secret-key-2024');

async function getUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { const { payload } = await jwtVerify(token, JWT_SECRET); return payload.userId as string; }
  catch { return null; }
}

// GET messages between current user and a friend
// يتحقق أيضاً من حالة الصداقة: إن لم يعودا أصدقاء، أرجع friendshipStatus='none'
// حتى يُظهر العميل زر "إضافة صديق" بدلاً من مربع الإدخال
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get('friendId');
    const after = searchParams.get('after'); // ISO timestamp for polling
    if (!friendId) return NextResponse.json({ error: 'friendId مطلوب' }, { status: 400 });

    await ensureAdminTables();
    const c = getClient();

    // تحقق من حالة الصداقة الحالية — قد يكون أحدهما حذف الآخر
    const isFriend = await areFriends(userId, friendId);

    const result = await c.execute({
      sql: `SELECT id, fromUserId, toUserId, text, type, isRead, createdAt
            FROM ChatMessage
            WHERE ((fromUserId = ? AND toUserId = ?) OR (fromUserId = ? AND toUserId = ?))
            ${after ? 'AND createdAt > ?' : ''}
            ORDER BY createdAt ASC LIMIT 200`,
      args: after ? [userId, friendId, friendId, userId, after] : [userId, friendId, friendId, userId],
    });

    // Mark messages from friend as read (only if still friends — otherwise keep
    // them unread so the user can see they have pending messages from a former friend)
    if (isFriend) {
      await c.execute({
        sql: `UPDATE ChatMessage SET isRead = 1 WHERE fromUserId = ? AND toUserId = ? AND isRead = 0`,
        args: [friendId, userId],
      });
    }

    return NextResponse.json({
      success: true,
      messages: result.rows,
      friendshipStatus: isFriend ? 'friends' : 'none',
    });
  } catch (error) {
    console.error('[Chat GET]', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// POST send a message
// يتحقق من حالة الصداقة قبل الإدراج — يمنع الإرسال بعد الحذف من أي طرف
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const { toUserId, text, type } = await request.json();
    if (!toUserId || !text) return NextResponse.json({ error: 'البيانات ناقصة' }, { status: 400 });

    await ensureAdminTables();

    // تحقق من الصداقة قبل السماح بالإرسال
    const isFriend = await areFriends(userId, toUserId);
    if (!isFriend) {
      return NextResponse.json({
        success: false,
        error: 'لم تعودا أصدقاء — أعد إضافة الصداقة لإرسال الرسائل',
        friendshipStatus: 'none',
      }, { status: 403 });
    }

    const c = getClient();
    const id = randomUUID();
    await c.execute({
      sql: `INSERT INTO ChatMessage (id, fromUserId, toUserId, text, type, isRead, createdAt)
            VALUES (?, ?, ?, ?, ?, 0, datetime('now'))`,
      args: [id, userId, toUserId, text.slice(0, 2000), type || 'text'],
    });

    return NextResponse.json({ success: true, id, createdAt: new Date().toISOString() });
  } catch (error) {
    console.error('[Chat POST]', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
