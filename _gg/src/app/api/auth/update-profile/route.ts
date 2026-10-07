import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { updateUser } from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gg-platform-secret-key-2024'
);

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { displayName, phone, avatar, bio, country, cover, frame, ornament, card, gender, birthDate } = body;

    // Build update data
    const updateData: Record<string, string> = {};
    if (displayName !== undefined) updateData.displayName = displayName.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (avatar !== undefined) updateData.avatar = avatar.trim();
    if (bio !== undefined) updateData.bio = bio.trim().slice(0, 300);
    if (country !== undefined) updateData.country = country.trim().slice(0, 40);
    // Profile decoration fields (yalla-style) — store as short asset paths/ids
    if (cover !== undefined) updateData.cover = String(cover).trim().slice(0, 120);
    if (frame !== undefined) updateData.frame = String(frame).trim().slice(0, 60);
    if (ornament !== undefined) updateData.ornament = String(ornament).trim().slice(0, 60);
    if (card !== undefined) updateData.card = String(card).trim().slice(0, 60);
    // Edit form extras (yalla view_edit_user_info)
    if (gender !== undefined) updateData.gender = String(gender).trim().slice(0, 20);
    if (birthDate !== undefined) updateData.birthDate = String(birthDate).trim().slice(0, 20);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'لم يتم تحديد بيانات للتحديث', success: false },
        { status: 400 }
      );
    }

    const updatedUser = await updateUser(userId, updateData);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود', success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        displayName: updatedUser.displayName || updatedUser.username,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        country: updatedUser.country,
        cover: updatedUser.cover,
        frame: updatedUser.frame,
        ornament: updatedUser.ornament,
        card: updatedUser.card,
        gender: updatedUser.gender,
        birthDate: updatedUser.birthDate,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('[Auth Update Profile] Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', success: false },
      { status: 500 }
    );
  }
}
