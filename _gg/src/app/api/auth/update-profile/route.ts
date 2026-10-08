import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { updateUser, ensureAdminTables, getClient, grantDecorToUser } from '@/lib/admin-db';

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
    if (displayName !== undefined) {
      const newName = displayName.trim();
      // حد تغيير الاسم: 3 مرات كحد أقصى في اليوم (يُصفَّر تلقائياً مع بداية يوم جديد)
      await ensureAdminTables();
      const cc = getClient();
      const me = await cc.execute({ sql: 'SELECT displayName, renameCount, renameDate FROM AppUser WHERE id = ? LIMIT 1', args: [userId] });
      const meRow = me.rows[0] as Record<string, unknown> | undefined;
      const today = new Date().toISOString().slice(0, 10);
      const sameDay = String(meRow?.renameDate ?? '') === today;
      const usedToday = sameDay ? Number(meRow?.renameCount ?? 0) : 0;
      const oldName = String(meRow?.displayName ?? '');
      if (newName !== oldName && usedToday >= 3) {
        return NextResponse.json(
          { error: 'وصلت للحد الأقصى لتغيير الاسم اليوم (3 مرات) — جرّب غداً', success: false },
          { status: 429 }
        );
      }
      updateData.displayName = newName;
      if (newName !== oldName) {
        updateData.renameCount = String(usedToday + 1);
        updateData.renameDate = today;
      }
    }
    if (phone !== undefined) updateData.phone = phone.trim();
    if (avatar !== undefined) updateData.avatar = avatar.trim();
    if (bio !== undefined) updateData.bio = bio.trim().slice(0, 300);
    if (country !== undefined) updateData.country = country.trim().slice(0, 40);
    // زينة الملف (معلق/موضوع/بطاقة): تُقبل القيمة فقط إن كان المستخدم يملك العنصر،
    // والعناصر المجانية تُمنح تلقائياً عند أول اختيار. مصدر الحقيقة: كتالوج DecorItem
    const decorFields: Array<{ val: string; kind: 'ornament' | 'theme' | 'card'; key: 'ornament' | 'cover' | 'card' }> = [];
    if (ornament !== undefined) decorFields.push({ val: String(ornament).trim().slice(0, 60), kind: 'ornament', key: 'ornament' });
    if (cover !== undefined) decorFields.push({ val: String(cover).trim().slice(0, 120), kind: 'theme', key: 'cover' });
    if (card !== undefined) decorFields.push({ val: String(card).trim().slice(0, 60), kind: 'card', key: 'card' });
    for (const df of decorFields) {
      if (df.val === '') {
        updateData[df.key] = '';
        continue;
      }
      await ensureAdminTables();
      const c = getClient();
      const itemRes = await c.execute({
        sql: 'SELECT id, isFree FROM DecorItem WHERE id = ? AND kind = ? AND isActive = 1 LIMIT 1',
        args: [df.val, df.kind],
      });
      if (itemRes.rows.length === 0) {
        // القيمة ليست في الكتالوج — لا نقبلها (حماية من التزوير)
        return NextResponse.json(
          { error: 'عنصر الزينة غير معروف', success: false },
          { status: 403 }
        );
      }
      const itemRow = itemRes.rows[0] as Record<string, unknown>;
      const owned = await c.execute({
        sql: 'SELECT id FROM UserDecor WHERE userId = ? AND itemId = ? LIMIT 1',
        args: [userId, df.val],
      });
      if (owned.rows.length === 0) {
        if (Number(itemRow.isFree ?? 0) === 1) {
          await grantDecorToUser({ userId, itemId: df.val, obtainedFrom: 'gift', obtainedNote: 'عنصر مجاني' });
        } else {
          return NextResponse.json(
            { error: 'غير مصرح: هذا العنصر غير مملوك لك — يمكنك اقتناؤه من المتجر', success: false },
            { status: 403 }
          );
        }
      }
      updateData[df.key] = df.val;
    }
    // الإطار: يُضبط فقط عبر مسار الملكية (/api/frames equip) — هنا نقبل الإزالة فقط،
    // وأي قيمة غير فارغة تُرفض ما لم يكن المستخدم يملك الإطار فعلاً (حماية من التزوير)
    if (frame !== undefined && String(frame).trim() !== '') {
      await ensureAdminTables();
      const c = getClient();
      const fid = String(frame).trim().slice(0, 60);
      const owned = await c.execute({
        sql: 'SELECT id FROM UserFrame WHERE userId = ? AND frameId = ? LIMIT 1',
        args: [userId, fid],
      });
      if (owned.rows.length === 0) {
        return NextResponse.json(
          { error: 'غير مصرح: هذا الإطار غير مملوك لك', success: false },
          { status: 403 }
        );
      }
      updateData.frame = fid;
    } else if (frame !== undefined) {
      updateData.frame = '';
    }
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
