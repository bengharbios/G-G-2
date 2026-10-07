import { NextRequest, NextResponse } from 'next/server';
import { deductGems } from '@/lib/admin-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, itemKey, price } = body;

    if (!code || !itemKey || !price || price <= 0) {
      return NextResponse.json(
        { error: 'بيانات غير صالحة', success: false },
        { status: 400 }
      );
    }

    const result = await deductGems(code.trim(), Number(price));

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, success: false, newBalance: result.newBalance },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      itemKey,
    });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', success: false },
      { status: 500 }
    );
  }
}
