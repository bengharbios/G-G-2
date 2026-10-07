import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/admin-db';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gg-platform-secret-key-2024'
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, displayName, phone } = body;

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'اسم المستخدم والبريد الإلكتروني وكلمة المرور مطلوبان', success: false },
        { status: 400 }
      );
    }

    // Username validation
    if (username.length < 3) {
      return NextResponse.json(
        { error: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل', success: false },
        { status: 400 }
      );
    }
    if (username.length > 20) {
      return NextResponse.json(
        { error: 'اسم المستخدم يجب أن لا يتجاوز 20 حرفاً', success: false },
        { status: 400 }
      );
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: 'اسم المستخدم يجب أن يحتوي على حروف إنجليزية وأرقام فقط', success: false },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'بريد إلكتروني غير صالح', success: false },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', success: false },
        { status: 400 }
      );
    }

    // Create user
    const user = await createUser({
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password,
      displayName: displayName?.trim() || '',
      phone: phone?.trim() || '',
    });

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

    const response = NextResponse.json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName || user.username,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        numericId: user.numericId,
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'حدث خطأ في الخادم';
    console.error('[Auth Register] Error:', error);

    if (message.includes('مستخدم') || message.includes('already')) {
      return NextResponse.json(
        { error: message, success: false },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}
