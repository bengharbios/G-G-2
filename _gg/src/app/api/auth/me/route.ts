import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getUserById } from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gg-platform-secret-key-2024'
);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'غير مصرح', success: false },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    if (!userId) {
      return NextResponse.json(
        { error: 'رمز غير صالح', success: false },
        { status: 401 }
      );
    }

    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود', success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        numericId: user.numericId,
        email: user.email,
        displayName: user.displayName || user.username,
        phone: user.phone,
        avatar: user.avatar,
        bio: user.bio,
        country: user.country,
        cover: user.cover,
        frame: user.frame,
        ornament: user.ornament,
        card: user.card,
        role: user.role,
        subscriptionId: user.subscriptionId,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Auth Me] Error:', error);
    return NextResponse.json(
      { error: 'رمز غير صالح أو منتهي الصلاحية', success: false },
      { status: 401 }
    );
  }
}
