import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getUserFrames, equipFrame, removeFrameFromUser, seedDefaultFrames, grantFrameToUser, getFrameById, ensureAdminTables, getClient } from '@/lib/admin-db';

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

// ─── زرع كتالوج الإطارات عند أول استخدام (idempotent عبر SiteConfig.framesSeeded) ───
export async function HEAD() {
  try {
    await seedDefaultFrames();
  } catch (error) {
    console.error('Frame seed error:', error);
  }
  return new Response(null, { status: 204 });
}

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAppUser(request);
    if (!userId) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
    }

    // زرع الكتالوج عند أول طلب (idempotent — لا يكرر الزرع بعد أول مرة)
    await seedDefaultFrames();
    const userFrames = await getUserFrames(userId);

    return NextResponse.json({ success: true, userFrames });
  } catch (error) {
    console.error('Get user frames GET error:', error);
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
      try {
        await ensureAdminTables();
        const c = getClient();
        if (frameId) {
          // الإطارات المجانية تُمنح تلقائياً عند أول تجهيز (مثل «مجانية» في النظام)
          const own = await c.execute({
            sql: 'SELECT id FROM UserFrame WHERE userId = ? AND frameId = ? LIMIT 1',
            args: [userId, frameId],
          });
          if (own.rows.length === 0) {
            const fr = await getFrameById(String(frameId));
            if (fr && fr.isActive && fr.isFree) {
              await grantFrameToUser({ userId, frameId: fr.id, obtainedFrom: 'gift', obtainedNote: 'إطار مجاني' });
            }
          }
        }
        await equipFrame(userId, frameId || null);
        return NextResponse.json({ success: true });
      } catch (equipError) {
        const msg = equipError instanceof Error ? equipError.message : 'فشل في تجهيز الإطار';
        console.error('Frame equip denied:', equipError);
        return NextResponse.json({ success: false, error: msg }, { status: 403 });
      }
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
