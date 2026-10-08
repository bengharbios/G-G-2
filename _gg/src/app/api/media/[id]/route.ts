import { NextRequest, NextResponse } from 'next/server';
import { ensureAdminTables, getClient } from '@/lib/admin-db';

export const runtime = 'nodejs';

// عرض صورة مرفوعة من قاعدة البيانات — مسارها المستقر /api/media/<id>
// الكاش دائم لأن المعرف فريد لكل نسخة صورة
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ensureAdminTables();
    const c = getClient();
    const res = await c.execute({
      sql: 'SELECT mime, data FROM MediaAsset WHERE id = ? LIMIT 1',
      args: [id],
    });
    const row = res.rows[0] as Record<string, unknown> | undefined;
    if (!row || !row.data) {
      return NextResponse.json({ error: 'الصورة غير موجودة' }, { status: 404 });
    }
    const mime = String(row.mime ?? 'image/png');
    const bytes = row.data instanceof Uint8Array ? row.data : new Uint8Array(row.data as ArrayBuffer);
    return new Response(bytes as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(bytes.byteLength),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Media serve error:', error);
    return NextResponse.json({ error: 'فشل عرض الصورة' }, { status: 500 });
  }
}
