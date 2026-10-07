import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/admin-auth';
import { updateChargeRequestStatus } from '@/lib/admin-db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const user = await validateToken(token);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
    }

    const result = await updateChargeRequestStatus(id, action);
    return NextResponse.json({ success: true, request: result });
  } catch {
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}
