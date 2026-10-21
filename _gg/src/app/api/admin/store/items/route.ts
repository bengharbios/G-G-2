import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/admin-auth';
import { ensureAdminTables, getClient } from '@/lib/admin-db';

async function verifyAdminAuth(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return null;
  try { return await validateToken(token); } catch { return null; }
}

// GET /api/admin/store/items?categoryId=X&includeHidden=1
// Returns ALL items in a category (incl. hidden + inactive) for admin panel.
// Optionally pass ?includeHidden=0 to mirror the public /api/store/items behavior.
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    await ensureAdminTables();
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const includeHidden = searchParams.get('includeHidden') !== '0'; // default: include

    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId مطلوب' }, { status: 400 });
    }

    const c = getClient();
    const items: Array<Record<string, unknown>> = [];

    // PlayerFrame (frames only)
    if (categoryId === 'frames') {
      const visibleClause = includeHidden ? '1=1' : "COALESCE(visible,'shown')='shown'";
      const activeClause = includeHidden ? '1=1' : 'isActive=1';
      const r = await c.execute(
        `SELECT id, nameAr, imageUrl, rarity, price, isFree, sortOrder, isActive,
                COALESCE(categoryId,'frames') as categoryId,
                COALESCE(visible,'shown') as visible,
                COALESCE(source,'ours') as source,
                COALESCE(animatedUrl,'') as animatedUrl,
                COALESCE(isNew,0) as isNew,
                COALESCE(discountPercent,0) as discountPercent,
                totalOwned
         FROM PlayerFrame
         WHERE ${visibleClause} AND ${activeClause}
         ORDER BY sortOrder ASC`
      );
      for (const row of r.rows) items.push(row as Record<string, unknown>);
    }

    // DecorItem (skins/themes/cards/ornaments)
    const visibleClause = includeHidden ? '1=1' : "COALESCE(visible,'shown')='shown'";
    const activeClause = includeHidden ? '1=1' : 'isActive=1';
    const r2 = await c.execute({
      sql: `SELECT id, kind, nameAr, imageUrl, rarity, price, isFree, sortOrder, isActive,
                   COALESCE(categoryId,'') as categoryId,
                   COALESCE(visible,'shown') as visible,
                   COALESCE(source,'ours') as source,
                   COALESCE(animatedUrl,'') as animatedUrl,
                   COALESCE(isNew,0) as isNew,
                   COALESCE(discountPercent,0) as discountPercent,
                   totalOwned
            FROM DecorItem
            WHERE categoryId = ?
              AND ${visibleClause}
              AND ${activeClause}
            ORDER BY sortOrder ASC`,
      args: [categoryId],
    });
    for (const row of r2.rows) items.push(row as Record<string, unknown>);

    const result = items.map((r) => ({
      id: String(r.id ?? ''),
      kind: String(r.kind ?? ''),
      nameAr: String(r.nameAr ?? ''),
      imageUrl: String(r.imageUrl ?? ''),
      animatedUrl: String(r.animatedUrl ?? ''),
      rarity: String(r.rarity ?? 'common'),
      price: Number(r.price ?? 0),
      isFree: Number(r.isFree ?? 0) === 1,
      isActive: Number(r.isActive ?? 1) === 1,
      sortOrder: Number(r.sortOrder ?? 0),
      categoryId: String(r.categoryId ?? ''),
      visible: String(r.visible ?? 'shown'),
      source: String(r.source ?? 'ours'),
      isNew: Number(r.isNew ?? 0) === 1,
      discountPercent: Number(r.discountPercent ?? 0),
      totalOwned: Number(r.totalOwned ?? 0),
      kindLabel: String(r.kind ?? '') === 'ornament' ? 'معلقة جدارية'
                : String(r.kind ?? '') === 'theme' ? 'موضوع'
                : String(r.kind ?? '') === 'card' ? 'بطاقة'
                : String(r.kind ?? '') === 'skin' ? 'غلاف'
                : 'إطار',
    }));

    return NextResponse.json({ success: true, items: result });
  } catch (error) {
    console.error('Admin store items GET error:', error);
    return NextResponse.json({ error: 'فشل تحميل العناصر' }, { status: 500 });
  }
}
