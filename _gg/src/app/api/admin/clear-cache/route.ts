import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/admin-auth';
import { bumpCacheVersion, getCacheVersion } from '@/lib/admin-db';

// POST /api/admin/clear-cache
// يقوم بزيادة رقم إصدار الـcache ← يجبر كل الـAPKs بمسح cache الـWebView
// عند فتح المستخدم القادم للتطبيق

export async function POST(request: NextRequest) {
  try {
    // التحقق من صلاحيات الـadmin
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const user = await validateToken(token);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // قراءة السبب من الجسم (اختياري)
    let reason = 'تحديث من لوحة التحكم';
    try {
      const body = await request.json();
      if (body?.reason) reason = String(body.reason).slice(0, 200);
    } catch { /* ignore — body is optional */ }

    // زيادة رقم الإصدار
    const result = await bumpCacheVersion(reason, user.username || 'admin');

    return NextResponse.json({
      success: true,
      message: 'تم تحديث إصدار الـcache. كل المستخدمين سيحصلون على النسخة الجديدة عند فتح التطبيق.',
      version: result.version,
      updatedAt: result.updatedAt,
      note: 'قد يستغرق ظهور التغيير من 5-30 ثانية على الأجهزة المفتوحة.',
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch (error) {
    console.error('[POST /api/admin/clear-cache]', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الإصدار', detail: String(error) },
      { status: 500 }
    );
  }
}

// GET للتحقق من الإصدار الحالي
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const user = await validateToken(token);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const cv = await getCacheVersion();
    return NextResponse.json({
      success: true,
      ...cv,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
