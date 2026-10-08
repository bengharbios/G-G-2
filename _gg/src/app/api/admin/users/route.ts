import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { getAllUsers, migrateAssignNumericIds } from '@/lib/admin-db';

export async function GET(request: NextRequest) {
  try {
    const { authorized } = await getAdminFromRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: 'غير مصرح', success: false }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';

    if (search.length >= 2) {
      // Server-side search — نفس قاعدة getClient (لا تنحرف عن بقية اللوحة)
      const { getClient, ensureAdminTables } = await import('@/lib/admin-db');
      await ensureAdminTables();
      const c = getClient();

      const likePattern = `%${search}%`;
      const result = await c.execute({
        sql: `SELECT id, username, email, displayName, phone, avatar, role, isActive, subscriptionId, lastLoginAt, numericId, createdAt, updatedAt
              FROM AppUser
              WHERE username LIKE ? OR displayName LIKE ? OR email LIKE ? OR id LIKE ? OR CAST(numericId AS TEXT) LIKE ?
              ORDER BY createdAt DESC
              LIMIT 20`,
        args: [likePattern, likePattern, likePattern, likePattern, likePattern],
      });

      // الرصيد الحي: جواهر الاشتراك + الذهب — يضمن ترابط بيانات لوحة الأدمن مع البروفايل لحظياً
      const balRes = await c.execute({
        sql: `SELECT u.id, COALESCE(s.gemsBalance, 0) AS gems, COALESCE(u.gold, 0) AS gold
              FROM AppUser u LEFT JOIN Subscription s ON s.id = u.subscriptionId`,
        args: [],
      });
      const balById = new Map(balRes.rows.map((b) => [String((b as Record<string, unknown>).id), {
        gems: Number((b as Record<string, unknown>).gems ?? 0),
        gold: Number((b as Record<string, unknown>).gold ?? 0),
      }]));

      const usersRaw = result.rows.map((r) => {
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
          numericId: row.numericId != null ? Number(row.numericId) : null,
          createdAt: (row.createdAt as string) ?? '',
          updatedAt: (row.updatedAt as string) ?? '',
        };
      });
      const users = usersRaw.map((u) => {
        const bal = balById.get(String(u.id));
        return { ...u, gemsBalance: bal?.gems ?? 0, gold: bal?.gold ?? 0 };
      });

      return NextResponse.json({
        success: true,
        users,
        total: users.length,
      });
    }

    const allUsers = await getAllUsers();
    // الرصيد الحي لكل المستخدمين (جواهر الاشتراك + الذهب) — ترابط كامل مع البروفايل
    const { getClient, ensureAdminTables } = await import('@/lib/admin-db');
    await ensureAdminTables();
    const bc = getClient();
    const balRes = await bc.execute(
      `SELECT u.id, COALESCE(s.gemsBalance, 0) AS gems, COALESCE(u.gold, 0) AS gold
            FROM AppUser u LEFT JOIN Subscription s ON s.id = u.subscriptionId`
    );
    const balById = new Map(balRes.rows.map((b) => [String(b.id), {
      gems: Number(b.gems ?? 0),
      gold: Number(b.gold ?? 0),
    }]));
    const users = allUsers.map((u) => {
      const bal = balById.get(String(u.id));
      return { ...u, gemsBalance: bal?.gems ?? 0, gold: bal?.gold ?? 0 };
    });

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
