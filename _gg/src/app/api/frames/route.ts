import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getUserFrames, equipFrame, removeFrameFromUser } from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gg-platform-secret-key-2024'
);

async function verifyAppUser(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as string;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAppUser(request);
    if (!userId) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
    }

    const userFrames = await getUserFrames(userId);

    return NextResponse.json({ success: true, userFrames });
  } catch (error) {
    console.error('Get user frames error:', error);
    return NextResponse.json({ error: 'فشل في تحميل الإطارات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAppUser(request);
    if (!userId) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
    }

    const body = await request.json();
    const { action, frameId } = body;

    if (action === 'equip') {
      await equipFrame(userId, frameId || null);
      return NextResponse.json({ success: true });
    }

    if (action === 'remove') {
      if (!frameId) {
        return NextResponse.json({ error: 'معرف الإطار مطلوب' }, { status: 400 });
      }
      await removeFrameFromUser(userId, frameId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
  } catch (error) {
    console.error('Frame action error:', error);
    return NextResponse.json({ error: 'فشل في تنفيذ العملية' }, { status: 500 });
  }
}
