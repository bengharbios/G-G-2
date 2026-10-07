import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import {
  getFrameById,
  grantFrameToUser,
  ensureAdminTables,
  getClient,
} from '@/lib/admin-db';

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

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAppUser(request);
    if (!userId) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول', success: false }, { status: 401 });
    }

    const body = await request.json();
    const { frameId } = body;
    if (!frameId) {
      return NextResponse.json({ error: 'بيانات الشراء ناقصة', success: false }, { status: 400 });
    }

    await ensureAdminTables();
    const c = getClient();

    // 1) الإطار موجود وفي الكتالوج النشط
    const frame = await getFrameById(String(frameId));
    if (!frame || !frame.isActive) {
      return NextResponse.json({ error: 'الإطار غير متوفر', success: false }, { status: 404 });
    }

    // 2) لا يُشترى إطار مجاني أو بلا سعر
    if (frame.isFree || frame.price <= 0) {
      return NextResponse.json({ error: 'هذا الإطار مجاني ولا يُشترى', success: false }, { status: 400 });
    }

    // 3) لا يملكه مسبقاً
    const existing = await c.execute({
      sql: 'SELECT id FROM UserFrame WHERE userId = ? AND frameId = ? LIMIT 1',
      args: [userId, frame.id],
    });
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'تملك هذا الإطار مسبقاً', success: false, alreadyOwned: true },
        { status: 400 }
      );
    }

    // 4) بيانات ربط المستخدم باشتراكه (للخصم ولتوثيق الملكية)
    const userRow = await c.execute({
      sql: 'SELECT subscriptionId FROM AppUser WHERE id = ? AND isActive = 1 LIMIT 1',
      args: [userId],
    });
    const urow = userRow.rows[0] as Record<string, unknown> | undefined;
    if (!urow) {
      return NextResponse.json({ error: 'المستخدم غير موجود', success: false }, { status: 404 });
    }
    const userSubId = String(urow.subscriptionId ?? '').trim();
    if (!userSubId) {
      return NextResponse.json({ error: 'حسابك غير مربوط باشتراك — لا يمكن الشراء', success: false }, { status: 400 });
    }

    // 5) منح الملكية أولاً ثم خصم ذري مع تراجع عند فشل الخصم
    const granted = await grantFrameToUser({
      userId,
      subscriptionId: userSubId,
      frameId: frame.id,
      obtainedFrom: 'purchase',
      obtainedNote: 'شراء من المتجر',
    });
    if (!granted) {
      return NextResponse.json({ error: 'تعذر منح الإطار', success: false }, { status: 500 });
    }

    // خصم ذري من اشتراك المستخدم نفسه: نجح فقط إن كان الرصيد كافياً لحظة الخصم
    let deductOk = false;
    let newBalance = 0;
    const deductRes = await c.execute({
      sql: `UPDATE Subscription SET gemsBalance = gemsBalance - ? WHERE id = ? AND gemsBalance >= ?`,
      args: [frame.price, userSubId, frame.price],
    });
    deductOk = deductRes.rowsAffected > 0;
    if (deductOk) {
      const bal = await c.execute({
        sql: 'SELECT gemsBalance FROM Subscription WHERE id = ? LIMIT 1',
        args: [userSubId],
      });
      newBalance = Number((bal.rows[0] as Record<string, unknown> | undefined)?.gemsBalance ?? 0);
    }

    if (!deductOk) {
      // التراجع عن المنح — الرصيد لم يكفِ
      await c.execute({
        sql: 'DELETE FROM UserFrame WHERE userId = ? AND frameId = ?',
        args: [userId, frame.id],
      });
      await c.execute({
        sql: 'UPDATE PlayerFrame SET totalOwned = MAX(0, totalOwned - 1) WHERE id = ?',
        args: [frame.id],
      });
      return NextResponse.json(
        { error: 'رصيد الجواهر غير كافٍ', success: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      frameId: frame.id,
      nameAr: frame.nameAr || frame.name,
      price: frame.price,
      newBalance,
    });
  } catch (error) {
    console.error('Purchase frame error:', error);
    return NextResponse.json({ error: 'فشل الشراء، حاول مجدداً', success: false }, { status: 500 });
  }
}
