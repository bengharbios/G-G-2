import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/admin-auth';
import { ensureAdminTables, getClient } from '@/lib/admin-db';

export const runtime = 'nodejs';

// شحن جواهر مباشر لمستخدم من لوحة الأدمن
// — إضافة ذرية على رصيد الاشتراك (يدعم الأرصدة الفارغة NULL) + سجل العملية
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const admin = await validateToken(token).catch(() => null);
    if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await request.json();
    const userId = String(body.userId ?? '').trim();
    const amount = Math.floor(Number(body.amount));
    const note = String(body.note ?? '').slice(0, 200);

    if (!userId) return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'المبلغ يجب أن يكون رقماً أكبر من صفر' }, { status: 400 });
    }
    if (amount > 1_000_000) {
      return NextResponse.json({ error: 'الحد الأقصى للشحن الواحد 1,000,000 جوهرة' }, { status: 400 });
    }

    await ensureAdminTables();
    const c = getClient();

    // اسم المستخدم للسجل
    const u = await c.execute({
      sql: 'SELECT id, username, displayName, subscriptionId FROM AppUser WHERE id = ? AND isActive = 1 LIMIT 1',
      args: [userId],
    });
    const user = u.rows[0] as Record<string, unknown> | undefined;
    if (!user || !user.subscriptionId) {
      return NextResponse.json({ error: 'المستخدم غير موجود أو غير نشط' }, { status: 404 });
    }

    const upd = await c.execute({
      sql: 'UPDATE Subscription SET gemsBalance = COALESCE(gemsBalance, 0) + ? WHERE id = ?',
      args: [amount, String(user.subscriptionId)],
    });
    if ((upd.rowsAffected ?? 0) === 0) {
      return NextResponse.json({ error: 'فشل تحديث الرصيد (الاشتراك غير موجود)' }, { status: 404 });
    }

    const bal = await c.execute({
      sql: 'SELECT gemsBalance FROM Subscription WHERE id = ?',
      args: [String(user.subscriptionId)],
    });
    const newBalance = Number((bal.rows[0] as Record<string, unknown>)?.gemsBalance ?? 0);

    // سجل العملية
    await c.execute(`
      CREATE TABLE IF NOT EXISTS GemGrantLog (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        username TEXT DEFAULT '',
        displayName TEXT DEFAULT '',
        amount INTEGER NOT NULL,
        balanceAfter INTEGER DEFAULT 0,
        note TEXT DEFAULT '',
        createdBy TEXT DEFAULT '',
        createdAt TEXT DEFAULT (datetime('now'))
      )
    `);
    await c.execute({
      sql: `INSERT INTO GemGrantLog (id, userId, username, displayName, amount, balanceAfter, note, createdBy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        String(user.id),
        String(user.username ?? ''),
        String(user.displayName ?? ''),
        amount,
        newBalance,
        note,
        String(admin.username ?? ''),
      ],
    });

    return NextResponse.json({
      success: true,
      newBalance,
      message: `تم شحن ${amount.toLocaleString('en-US')} جوهرة — الرصيد الجديد: ${newBalance.toLocaleString('en-US')}`,
    });
  } catch (error) {
    console.error('Gem grant error:', error);
    return NextResponse.json({ error: 'فشل شحن الجواهر' }, { status: 500 });
  }
}
