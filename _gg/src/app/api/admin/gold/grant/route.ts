import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/admin-auth';
import { ensureAdminTables, getClient } from '@/lib/admin-db';

export const runtime = 'nodejs';

// شحن ذهب مباشر لمستخدم من صفحة الشحن الموحدة (لوحة الأدمن)
// — الذهب في AppUser.gold (مستقل عن جواهر الاشتراك)
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
      return NextResponse.json({ error: 'الحد الأقصى للشحن الواحد 1,000,000 ذهبية' }, { status: 400 });
    }

    await ensureAdminTables();
    const c = getClient();

    const u = await c.execute({
      sql: 'SELECT id, username, displayName FROM AppUser WHERE id = ? AND isActive = 1 LIMIT 1',
      args: [userId],
    });
    const user = u.rows[0] as Record<string, unknown> | undefined;
    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود أو غير نشط' }, { status: 404 });
    }

    const upd = await c.execute({
      sql: 'UPDATE AppUser SET gold = COALESCE(gold, 0) + ?, updatedAt = datetime(\'now\') WHERE id = ?',
      args: [amount, String(user.id)],
    });
    if ((upd.rowsAffected ?? 0) === 0) {
      return NextResponse.json({ error: 'فشل تحديث رصيد الذهب' }, { status: 404 });
    }

    const bal = await c.execute({
      sql: 'SELECT COALESCE(gold, 0) AS gold FROM AppUser WHERE id = ?',
      args: [String(user.id)],
    });
    const newBalance = Number((bal.rows[0] as Record<string, unknown>)?.gold ?? 0);

    return NextResponse.json({
      success: true,
      newBalance,
      message: `تم شحن ${amount.toLocaleString('en-US')} ذهبية — الرصيد الجديد: ${newBalance.toLocaleString('en-US')}`,
    });
  } catch (error) {
    console.error('Gold grant error:', error);
    return NextResponse.json({ error: 'فشل شحن الذهب' }, { status: 500 });
  }
}
