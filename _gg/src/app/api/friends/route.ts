import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getFriendsList, getPendingRequests, sendFriendRequest, searchUsers } from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'gg-platform-secret-key-2024');

async function getUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { const { payload } = await jwtVerify(token, JWT_SECRET); return payload.userId as string; }
  catch { return null; }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'friends';
    const q = searchParams.get('q') || '';
    if (type === 'pending') { const requests = await getPendingRequests(userId); return NextResponse.json({ success: true, requests }); }
    if (type === 'search' && q) { const users = await searchUsers(q, userId); return NextResponse.json({ success: true, users }); }
    const friends = await getFriendsList(userId); return NextResponse.json({ success: true, friends });
  } catch (error) { console.error('[Friends GET]', error); return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const { toUsername, toUserId } = await request.json();
    if (!toUsername && !toUserId) return NextResponse.json({ error: 'اسم المستخدم أو المعرّف مطلوب' }, { status: 400 });

    // إن أُرسل toUserId (من صفحة بروفايل المستخدم) نبحث عن اسم المستخدم منه
    let targetUsername = toUsername;
    if (!targetUsername && toUserId) {
      const { getClient, ensureAdminTables } = await import('@/lib/admin-db');
      await ensureAdminTables();
      const c = getClient();
      const r = await c.execute({ sql: 'SELECT username FROM AppUser WHERE id = ?', args: [toUserId] });
      if (r.rows.length === 0) return NextResponse.json({ success: false, error: 'المستخدم غير موجود' });
      targetUsername = r.rows[0].username as string;
    }
    const result = await sendFriendRequest(userId, targetUsername);
    return NextResponse.json(result);
  } catch (error) { console.error('[Friends POST]', error); return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}
