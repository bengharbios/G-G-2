import { NextResponse } from 'next/server';
import { ensureAdminTables, getClient } from '@/lib/admin-db';

// GET — قائمة أقسام المتجر المرئية فقط (للعرض العام)
export async function GET() {
  try {
    await ensureAdminTables();
    const c = getClient();
    const result = await c.execute(
      `SELECT id, nameAr, icon, layoutType, sortOrder, visible, redDotCondition
       FROM StoreCategory
       WHERE visible = 1
       ORDER BY sortOrder ASC`
    );
    const categories = result.rows.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: String(row.id),
        nameAr: String(row.nameAr ?? ''),
        icon: String(row.icon ?? ''),
        layoutType: String(row.layoutType ?? 'grid'),
        sortOrder: Number(row.sortOrder ?? 0),
        redDotCondition: String(row.redDotCondition ?? ''),
      };
    });
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error('Store categories error:', error);
    return NextResponse.json({ success: false, error: 'فشل تحميل أقسام المتجر' }, { status: 500 });
  }
}
