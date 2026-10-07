import { NextRequest, NextResponse } from 'next/server';
import { checkGameAccess } from '@/lib/admin-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, gameSlug, incrementUsage } = body;

    if (!code || !gameSlug) {
      return NextResponse.json(
        { error: 'رمز الاشتراك واسم اللعبة مطلوبان', allowed: false },
        { status: 400 }
      );
    }

    const result = await checkGameAccess(code, gameSlug, {
      incrementTrialUsage: !!incrementUsage,
    });

    // Return subscriber info (sanitized - no sensitive data)
    const response: {
      allowed: boolean;
      reason: string;
      subscriber?: {
        name: string;
        subscriptionCode: string;
        plan: string;
        isTrial: boolean;
        isActive: boolean;
        endDate: string | null;
      };
      trialInfo?: {
        sessionsUsed: number;
        maxSessions: number;
        expiresAt: string | null;
        daysLeft: number;
      };
    } = {
      allowed: result.allowed,
      reason: result.reason,
    };

    if (result.subscriber) {
      response.subscriber = {
        name: result.subscriber.name,
        subscriptionCode: result.subscriber.subscriptionCode,
        plan: result.subscriber.plan,
        isTrial: result.subscriber.isTrial,
        isActive: result.subscriber.isActive,
        endDate: result.subscriber.endDate,
      };
    }

    if (result.trialInfo) {
      response.trialInfo = result.trialInfo;
    }

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', allowed: false },
      { status: 500 }
    );
  }
}
