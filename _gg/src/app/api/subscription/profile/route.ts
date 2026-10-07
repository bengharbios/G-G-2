import { NextRequest, NextResponse } from 'next/server';
import { validateSubscriptionCode, getSiteConfig, getAllGames } from '@/lib/admin-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'كود الاشتراك مطلوب', success: false },
        { status: 400 }
      );
    }

    const trimmedCode = code.trim();

    // Validate subscription code
    const subscriber = await validateSubscriptionCode(trimmedCode);

    if (!subscriber) {
      return NextResponse.json(
        { error: 'كود الاشتراك غير صالح', success: false },
        { status: 404 }
      );
    }

    // Get site config for trial max sessions
    const siteConfig = await getSiteConfig();
    const maxTrialSessions = siteConfig.maxTrialSessions || 1;

    // Get all games to resolve allowed game names/icons
    const allGames = await getAllGames();
    const allowedGamesWithInfo = subscriber.allowedGames
      .map((slug) => {
        const game = allGames.find((g) => g.gameSlug === slug);
        if (!game) return null;
        return {
          slug: game.gameSlug,
          name: game.gameName,
          emoji: game.icon,
          color: game.color,
        };
      })
      .filter(Boolean);

    // Calculate days remaining
    const referenceDate = subscriber.endDate || subscriber.expiresAt;
    const daysRemaining = referenceDate
      ? Math.max(0, Math.ceil((new Date(referenceDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    // Calculate trial days remaining
    const trialDaysRemaining = subscriber.trialExpiresAt
      ? Math.max(0, Math.ceil((new Date(subscriber.trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    // Return sanitized profile data (no sensitive internal IDs or auth data)
    const profile = {
      success: true,
      subscriber: {
        name: subscriber.name,
        email: subscriber.email,
        phone: subscriber.phone || '',
        subscriptionCode: subscriber.subscriptionCode,
        plan: subscriber.plan,
        isTrial: subscriber.isTrial,
        isActive: subscriber.isActive,
        startDate: subscriber.startDate,
        endDate: subscriber.endDate,
        expiresAt: subscriber.expiresAt,
        allowedGames: subscriber.allowedGames,
        allowedGamesInfo: allowedGamesWithInfo,
        daysRemaining,
        gemsBalance: subscriber.gemsBalance,
      },
      trialInfo: subscriber.isTrial
        ? {
            sessionsUsed: subscriber.trialSessionsUsed,
            maxSessions: maxTrialSessions,
            expiresAt: subscriber.trialExpiresAt,
            daysLeft: trialDaysRemaining,
          }
        : null,
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('[Profile API] Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', success: false },
      { status: 500 }
    );
  }
}
