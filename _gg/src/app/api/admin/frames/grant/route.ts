import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/admin-auth';
import { grantFrameToUser, getFrameById, getUserById, getUserByUsername } from '@/lib/admin-db';

async function verifyAdminAuth(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return null;
  try {
    return await validateToken(token);
  } catch {
    return null;
  }
}

// Simple UUID v4 check (allows partial match too)
function looksLikeUUID(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const body = await request.json();
    const { userId, subscriptionId, frameId, obtainedFrom, obtainedNote } = body;

    if (!userId || !frameId) {
      return NextResponse.json({ error: 'معرف المستخدم والإطار مطلوبان' }, { status: 400 });
    }

    // Resolve the actual userId — if the value doesn't look like a UUID, try username lookup
    let resolvedUserId = userId;
    if (!looksLikeUUID(userId)) {
      const userByUserName = await getUserByUsername(userId);
      if (!userByUserName) {
        return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
      }
      resolvedUserId = userByUserName.id;
    } else {
      // Even if it looks like a UUID, verify the user exists
      const userById = await getUserById(userId);
      if (!userById) {
        return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
      }
    }

    const frame = await getFrameById(frameId);
    if (!frame) {
      return NextResponse.json({ error: 'الإطار غير موجود' }, { status: 404 });
    }

    const userFrame = await grantFrameToUser({
      userId: resolvedUserId,
      subscriptionId,
      frameId,
      obtainedFrom: obtainedFrom || 'admin',
      obtainedNote: obtainedNote || '',
    });

    if (!userFrame) {
      return NextResponse.json({ error: 'المستخدم يمتلك هذا الإطار بالفعل' }, { status: 409 });
    }

    return NextResponse.json({ success: true, userFrame });
  } catch (error) {
    console.error('Grant frame error:', error);
    return NextResponse.json({ error: 'فشل في منح الإطار' }, { status: 500 });
  }
}
