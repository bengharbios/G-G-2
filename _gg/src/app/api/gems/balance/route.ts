import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getUserGemsBalance } from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gg-platform-secret-key-2024'
);

// رصيد جواهر المستخدم الحالي (مربوط باشتراكه في قاعدة البيانات)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'يجب تسجيل الدخول' }, { status: 401 });
    }
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'رمز غير صالح' }, { status: 401 });
    }
    const balance = await getUserGemsBalance(userId);
    return NextResponse.json({ success: true, balance });
  } catch (error) {
    console.error('Gems balance error:', error);
    return NextResponse.json({ success: false, error: 'فشل جلب الرصيد' }, { status: 500 });
  }
}
