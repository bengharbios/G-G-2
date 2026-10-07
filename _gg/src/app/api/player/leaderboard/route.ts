import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/admin-db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 100) : 50;

    const leaderboard = await getLeaderboard(limit);

    return NextResponse.json({
      success: true,
      leaderboard,
      totalPlayers: leaderboard.length,
    });
  } catch (error) {
    console.error('[Player Leaderboard API] Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', success: false },
      { status: 500 }
    );
  }
}
