import { NextRequest, NextResponse } from 'next/server';
import { createChargeRequest, validateSubscriptionCode } from '@/lib/admin-db';

// ════════════════════════════════════════════════════════════════════════════
// حزم الشحن — مطابقة لـ /api/gems/packages
// كل حزمة تحوي: الكمية + المكافأة + السعر + نقاط رويال + XP
// ════════════════════════════════════════════════════════════════════════════

interface PackageInfo {
  amount: number;
  bonus: number;
  price: number;
  type: 'diamond' | 'gold' | 'vip';
  royalPoints: number;
  xpReward: number;
}

const allPackages: Record<string, PackageInfo> = {
  // Diamonds
  dia_1: { amount: 400, bonus: 0, price: 0.99, type: 'diamond', royalPoints: 10, xpReward: 40 },
  dia_2: { amount: 1800, bonus: 0, price: 3.99, type: 'diamond', royalPoints: 40, xpReward: 180 },
  dia_3: { amount: 5000, bonus: 0, price: 9.99, type: 'diamond', royalPoints: 100, xpReward: 500 },
  dia_4: { amount: 16000, bonus: 0, price: 29.99, type: 'diamond', royalPoints: 300, xpReward: 1600 },
  dia_5: { amount: 53700, bonus: 0, price: 99.99, type: 'diamond', royalPoints: 1000, xpReward: 5370 },
  dia_6: { amount: 161700, bonus: 0, price: 299.99, type: 'diamond', royalPoints: 3000, xpReward: 16170 },
  // Gold
  gold_1: { amount: 35000, bonus: 0, price: 0.99, type: 'gold', royalPoints: 10, xpReward: 35 },
  gold_2: { amount: 130000, bonus: 0, price: 2.99, type: 'gold', royalPoints: 30, xpReward: 130 },
  gold_3: { amount: 620000, bonus: 0, price: 9.99, type: 'gold', royalPoints: 100, xpReward: 620 },
  gold_4: { amount: 2700000, bonus: 0, price: 19.99, type: 'gold', royalPoints: 200, xpReward: 2700 },
  gold_5: { amount: 7700000, bonus: 0, price: 39.99, type: 'gold', royalPoints: 400, xpReward: 7700 },
  gold_6: { amount: 17000000, bonus: 0, price: 69.99, type: 'gold', royalPoints: 700, xpReward: 17000 },
  // VIP
  vip_faris: { amount: 1, bonus: 0, price: 9.99, type: 'vip', royalPoints: 100, xpReward: 500 },
  vip_liwa: { amount: 1, bonus: 0, price: 29.99, type: 'vip', royalPoints: 300, xpReward: 1500 },
  vip_royal: { amount: 1, bonus: 0, price: 99.99, type: 'vip', royalPoints: 1000, xpReward: 5000 },
  // Legacy packages (backward compat)
  small: { amount: 100, bonus: 0, price: 0.99, type: 'diamond', royalPoints: 10, xpReward: 40 },
  medium: { amount: 500, bonus: 50, price: 3.99, type: 'diamond', royalPoints: 40, xpReward: 180 },
  large: { amount: 2000, bonus: 300, price: 9.99, type: 'diamond', royalPoints: 100, xpReward: 500 },
  mega: { amount: 5000, bonus: 1000, price: 19.99, type: 'diamond', royalPoints: 300, xpReward: 1600 },
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

    // Validate package
    const pkg = allPackages[gemsPackage as string];
    if (!pkg) {
      return NextResponse.json(
        { error: 'الحزمة غير صالحة', success: false },
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

    // Check payment method
    const validMethods = ['telegram', 'whatsapp', 'bank_transfer', 'other'];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'طريقة الدفع غير صالحة', success: false },
        { status: 400 }
      );
    }

    const totalAmount = pkg.amount + pkg.bonus;

    // Create pending charge request
    const chargeRequest = await createChargeRequest({
      subscriptionCode: code.trim(),
      subscriberName: subscriber.name,
      gemsAmount: totalAmount,
      packageType: gemsPackage as string,
      paymentMethod,
    });

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء طلب الشحن بنجاح! تواصل مع الإدارة لإرسال إيصال الدفع لتأكيد الشحن.',
      chargeRequest: {
        id: chargeRequest.id,
        amount: totalAmount,
        type: pkg.type,
        packageType: chargeRequest.packageType,
        status: chargeRequest.status,
        price: pkg.price,
      },
      rewards: {
        royalPoints: pkg.royalPoints,
        xp: pkg.xpReward,
        note: `عند تأكيد الدفع: +${pkg.royalPoints} نقاط رويال +${pkg.xpReward} XP`,
      },
      contactInfo: {
        telegram: 'تواصل عبر تيليجرام لإرسال إيصال الدفع',
        whatsapp: 'تواصل عبر واتساب لإرسال إيصال الدفع',
        bank_transfer: 'أرسل إيصال التحويل البنكي للإدارة',
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
