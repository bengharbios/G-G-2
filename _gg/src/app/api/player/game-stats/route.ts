import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { validateSubscriptionCode, getAllGames, getPlayerGameStats, getAllSessions } from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gg-platform-secret-key-2024'
);

/**
 * GET /api/player/game-stats?code=GG-TJBS
 * Returns per-game played/won stats for the logged-in user, limited to the
 * games allowed by the subscription AND currently enabled in the admin panel.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'كود الاشتراك مطلوب', success: false },
        { status: 400 }
      );
    }

    const subscriber = await validateSubscriptionCode(code.trim());
    if (!subscriber) {
      return NextResponse.json(
        { error: 'كود الاشتراك غير صالح', success: false },
        { status: 404 }
      );
    }

    // Resolve the AppUser from the auth cookie (optional — stats exist per user)
    let userId: string | null = null;
    let userNames: string[] = [subscriber.name];
    try {
      const token = request.cookies.get('auth_token')?.value;
      if (token) {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.userId) {
          userId = payload.userId as string;
          const { getUserById } = await import('@/lib/admin-db');
          const u = await getUserById(userId);
          if (u) {
            userNames = [u.displayName, u.username, subscriber.name].filter(Boolean);
          }
        }
      }
    } catch {
      // No valid session — fall back to subscriber-name matching only
    }

    // Enabled games from the admin panel
    const allGames = await getAllGames();
    const enabledBySlug = new Map<string, string>();
    for (const g of allGames) {
      if (g.isEnabled) enabledBySlug.set(g.gameSlug, g.gameName);
    }

    // Games allowed by the subscription AND still enabled
    const allowedSlugs = (subscriber.allowedGames || []).filter((s) => enabledBySlug.has(s));

    // Per-user counters (PlayerGameStats), with hosted-session fallback
    const stats: Record<string, { played: number; won: number }> = userId
      ? await getPlayerGameStats(userId)
      : {};

    if (userId) {
      const hosted = await getAllSessions(1000);
      const hostedCounts: Record<string, number> = {};
      for (const s of hosted) {
        if (userNames.includes(s.hostName)) {
          hostedCounts[s.gameSlug] = (hostedCounts[s.gameSlug] || 0) + 1;
        }
      }
      for (const slug of allowedSlugs) {
        const hostedPlayed = hostedCounts[slug] || 0;
        if (!stats[slug]) {
          if (hostedPlayed > 0) stats[slug] = { played: hostedPlayed, won: 0 };
        }
      }
    }

    const games = allowedSlugs.map((slug) => ({
      slug,
      name: enabledBySlug.get(slug) || slug,
      played: stats[slug]?.played ?? 0,
      won: stats[slug]?.won ?? 0,
    }));

    return NextResponse.json({ success: true, games });
  } catch (error) {
    console.error('[Player Game Stats API] Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', success: false },
      { status: 500 }
    );
  }
}
