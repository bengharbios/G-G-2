import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { getAllGameRewardConfigs, upsertGameRewardConfig, getAllGames } from '@/lib/admin-db';

export const runtime = 'nodejs';

// GET: كل إعدادات المكافآت (مدمجة مع قائمة الألعاب)
export async function GET(request: NextRequest) {
  try {
    const { authorized } = await getAdminFromRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const configs = await getAllGameRewardConfigs();
    const games = await getAllGames();
    // ادمج: لكل لعبة، عوّد إعداداتها (أو null لو ما عندها إعدادات)
    const merged = games.map((g) => {
      const cfg = configs.find((c) => c.gameSlug === g.gameSlug) || null;
      return {
        gameSlug: g.gameSlug,
        gameName: g.gameName,
        config: cfg,
      };
    });
    return NextResponse.json({ success: true, rewards: merged });
  } catch (err) {
    return NextResponse.json({ error: String(err), success: false }, { status: 500 });
  }
}

// PUT: تحديث إعدادات مكافآت لعبة محددة
export async function PUT(request: NextRequest) {
  try {
    const { authorized } = await getAdminFromRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const body = await request.json();
    const { gameSlug, xpOnPlay, xpOnWin, goldOnPlay, goldOnWin, minPlayers, maxGoldPerDay, maxXPPerDay, isActive } = body;
    if (!gameSlug) {
      return NextResponse.json({ error: 'gameSlug مطلوب' }, { status: 400 });
    }
    const updated = await upsertGameRewardConfig(String(gameSlug), {
      xpOnPlay: xpOnPlay !== undefined ? Math.max(0, Math.floor(Number(xpOnPlay))) : undefined,
      xpOnWin: xpOnWin !== undefined ? Math.max(0, Math.floor(Number(xpOnWin))) : undefined,
      goldOnPlay: goldOnPlay !== undefined ? Math.max(0, Math.floor(Number(goldOnPlay))) : undefined,
      goldOnWin: goldOnWin !== undefined ? Math.max(0, Math.floor(Number(goldOnWin))) : undefined,
      minPlayers: minPlayers !== undefined ? Math.max(1, Math.floor(Number(minPlayers))) : undefined,
      maxGoldPerDay: maxGoldPerDay !== undefined ? Math.max(0, Math.floor(Number(maxGoldPerDay))) : undefined,
      maxXPPerDay: maxXPPerDay !== undefined ? Math.max(0, Math.floor(Number(maxXPPerDay))) : undefined,
      isActive: isActive !== undefined ? !!isActive : undefined,
    });
    return NextResponse.json({ success: true, config: updated });
  } catch (err) {
    return NextResponse.json({ error: String(err), success: false }, { status: 500 });
  }
}
