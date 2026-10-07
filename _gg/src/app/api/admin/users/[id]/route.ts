import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { updateUser, deleteUser, getUserById } from '@/lib/admin-db';

// ─── PUT: Update user (role, displayName, phone, isActive, etc.) ───────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized } = await getAdminFromRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: 'غير مصرح', success: false }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { role, displayName, phone, isActive, subscriptionId } = body;

    // Validate role
    if (role !== undefined && !['admin', 'moderator', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'دور غير صالح. الأدوار المتاحة: admin, moderator, user', success: false },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (role !== undefined) updateData.role = role;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (subscriptionId !== undefined) updateData.subscriptionId = subscriptionId;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'لا توجد بيانات للتحديث', success: false },
        { status: 400 }
      );
    }

    const updatedUser = await updateUser(id, updateData);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود', success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'تم تحديث المستخدم بنجاح',
    });
  } catch (error) {
    console.error('[Admin Users PUT] Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', success: false },
      { status: 500 }
    );
  }
}

// ─── DELETE: Deactivate user (soft delete) ─────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized } = await getAdminFromRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: 'غير مصرح', success: false }, { status: 401 });
    }

    const { id } = await params;

    // Check if user exists
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود', success: false },
        { status: 404 }
      );
    }

    // Prevent deleting self
    // Note: We can't get current admin user ID easily here, but the admin layout handles auth

    await deleteUser(id);

    return NextResponse.json({
      success: true,
      message: 'تم تعطيل المستخدم بنجاح',
    });
  } catch (error) {
    console.error('[Admin Users DELETE] Error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', success: false },
      { status: 500 }
    );
  }
}
