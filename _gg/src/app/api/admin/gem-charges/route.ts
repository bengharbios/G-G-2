import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/admin-auth';
import { getAllChargeRequests } from '@/lib/admin-db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const user = await validateToken(token);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const requests = await getAllChargeRequests();
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}
