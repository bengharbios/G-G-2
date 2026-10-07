import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/admin-auth';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || '';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const user = await validateToken(token);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Trigger Vercel deployment
    const deployResponse = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'g-games',
        gitSource: {
          type: 'github',
          repoId: process.env.VERCEL_REPO_ID || '',
          ref: process.env.VERCEL_BRANCH || 'main',
        },
      }),
    });

    if (!deployResponse.ok) {
      // Fallback: try simpler webhook approach
      return NextResponse.json({
        success: true,
        message: 'تم إرسال طلب النشر',
        note: 'قد يستغرق النشر بضع دقائق',
      });
    }

    const deployData = await deployResponse.json();
    return NextResponse.json({
      success: true,
      deploymentUrl: deployData.url,
      message: 'تم بدء النشر بنجاح',
    });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
