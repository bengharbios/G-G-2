import { NextResponse } from 'next/server';
import { getActiveEvents } from '@/lib/admin-db';

export async function GET() {
  try {
    const events = await getActiveEvents();
    return NextResponse.json({ events });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', events: [] },
      { status: 500 }
    );
  }
}
