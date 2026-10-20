import { NextResponse } from 'next/server';
import { getCacheVersion } from '@/lib/admin-db';

// GET /api/cache-version
// يستخدمه الـAPK / WebView للتحقق من رقم إصدار الـcache
// لو الإصدار تغيّر، يقوم التطبيق بمسح cache الـWebView
export async function GET() {
  try {
    const cv = await getCacheVersion();
    return NextResponse.json({
      success: true,
      version: cv.version,
      reason: cv.reason,
      updatedAt: cv.updatedAt,
    }, {
      headers: {
        // تجاوز cache لكل البروكسيات — نريد دائماً الإصدار الأحدث
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      version: 1,
      reason: '',
      updatedAt: '',
      error: String(error),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  }
}
