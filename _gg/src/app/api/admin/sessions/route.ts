import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/admin-auth';
import { getAllSessions, getSessionsByGame } from '@/lib/admin-db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const user = await validateToken(token);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gameSlug = searchParams.get('game');

    if (gameSlug) {
      const sessions = await getSessionsByGame(gameSlug);
      return NextResponse.json({ sessions });
    }

    const sessions = await getAllSessions(100);
    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
