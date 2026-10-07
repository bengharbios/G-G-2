import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { getAllPremiumIds, createPremiumId, generateId } from '@/lib/turso';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAdminFromRequest(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const premiumIds = await getAllPremiumIds();
    return NextResponse.json({ premiumIds });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAdminFromRequest(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { displayName, priceGems } = body;

    if (!displayName) {
      return NextResponse.json(
        { error: 'اسم العرض مطلوب' },
        { status: 400 }
      );
    }

    const premiumId = await createPremiumId({
      id: generateId(),
      displayName,
      priceGems: priceGems || 100,
    });

    return NextResponse.json({ premiumId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
