import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { acceptFriendRequest, rejectFriendRequest, removeFriend } from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'gg-platform-secret-key-2024');

async function getUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { const { payload } = await jwtVerify(token, JWT_SECRET); return payload.userId as string; }
  catch { return null; }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const { id } = await params;
    const ok = await acceptFriendRequest(id); return NextResponse.json({ success: ok });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    if (searchParams.get('action') === 'reject') { const ok = await rejectFriendRequest(id); return NextResponse.json({ success: ok }); }
    const ok = await removeFriend(id, userId); return NextResponse.json({ success: ok });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}
