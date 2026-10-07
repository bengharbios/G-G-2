import { NextResponse } from 'next/server';
import { getSiteConfig } from '@/lib/admin-db';

export async function GET() {
  try {
    const config = await getSiteConfig();

    // Return only public-safe fields
    return NextResponse.json({
      allowDirectRegistration: config.allowDirectRegistration,
      telegramLink: config.telegramLink,
      whatsappLink: config.whatsappLink,
      subscriptionPrice: config.subscriptionPrice,
      contactMessage: config.contactMessage,
      trialGameSlugs: config.trialGameSlugs,
      trialDurationDays: config.trialDurationDays,
      maxTrialSessions: config.maxTrialSessions,
    });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
