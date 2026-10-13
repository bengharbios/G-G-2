import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { getRewardLog } from '@/lib/admin-db';

export const runtime = 'nodejs';

// GET: سجل آخر 100 مكافأة ممنوحة
export async function GET(request: NextRequest) {
  try {
    const { authorized } = await getAdminFromRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const url = new URL(request.url);
    const limit = Math.min(500, Math.max(10, Number(url.searchParams.get('limit') || 100)));
    const logs = await getRewardLog(limit);
    return NextResponse.json({ success: true, logs });
  } catch (err) {
    return NextResponse.json({ error: String(err), success: false }, { status: 500 });
  }
}
