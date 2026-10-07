import { NextRequest, NextResponse } from 'next/server';
import { createChargeRequest, validateSubscriptionCode } from '@/lib/admin-db';

// ─── Valid packages and their gem amounts ──────────────────────────────

const validPackages: Record<string, { gems: number; bonus: number; price: number }> = {
  small: { gems: 100, bonus: 0, price: 0.99 },
  medium: { gems: 500, bonus: 50, price: 3.99 },
  large: { gems: 2000, bonus: 300, price: 9.99 },
  mega: { gems: 5000, bonus: 1000, price: 19.99 },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, gemsPackage, paymentMethod } = body;

    if (!code || !gemsPackage || !paymentMethod) {
      return NextResponse.json(
        { error: 'يرجى ملء جميع البيانات المطلوبة', success: false },
        { status: 400 }
      );
    }

    // Validate package type
    const pkg = validPackages[gemsPackage as string];
    if (!pkg) {
      return NextResponse.json(
        { error: 'حزمة الجواهر غير صالحة', success: false },
        { status: 400 }
      );
    }

    // Validate subscription
    const subscriber = await validateSubscriptionCode(code.trim());
    if (!subscriber) {
      return NextResponse.json(
        { error: 'كود الاشتراك غير صالح', success: false },
        { status: 400 }
      );
    }

    // Check if payment method is valid
    const validMethods = ['telegram', 'whatsapp', 'bank_transfer', 'other'];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'طريقة الدفع غير صالحة', success: false },
        { status: 400 }
      );
    }

    const totalGems = pkg.gems + pkg.bonus;

    // Create pending charge request
    const chargeRequest = await createChargeRequest({
      subscriptionCode: code.trim(),
      subscriberName: subscriber.name,
      gemsAmount: totalGems,
      packageType: gemsPackage as 'small' | 'medium' | 'large' | 'mega',
      paymentMethod,
    });

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء طلب الشحن بنجاح! سيتم مراجعة طلبك وإضافة الجواهر بعد تأكيد الدفع.',
      chargeRequest: {
        id: chargeRequest.id,
        gemsAmount: totalGems,
        packageType: chargeRequest.packageType,
        status: chargeRequest.status,
        price: pkg.price,
      },
      contactInfo: {
        telegram: 'تواصل معنا عبر تيليجرام لإرسال إيصال الدفع',
        whatsapp: 'تواصل معنا عبر واتساب لإرسال إيصال الدفع',
        bank_transfer: 'تواصل معنا لإرسال إيصال التحويل البنكي',
        other: 'تواصل مع الإدارة لإرسال إيصال الدفع',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', success: false },
      { status: 500 }
    );
  }
}
