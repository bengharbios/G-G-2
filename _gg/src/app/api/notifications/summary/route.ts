import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getClient, ensureAdminTables, getPendingRequests } from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gg-platform-secret-key-2024'
);

/**
 * GET /api/notifications/summary
 *
 * يُرجع ملخّصاً للإشعارات:
 *   - pendingFriendRequests: عدد طلبات الصداقة المعلّقة
 *   - unreadMessages: العدد الإجمالي للرسائل غير المقروءة من الأصدقاء
 *   - unreadByFriend: مصفوفة { friendId, count, lastMessage, lastMessageAt }
 *                    لعرض شارة على كل صديق في القائمة
 *   - lastReadAt: تاريخ آخر قراءة (للتنظيف)
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'غير مصرح', success: false }, { status: 401 });
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    if (!userId) return NextResponse.json({ error: 'رمز غير صالح', success: false }, { status: 401 });

    await ensureAdminTables();
    const c = getClient();

    // 1) طلبات الصداقة المعلّقة
    const pending = await getPendingRequests(userId);
    const pendingCount = pending.length;

    // 2) الرسائل غير المقروءة من كل صديق
    // نختار كل الرسائل المُرسلة إليّ (fromUserId = friend) والتي لم تُقرأ بعد
    // ونجمّعها حسب fromUserId
    const unreadResult = await c.execute({
      sql: `SELECT fromUserId, COUNT(*) as count, MAX(createdAt) as lastAt, 
                   (SELECT text FROM ChatMessage cm2 
                    WHERE cm2.fromUserId = ChatMessage.fromUserId AND cm2.toUserId = ChatMessage.toUserId 
                    ORDER BY cm2.createdAt DESC LIMIT 1) as lastMessage
            FROM ChatMessage 
            WHERE toUserId = ? AND isRead = 0
            GROUP BY fromUserId`,
      args: [userId],
    });

    const unreadByFriend = unreadResult.rows.map(r => ({
      friendId: String(r.fromUserId),
      count: Number(r.count ?? 0),
      lastMessage: r.lastMessage ? String(r.lastMessage) : '',
      lastMessageAt: r.lastAt ? String(r.lastAt) : '',
    }));

    const totalUnread = unreadByFriend.reduce((s, x) => s + x.count, 0);

    // 3) الإجمالي للشارة على زر "أصدقاء" السفلي
    const totalBadge = pendingCount + totalUnread;

    return NextResponse.json({
      success: true,
      pendingFriendRequests: pendingCount,
      unreadMessages: totalUnread,
      unreadByFriend,
      totalBadge,
    });
  } catch (error) {
    console.error('[Notifications Summary] Error:', error);
    return NextResponse.json({ error: 'حدث خطأ', success: false }, { status: 500 });
  }
}
