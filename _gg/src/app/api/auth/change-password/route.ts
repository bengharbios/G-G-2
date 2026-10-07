import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getUserById, updateUser } from '@/lib/admin-db';
import { verifyPassword, hashPassword } from '@/lib/admin-auth';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gg-platform-secret-key-2024'
);

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'غير مصرح', success: false },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    if (!userId) {
      return NextResponse.json(
        { error: 'رمز غير صالح', success: false },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'كلمة المرور الحالية والجديدة مطلوبتان', success: false },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل', success: false },
        { status: 400 }
      );
    }

    // Get user with password hash for verification
    const { getClient } = await import('@/lib/admin-db');
    const { ensureAdminTables } = await import('@/lib/admin-db');
    await ensureAdminTables();
    const c = getClient();

    const result = await c.execute({
      sql: 'SELECT passwordHash FROM AppUser WHERE id = ? AND isActive = 1',
      args: [userId],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود', success: false },
        { status: 404 }
      );
    }

    const currentHash = result.rows[0].passwordHash as string;

    if (!verifyPassword(currentPassword, currentHash)) {
      return NextResponse.json(
        { error: 'كلمة المرور الحالية غير صحيحة', success: false },
        { status: 401 }
      );
    }

    // Update password
    const newHash = hashPassword(newPassword);
    await c.execute({
      sql: "UPDATE AppUser SET passwordHash = ?, updatedAt = datetime('now') WHERE id = ?",
      args: [newHash, userId],
    });

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح',
    });
  } catch (error) {
    console.error('[Auth Change Password] Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', success: false },
      { status: 500 }
    );
  }
}
