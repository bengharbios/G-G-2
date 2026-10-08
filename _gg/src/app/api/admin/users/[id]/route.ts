import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { updateUser, deleteUser, getUserById, ensureAdminTables, getClient } from '@/lib/admin-db';

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
    const { role, displayName, phone, isActive, subscriptionId, avatar, bio, country, gender, birthDate, gold, gemsBalance } = body;

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
    // حقول الملف الكاملة (ترابط لوحة الأدمن مع البروفايل)
    if (avatar !== undefined) updateData.avatar = String(avatar).trim().slice(0, 200);
    if (bio !== undefined) updateData.bio = String(bio).trim().slice(0, 300);
    if (country !== undefined) updateData.country = String(country).trim().slice(0, 40);
    if (gender !== undefined) updateData.gender = String(gender).trim().slice(0, 20);
    if (birthDate !== undefined) updateData.birthDate = String(birthDate).trim().slice(0, 20);
    // الذهب: تعديل مباشر من الأدمن
    if (gold !== undefined) {
      const g = Math.max(0, Math.min(1_000_000, Math.floor(Number(gold) || 0)));
      updateData.gold = g;
    }
    // الجواهر: تعديل مباشر على رصيد الاشتراك (يدعم NULL)
    if (gemsBalance !== undefined) {
      const g = Math.max(0, Math.min(1_000_000, Math.floor(Number(gemsBalance) || 0)));
      await ensureAdminTables();
      const cc = getClient();
      const cur = await cc.execute({ sql: "SELECT subscriptionId FROM AppUser WHERE id = ?", args: [id] });
      const subId = (cur.rows[0] as Record<string, unknown> | undefined)?.subscriptionId;
      if (subId) {
        await cc.execute({ sql: "UPDATE Subscription SET gemsBalance = ?, updatedAt = datetime('now') WHERE id = ?", args: [g, String(subId)] });
      }
    }

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
