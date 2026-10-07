import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, getUserById } from '@/lib/admin-db';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gg-platform-secret-key-2024'
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان', success: false },
        { status: 400 }
      );
    }

    const user = await authenticateUser(email.trim().toLowerCase(), password);

    if (!user) {
      return NextResponse.json(
        { error: 'بيانات الدخول غير صحيحة', success: false },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(JWT_SECRET);

    // Get subscription info if linked
    let subscription = null;
    if (user.subscriptionId) {
      try {
        const { validateSubscriptionCode } = await import('@/lib/admin-db');
        // We can get subscription by ID through the subscription table
      } catch {
        // ignore
      }
    }

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName || user.username,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        subscriptionId: user.subscriptionId,
      },
      token,
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Auth Login] Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', success: false },
      { status: 500 }
    );
  }
}
