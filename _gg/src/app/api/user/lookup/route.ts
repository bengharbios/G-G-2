import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getClient, ensureAdminTables } from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gg-platform-secret-key-2024'
);

// الحقول الأساسية للمستخدم (للبحث السريع والقوائم)
const BASIC_FIELDS = 'id, username, displayName, avatar, numericId';

// كل الحقول (لعرض البروفايل الكامل لصديق)
const FULL_FIELDS = `${BASIC_FIELDS}, bio, country, cover, frame, ornament, card, gender, birthDate, level, role, createdAt`;

function mapBasicUser(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    username: String(row.username || ''),
    displayName: String(row.displayName || row.username || ''),
    avatar: String(row.avatar || '/yalla-avatars/defaultPhoto_1.png'),
    numericId: row.numericId as number | null,
  };
}

function mapFullUser(row: Record<string, unknown>) {
  return {
    ...mapBasicUser(row),
    bio: String(row.bio || ''),
    country: String(row.country || ''),
    cover: String(row.cover || ''),
    frame: String(row.frame || ''),
    ornament: String(row.ornament || ''),
    card: String(row.card || ''),
    gender: String(row.gender || ''),
    birthDate: String(row.birthDate || ''),
    level: Number(row.level ?? 1),
    role: String(row.role || 'user'),
    createdAt: String(row.createdAt || ''),
  };
}

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
    // full=1 → أرجع كل الحقول (لعرض بروفايل صديق)
    const wantFull = searchParams.get('full') === '1';
    if (!query.trim()) return NextResponse.json({ error: 'المر البحث مطلوب', success: false }, { status: 400 });

    await ensureAdminTables();
    const c = getClient();

    // 4 وضعيات بحث:
    //   -؟id=<UUID>  + full=1 → أرجع بروفايل كامل ل UUID
    //   -؟id=<UUID>            → أرجع بروفايل أساسي ل UUID
    //   -؟id=<numericId>  (رقمي) → أرجع مستخدم واحد بالـ numericId
    //   -؟q=<اسم>               → أرجع قائمة مطابقة بالاسم

    const trimmed = query.trim();
    const isNumeric = /^\d+$/.test(trimmed);
    // UUIDs في قاعدة البيانات تأتي كـ TEXT — قد تكون hex 32 أو قياسي
    // we treat non-numeric, non-empty strings as UUIDs/username candidates
    const isUuid = !isNumeric && trimmed.length >= 8;

    let result;
    let singleUser = false;

    if (isNumeric) {
      // بحث بـ numericId
      const sql = `SELECT ${wantFull ? FULL_FIELDS : BASIC_FIELDS} FROM AppUser WHERE numericId = ? AND isActive = 1 LIMIT 1`;
      result = await c.execute({ sql, args: [parseInt(trimmed)] });
      singleUser = true;
    } else if (isUuid && wantFull) {
      // بحث بـ UUID مع طلب البروفايل الكامل (لعرض بروفايل صديق)
      const sql = `SELECT ${FULL_FIELDS} FROM AppUser WHERE id = ? AND isActive = 1 LIMIT 1`;
      result = await c.execute({ sql, args: [trimmed] });
      singleUser = true;
    } else {
      // بحث بالاسم (username أو displayName) — يُرجع قائمة
      result = await c.execute({
        sql: `SELECT ${BASIC_FIELDS} FROM AppUser WHERE (username LIKE ? OR displayName LIKE ?) AND isActive = 1 LIMIT 5`,
        args: [`%${trimmed}%`, `%${trimmed}%`],
      });
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'لم يتم العثور على مستخدم' });
    }

    // خريطة النتائج
    const mapper = wantFull ? mapFullUser : mapBasicUser;
    const users = result.rows.map(r => mapper(r as Record<string, unknown>));

    // أرجع مستخدم واحد للبحث بـ ID، أو قائمة للبحث بالاسم
    if (singleUser && users.length === 1) {
      return NextResponse.json({ success: true, user: users[0] });
    }
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('[User Lookup] Error:', error);
    return NextResponse.json({ error: 'حدث خطأ', success: false }, { status: 500 });
  }
}
