import { NextRequest, NextResponse } from 'next/server';
import { unlockAchievement, getUserAchievements, ACHIEVEMENTS } from '@/lib/admin-db';

export async function POST(req: NextRequest) {
  try {
    const { userId, achievementKey } = await req.json();
    if (!userId || !achievementKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const result = await unlockAchievement(userId, achievementKey);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const unlocked = await getUserAchievements(userId);
    const all = ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: unlocked.includes(a.key),
    }));

    return NextResponse.json({ achievements: all, unlockedCount: unlocked.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
