import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/admin-auth';
import { getClient, ensureAdminTables } from '@/lib/admin-db';
import { hashPassword } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const admin = await validateToken(request.cookies.get('admin_token')?.value || '');
    if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { userId, newPassword } = await request.json();
    if (!userId || !newPassword || newPassword.length < 4) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل' }, { status: 400 });
    }

    await ensureAdminTables();
    const c = getClient();
    const hashed = await hashPassword(newPassword);
    await c.execute({
      sql: 'UPDATE AppUser SET passwordHash = ? WHERE id = ?',
      args: [hashed, userId],
    });

    return NextResponse.json({ success: true, message: 'تم تغيير كلمة المرور' });
  } catch (error) {
    console.error('[Admin Reset Password]', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
