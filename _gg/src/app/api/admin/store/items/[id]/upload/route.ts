import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/admin-auth';
import { ensureAdminTables, getClient } from '@/lib/admin-db';

async function verifyAdminAuth(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return null;
  try { return await validateToken(token); } catch { return null; }
}

// POST /api/admin/store/items/[id]/upload?table=PlayerFrame|DecorItem
// Body: multipart/form-data with field `file` (PNG/WebP/SVGA, ≤2MB)
// Saves the binary as a MediaAsset row + returns a public URL `/api/media/[id]`
// Then updates the item's `imageUrl` (or `animatedUrl` for SVGA).
export async function POST(
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'ملف مفقود' }, { status: 400 });

    // Validate size & type
    const MAX_BYTES = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'حجم الملف يتجاوز 2 ميجابايت' }, { status: 413 });
    }
    const allowedTypes = ['image/png', 'image/webp', 'image/svg+xml', 'application/octet-stream'];
    const isSvga = file.name.toLowerCase().endsWith('.svga');
    if (!allowedTypes.includes(file.type) && !isSvga) {
      return NextResponse.json({ error: 'النوع غير مدعوم (PNG / WebP / SVGA فقط)' }, { status: 415 });
    }

    const buf = Buffer.from(await file.arrayBuffer());

    // Insert MediaAsset
    const c = getClient();
    const mediaId = `${id}_${Date.now()}`;
    const mime = isSvga ? 'application/octet-stream' : (file.type || 'image/png');
    await c.execute({
      sql: `INSERT OR REPLACE INTO MediaAsset (id, filename, mime, size, data) VALUES (?, ?, ?, ?, ?)`,
      args: [mediaId, file.name, mime, file.size, buf],
    });

    // Build URL — `/api/media/[id]` will serve the bytes back
    const publicUrl = `/api/media/${mediaId}`;
    const column = isSvga ? 'animatedUrl' : 'imageUrl';

    if (table === 'PlayerFrame') {
      await c.execute({
        sql: `UPDATE PlayerFrame SET ${column} = ?, updatedAt = datetime('now') WHERE id = ?`,
        args: [publicUrl, id],
      });
    } else {
      await c.execute({
        sql: `UPDATE DecorItem SET ${column} = ?, updatedAt = datetime('now') WHERE id = ?`,
        args: [publicUrl, id],
      });
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      column,
      mediaId,
    });
  } catch (error) {
    console.error('Admin store items upload POST error:', error);
    return NextResponse.json({ error: 'فشل رفع الصورة' }, { status: 500 });
  }
}
