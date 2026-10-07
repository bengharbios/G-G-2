import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { seedDefaultDecor, ensureAdminTables, getClient, getDecorItems } from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gg-platform-secret-key-2024'
);

// شراء عنصر زينة (معلق/موضوع/بطاقة) بجواهر — خصم ذري مع تراجع عند الفشل، ومنح مجاني للعناصر المجانية
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول', success: false }, { status: 401 });
    }
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    if (!userId) {
      return NextResponse.json({ error: 'رمز غير صالح', success: false }, { status: 401 });
    }

    const body = await request.json();
    const { itemId } = body;
    if (!itemId) {
      return NextResponse.json({ error: 'بيانات الشراء ناقصة', success: false }, { status: 400 });
    }

    await seedDefaultDecor();
    await ensureAdminTables();
    const c = getClient();

    const items = await getDecorItems();
    const item = items.find((i) => i.id === String(itemId));
    if (!item) {
      return NextResponse.json({ error: 'العنصر غير متوفر', success: false }, { status: 404 });
    }

    // لا يملكه مسبقاً
    const existing = await c.execute({
      sql: 'SELECT id FROM UserDecor WHERE userId = ? AND itemId = ? LIMIT 1',
      args: [userId, item.id],
    });
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'تملك هذا العنصر مسبقاً', success: false, alreadyOwned: true },
        { status: 400 }
      );
    }

    // ربط المستخدم باشتراكه (للخصم)
    const userRow = await c.execute({
      sql: 'SELECT subscriptionId FROM AppUser WHERE id = ? AND isActive = 1 LIMIT 1',
      args: [userId],
    });
    const urow = userRow.rows[0] as Record<string, unknown> | undefined;
    if (!urow) {
      return NextResponse.json({ error: 'المستخدم غير موجود', success: false }, { status: 404 });
    }
    const userSubId = String(urow.subscriptionId ?? '').trim();
    if (!item.isFree && item.price > 0 && !userSubId) {
      return NextResponse.json({ error: 'حسابك غير مربوط باشتراك — لا يمكن الشراء', success: false }, { status: 400 });
    }

    // منح الملكية أولاً ثم الخصم الذري (مع تراجع)
    const id = crypto.randomUUID();
    await c.execute({
      sql: `INSERT INTO UserDecor (id, userId, itemId, isEquipped, obtainedFrom, obtainedNote)
            VALUES (?, ?, ?, 0, 'purchase', 'شراء من المتجر')`,
      args: [id, userId, item.id],
    });
    await c.execute({ sql: 'UPDATE DecorItem SET totalOwned = totalOwned + 1 WHERE id = ?', args: [item.id] });

    let deductOk = true;
    let newBalance = -1;
    if (!item.isFree && item.price > 0) {
      const deductRes = await c.execute({
        sql: 'UPDATE Subscription SET gemsBalance = gemsBalance - ? WHERE id = ? AND gemsBalance >= ?',
        args: [item.price, userSubId, item.price],
      });
      deductOk = deductRes.rowsAffected > 0;
      if (deductOk) {
        const bal = await c.execute({
          sql: 'SELECT gemsBalance FROM Subscription WHERE id = ? LIMIT 1',
          args: [userSubId],
        });
        newBalance = Number((bal.rows[0] as Record<string, unknown> | undefined)?.gemsBalance ?? 0);
      }
    }

    if (!deductOk) {
      await c.execute({ sql: 'DELETE FROM UserDecor WHERE userId = ? AND itemId = ?', args: [userId, item.id] });
      await c.execute({ sql: 'UPDATE DecorItem SET totalOwned = MAX(0, totalOwned - 1) WHERE id = ?', args: [item.id] });
      return NextResponse.json({ error: 'رصيد الجواهر غير كافٍ', success: false }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      itemId: item.id,
      nameAr: item.nameAr,
      price: item.isFree ? 0 : item.price,
      newBalance: newBalance < 0 ? undefined : newBalance,
    });
  } catch (error) {
    console.error('Purchase decor error:', error);
    return NextResponse.json({ error: 'فشل الشراء، حاول مجدداً', success: false }, { status: 500 });
  }
}
