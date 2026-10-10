import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/admin-auth';
import { ensureAdminTables, getClient } from '@/lib/admin-db';

export const runtime = 'nodejs';

const ALLOWED_MIME: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'video/mp4': '.mp4',
};
const MAX_SIZE = 10 * 1024 * 1024; // 10MB للصور الثابتة والصور المتحركة (GIF/SVG/APNG)
const MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25MB للـ MP4

async function verifyAdminAuth(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return null;
  try {
    return await validateToken(token);
  } catch {
    return null;
  }
}

// رفع صورة/فيديو من لوحة الأدمن — تُخزَّن بايتاتها في قاعدة البيانات (توافق Vercel للقراءة فقط)
// وتُخدَم لاحقاً عبر /api/media/<id> — يعمل للإطارات والمواضيع والمعلقات والبطاقات والفيديوهات
// ملاحظة: MP4 تُخزَّن كـ BLOB في MediaAsset وتُعرض عبر نفس المسار — تعمل إذا كان الفيديو خفيف (≤25MB)
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const form = await request.formData();
    const file = form.get('file') as File | null;
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'الملف مطلوب' }, { status: 400 });
    }
    const ext = ALLOWED_MIME[file.type];
    if (!ext) {
      return NextResponse.json({ error: 'صيغة غير مدعومة (PNG/JPG/WEBP/GIF/SVG/MP4)' }, { status: 400 });
    }
    const limit = file.type === 'video/mp4' ? MAX_VIDEO_SIZE : MAX_SIZE;
    if (file.size > limit) {
      return NextResponse.json({ error: 'حجم الملف يتجاوز الحد المسموح' }, { status: 400 });
    }
    await ensureAdminTables();
    const c = getClient();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const id = crypto.randomUUID();
    await c.execute({
      sql: 'INSERT INTO MediaAsset (id, filename, mime, size, data) VALUES (?, ?, ?, ?, ?)',
      args: [id, `upload_${Date.now()}${ext}`, file.type, bytes.byteLength, bytes],
    });
    return NextResponse.json({ success: true, url: `/api/media/${id}` });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'فشل رفع الملف' }, { status: 500 });
  }
}
