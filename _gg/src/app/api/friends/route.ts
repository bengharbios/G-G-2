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
    const { toUsername } = await request.json();
    if (!toUsername) return NextResponse.json({ error: 'اسم المستخدم مطلوب' }, { status: 400 });
    const result = await sendFriendRequest(userId, toUsername); return NextResponse.json(result);
  } catch (error) { console.error('[Friends POST]', error); return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}
