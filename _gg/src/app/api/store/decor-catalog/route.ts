import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { seedDefaultDecor, getDecorItems, ensureAdminTables, getClient, type DecorKind } from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gg-platform-secret-key-2024'
);

const VALID_KINDS: DecorKind[] = ['ornament', 'theme', 'card'];

// كتالوج الزينة (معلقات/مواضيع/بطاقات) — عام للعرض، ومعه ملكية المستخدم إن كان مسجلاً
export async function GET(request: NextRequest) {
  try {
    await seedDefaultDecor();
    const { searchParams } = new URL(request.url);
    const kindParam = searchParams.get('kind');
    const kind = kindParam && VALID_KINDS.includes(kindParam as DecorKind) ? (kindParam as DecorKind) : undefined;
    const items = await getDecorItems(kind);

    // ملكية المستخدم (اختيارية — الزوار يرون الكتالوج بلا أقفال شخصية)
    let ownedDecor: string[] = [];
    const token = request.cookies.get('auth_token')?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userId = payload.userId as string;
        if (userId) {
          await ensureAdminTables();
          const c = getClient();
          const res = await c.execute({
            sql: 'SELECT itemId FROM UserDecor WHERE userId = ?',
            args: [userId],
          });
          ownedDecor = res.rows.map((r) => String((r as Record<string, unknown>).itemId));
        }
      } catch {
        /* زائر — لا ملكية */
      }
    }

    return NextResponse.json({ success: true, items, ownedDecor });
  } catch (error) {
    console.error('Decor catalog error:', error);
    return NextResponse.json({ success: false, error: 'فشل تحميل كتالوج الزينة' }, { status: 500 });
  }
}
