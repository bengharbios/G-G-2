import { NextRequest, NextResponse } from 'next/server';
import { registerSubscriber, getSiteConfig } from '@/lib/admin-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'الاسم والبريد الإلكتروني مطلوبان' },
        { status: 400 }
      );
    }

    // Check if direct registration is allowed
    const siteConfig = await getSiteConfig();
    if (!siteConfig.allowDirectRegistration) {
      return NextResponse.json(
        { error: 'التسجيل المباشر غير متاح حالياً. تواصل معنا عبر واتساب أو تيليجرام.' },
        { status: 403 }
      );
    }

    const subscriber = await registerSubscriber({
      name,
      email,
      phone: phone || '',
    });

    return NextResponse.json({
      success: true,
      code: subscriber.subscriptionCode,
    }, { status: 201 });
  } catch (error) {
    // Handle unique constraint violation on email or code
    const errorMsg = String(error);
    if (errorMsg.includes('UNIQUE') || errorMsg.includes('unique')) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مسجل بالفعل' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
