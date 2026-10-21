import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminTables, getClient } from '@/lib/admin-db';

// GET — عناصر قسم معين من المتجر (مرئية فقط)
// ?categoryId=ludo_skin | themes | entry_effects | etc.
export async function GET(request: NextRequest) {
  try {
    await ensureAdminTables();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json({ success: false, error: 'categoryId مطلوب' }, { status: 400 });
    }

    const c = getClient();

    // Search both PlayerFrame (frames) and DecorItem (skins/themes/cards/ornaments)
    // Items must be: visible='shown' (or NULL for legacy items) AND isActive=1
    const items: Array<Record<string, unknown>> = [];

    // From DecorItem (skins, themes, cards, ornaments)
    const decorResult = await c.execute({
      sql: `SELECT id, kind, nameAr, imageUrl, rarity, price, isFree, sortOrder,
                   COALESCE(categoryId, '') as categoryId,
                   COALESCE(visible, 'shown') as visible,
                   COALESCE(source, 'ours') as source,
                   COALESCE(isNew, 0) as isNew,
                   COALESCE(discountPercent, 0) as discountPercent
            FROM DecorItem
            WHERE (categoryId = ? OR kind = ?)
              AND COALESCE(visible, 'shown') = 'shown'
              AND isActive = 1
            ORDER BY sortOrder ASC`,
      args: [categoryId, categoryId],
    });
    for (const r of decorResult.rows) {
      items.push(r as Record<string, unknown>);
    }

    // From PlayerFrame (if categoryId = 'frames')
    if (categoryId === 'frames') {
      const frameResult = await c.execute(
        `SELECT id, nameAr, imageUrl, rarity, price, isFree, sortOrder,
                COALESCE(categoryId, 'frames') as categoryId,
                COALESCE(visible, 'shown') as visible,
                COALESCE(source, 'ours') as source,
                COALESCE(isNew, 0) as isNew,
                COALESCE(discountPercent, 0) as discountPercent
         FROM PlayerFrame
         WHERE COALESCE(visible, 'shown') = 'shown'
           AND isActive = 1
         ORDER BY sortOrder ASC`
      );
      for (const r of frameResult.rows) {
        items.push(r as Record<string, unknown>);
      }
    }

    // Check user ownership (optional)
    let ownedIds: Set<string> = new Set();
    const token = request.cookies.get('auth_token')?.value;
    if (token) {
      try {
        const { jwtVerify } = await import('jose');
        const JWT_SECRET = new TextEncoder().encode(
          process.env.JWT_SECRET || 'gg-platform-secret-key-2024'
        );
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userId = payload.userId as string;
        if (userId) {
          const owned = await c.execute({
            sql: `SELECT itemId FROM UserDecor WHERE userId = ?
                  UNION SELECT frameId FROM UserFrame WHERE userId = ?`,
            args: [userId, userId],
          });
          ownedIds = new Set(owned.rows.map(r => String((r as Record<string, unknown>).itemId ?? (r as Record<string, unknown>).frameId)));
        }
      } catch { /* visitor */ }
    }

    const result = items.map((r) => ({
      id: String(r.id ?? ''),
      nameAr: String(r.nameAr ?? ''),
      imageUrl: String(r.imageUrl ?? ''),
      rarity: String(r.rarity ?? 'common'),
      price: Number(r.price ?? 0),
      isFree: Number(r.isFree ?? 0) === 1,
      sortOrder: Number(r.sortOrder ?? 0),
      isNew: Number(r.isNew ?? 0) === 1,
      discountPercent: Number(r.discountPercent ?? 0),
      source: String(r.source ?? 'ours'),
      kind: String(r.kind ?? ''),
      owned: ownedIds.has(String(r.id ?? '')),
    }));

    return NextResponse.json({ success: true, items: result, owned: Array.from(ownedIds) });
  } catch (error) {
    console.error('Store items error:', error);
    return NextResponse.json({ success: false, error: 'فشل تحميل عناصر المتجر' }, { status: 500 });
  }
}
