import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'تم تسجيل الخروج بنجاح',
  });

  // حذف الكوكي بكل الطرق الممكنة (مهم لـ WebView في APK)
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  });
  // حذف إضافي للتأكد
  response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage"');

  return response;
}
