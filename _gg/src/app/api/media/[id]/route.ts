import { NextRequest, NextResponse } from 'next/server';
import { getClient, ensureAdminTables } from '@/lib/admin-db';

// GET /api/media/[id] — serve a stored MediaAsset by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureAdminTables();
    const { id } = await params;
    const c = getClient();
    const r = await c.execute({
      sql: 'SELECT mime, data FROM MediaAsset WHERE id = ?',
      args: [id],
    });
    if (!r.rows.length) return new NextResponse('Not Found', { status: 404 });
    const row = r.rows[0] as Record<string, unknown>;
    const mime = String(row.mime ?? 'application/octet-stream');
    const data = row.data as Uint8Array | Buffer | null;
    if (!data) return new NextResponse('Empty', { status: 500 });
    const buf = data instanceof Uint8Array ? Buffer.from(data) : (data as Buffer);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (error) {
    console.error('Media GET error:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
