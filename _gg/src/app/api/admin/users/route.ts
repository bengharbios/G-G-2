import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { getAllUsers, migrateAssignNumericIds } from '@/lib/admin-db';
import { createClient } from '@libsql/client';

export async function GET(request: NextRequest) {
  try {
    const { authorized } = await getAdminFromRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: 'غير مصرح', success: false }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';

    if (search.length >= 2) {
      // Server-side search by username, displayName, email, or partial ID
      const dbUrl =
        process.env.TURSO_DATABASE_URL ||
        process.env.DATABASE_URL ||
        'file:db/data.db';
      const isRemote = dbUrl.startsWith('libsql://');
      const c = createClient({
        url: dbUrl,
        ...(isRemote ? { authToken: process.env.TURSO_AUTH_TOKEN || '' } : {}),
      });

      const likePattern = `%${search}%`;
      const result = await c.execute({
        sql: `SELECT id, username, email, displayName, phone, avatar, role, isActive, subscriptionId, lastLoginAt, createdAt, updatedAt
              FROM AppUser
              WHERE username LIKE ? OR displayName LIKE ? OR email LIKE ? OR id LIKE ?
              ORDER BY createdAt DESC
              LIMIT 10`,
        args: [likePattern, likePattern, likePattern, likePattern],
      });

      const users = result.rows.map((r) => {
        const row = r as Record<string, unknown>;
        return {
          id: row.id as string,
          username: (row.username as string) ?? '',
          email: (row.email as string) ?? '',
          displayName: (row.displayName as string) ?? '',
          phone: (row.phone as string) ?? '',
          avatar: (row.avatar as string) ?? '',
          role: (row.role as string) ?? 'user',
          isActive: !!(row.isActive && row.isActive !== 0),
          subscriptionId: (row.subscriptionId as string) ?? null,
          lastLoginAt: (row.lastLoginAt as string) ?? null,
          createdAt: (row.createdAt as string) ?? '',
          updatedAt: (row.updatedAt as string) ?? '',
        };
      });

      return NextResponse.json({
        success: true,
        users,
        total: users.length,
      });
    }

    const users = await getAllUsers();

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
    });
  } catch (error) {
    console.error('[Admin Users GET] Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', success: false },
      { status: 500 }
    );
  }
}

/** POST /api/admin/users - Trigger numeric ID migration for all users missing one */
export async function POST(request: NextRequest) {
  try {
    const { authorized } = await getAdminFromRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: 'غير مصرح', success: false }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const action = (body.action as string) || '';

    if (action === 'migrate-ids') {
      const result = await migrateAssignNumericIds();
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ error: 'إجراء غير معروف', success: false }, { status: 400 });
  } catch (error) {
    console.error('[Admin Users POST] Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', success: false },
      { status: 500 }
    );
  }
}
