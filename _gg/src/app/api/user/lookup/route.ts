import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getClient, ensureAdminTables } from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gg-platform-secret-key-2024'
);

export async function GET(request: NextRequest) {
  try {
    // Verify auth
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'غير مصرح', success: false }, { status: 401 });
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    if (!userId) return NextResponse.json({ error: 'رمز غير صالح', success: false }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('id') || searchParams.get('q') || '';
    if (!query.trim()) return NextResponse.json({ error: 'المر البحث مطلوب', success: false }, { status: 400 });

    await ensureAdminTables();
    const c = getClient();

    // Search by numericId or displayName or username
    const isNumeric = /^\d+$/.test(query.trim());
    let result;
    if (isNumeric) {
      result = await c.execute({
        sql: 'SELECT id, username, displayName, avatar, numericId FROM AppUser WHERE numericId = ? AND isActive = 1 LIMIT 1',
        args: [parseInt(query.trim())],
      });
    } else {
      result = await c.execute({
        sql: 'SELECT id, username, displayName, avatar, numericId FROM AppUser WHERE (username LIKE ? OR displayName LIKE ?) AND isActive = 1 LIMIT 5',
        args: [`%${query.trim()}%`, `%${query.trim()}%`],
      });
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'لم يتم العثور على مستخدم' });
    }

    const users = result.rows.map(r => {
      const row = r as Record<string, unknown>;
      return {
        id: String(row.id),
        username: String(row.username || ''),
        displayName: String(row.displayName || row.username || ''),
        avatar: String(row.avatar || '/yalla-avatars/defaultPhoto_1.png'),
        numericId: row.numericId,
      };
    });

    // Return single user (for ID lookup) or array (for name search)
    if (isNumeric && users.length === 1) {
      return NextResponse.json({ success: true, user: users[0] });
    }
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('[User Lookup] Error:', error);
    return NextResponse.json({ error: 'حدث خطأ', success: false }, { status: 500 });
  }
}
