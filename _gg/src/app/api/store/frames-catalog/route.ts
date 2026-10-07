import { NextResponse } from 'next/server';
import { seedDefaultFrames, ensureAdminTables, getClient } from '@/lib/admin-db';

export async function HEAD() {
  try {
    await seedDefaultFrames();
  } catch (error) {
    console.error('Store frames seed error:', error);
  }
  return new Response(null, { status: 204 });
}

// كتالوج الإطارات النشط (عام — للعرض والأسعار فقط، بدون بيانات ملكية)
export async function GET() {
  try {
    await seedDefaultFrames();
    await ensureAdminTables();
    const c = getClient();
    const result = await c.execute(
      'SELECT id, name, nameAr, imageUrl, rarity, price, isFree, sortOrder FROM PlayerFrame WHERE isActive = 1 ORDER BY sortOrder ASC'
    );
    const frames = result.rows.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: String(row.id),
        name: String(row.name ?? ''),
        nameAr: String(row.nameAr ?? row.name ?? ''),
        imageUrl: String(row.imageUrl ?? ''),
        rarity: String(row.rarity ?? 'common'),
        price: Number(row.price ?? 0),
        isFree: Number(row.isFree ?? 0) === 1,
        sortOrder: Number(row.sortOrder ?? 0),
      };
    });
    return NextResponse.json({ success: true, frames });
  } catch (error) {
    console.error('Frames catalog error:', error);
    return NextResponse.json({ success: false, error: 'فشل تحميل الكتالوج' }, { status: 500 });
  }
}
