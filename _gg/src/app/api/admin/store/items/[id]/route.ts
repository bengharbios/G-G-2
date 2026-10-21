import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/admin-auth';
import { ensureAdminTables, getClient, updateFrame, updateDecorItem } from '@/lib/admin-db';

async function verifyAdminAuth(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return null;
  try { return await validateToken(token); } catch { return null; }
}

// PATCH /api/admin/store/items/[id]
// Body: { table: 'PlayerFrame'|'DecorItem', price?, rarity?, visible?, source?, isNew?, discountPercent?,
//        isActive?, nameAr?, imageUrl?, animatedUrl?, categoryId?, sortOrder? }
// Updates a single store item (frame or decor).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    await ensureAdminTables();
    const { id } = await params;
    const body = await request.json();
    const { table, ...fields } = body;
    if (!table || !['PlayerFrame', 'DecorItem'].includes(table)) {
      return NextResponse.json({ error: 'table must be PlayerFrame or DecorItem' }, { status: 400 });
    }
    if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

    // Sanitize allowed fields only (whitelist)
    const allowed = ['nameAr', 'imageUrl', 'animatedUrl', 'rarity', 'price', 'isFree', 'isActive',
                    'sortOrder', 'categoryId', 'visible', 'source', 'isNew', 'discountPercent',
                    'scheduleStart', 'scheduleEnd'];
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (allowed.includes(k)) patch[k] = v;
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'لا حقول صالحة للتحديث' }, { status: 400 });
    }

    let updated: { id: string } | null = null;
    if (table === 'PlayerFrame') {
      updated = await updateFrame(id, patch) as { id: string } | null;
    } else {
      updated = await updateDecorItem(id, patch) as { id: string } | null;
    }
    if (!updated) return NextResponse.json({ error: 'العنصر غير موجود' }, { status: 404 });
    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error('Admin store items PATCH error:', error);
    return NextResponse.json({ error: 'فشل التحديث' }, { status: 500 });
  }
}

// DELETE /api/admin/store/items/[id]?table=DecorItem|PlayerFrame
// Hard-deletes a store item (useful for cleanup of orphan imported items).
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    await ensureAdminTables();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table') || 'DecorItem';
    if (!['PlayerFrame', 'DecorItem'].includes(table)) {
      return NextResponse.json({ error: 'table must be PlayerFrame or DecorItem' }, { status: 400 });
    }
    const c = getClient();
    if (table === 'PlayerFrame') {
      await c.execute({ sql: 'DELETE FROM UserFrame WHERE frameId = ?', args: [id] });
      await c.execute({ sql: 'DELETE FROM PlayerFrame WHERE id = ?', args: [id] });
    } else {
      await c.execute({ sql: 'DELETE FROM UserDecor WHERE itemId = ?', args: [id] });
      await c.execute({ sql: 'DELETE FROM DecorItem WHERE id = ?', args: [id] });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin store items DELETE error:', error);
    return NextResponse.json({ error: 'فشل الحذف' }, { status: 500 });
  }
}
