import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { ensureAdminTables, getClient } from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gg-platform-secret-key-2024'
);

export const runtime = 'nodejs';

// رصيد الذهب للمستخدم المسجل — من AppUser.gold (مستقل عن جواهر الاشتراك)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح', success: false }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    if (!userId) {
      return NextResponse.json({ error: 'رمز غير صالح', success: false }, { status: 401 });
    }

    await ensureAdminTables();
    const c = getClient();
    const r = await c.execute({
      sql: 'SELECT COALESCE(gold, 0) AS gold FROM AppUser WHERE id = ? AND isActive = 1',
      args: [userId],
    });
    const row = r.rows[0] as Record<string, unknown> | undefined;
    if (!row) {
      return NextResponse.json({ error: 'المستخدم غير موجود', success: false }, { status: 404 });
    }

    return NextResponse.json({ success: true, balance: Number(row.gold ?? 0) });
  } catch (error) {
    console.error('[Gold Balance] Error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم', success: false }, { status: 500 });
  }
}
