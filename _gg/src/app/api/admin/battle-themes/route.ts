import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { getAllBattleThemes, createBattleTheme, updateBattleTheme, deleteBattleTheme, activateBattleTheme, getBattleButtonsByTheme, updateBattleButton, createBattleButton, deleteBattleButton, getBattleConfigsByTheme, updateBattleConfig } from '@/lib/admin-db';

export const runtime = 'nodejs';

// GET: كل القوالب + أزرار وإعدادات قالب محدد (لو query param ?themeId=)
export async function GET(request: NextRequest) {
  try {
    const { authorized } = await getAdminFromRequest(request);
    if (!authorized) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const url = new URL(request.url);
    const themeId = url.searchParams.get('themeId');

    if (themeId) {
      // أزرار + إعدادات قالب محدد
      const [buttons, configs] = await Promise.all([
        getBattleButtonsByTheme(themeId),
        getBattleConfigsByTheme(themeId),
      ]);
      return NextResponse.json({ success: true, buttons, configs });
    }

    // كل القوالب
    const themes = await getAllBattleThemes();
    return NextResponse.json({ success: true, themes });
  } catch (err) {
    return NextResponse.json({ error: String(err), success: false }, { status: 500 });
  }
}

// POST: إنشاء قالب جديد
export async function POST(request: NextRequest) {
  try {
    const { authorized } = await getAdminFromRequest(request);
    if (!authorized) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await request.json();
    const { action } = body;

    // تفعيل قالب
    if (action === 'activate') {
      const { themeId } = body;
      if (!themeId) return NextResponse.json({ error: 'themeId مطلوب' }, { status: 400 });
      await activateBattleTheme(themeId);
      return NextResponse.json({ success: true });
    }

    // إنشاء قالب جديد
    const { themeKey, themeName, description } = body;
    if (!themeKey || !themeName) return NextResponse.json({ error: 'themeKey و themeName مطلوبان' }, { status: 400 });
    const theme = await createBattleTheme({ themeKey: String(themeKey), themeName: String(themeName), description: description ? String(description) : '' });
    return NextResponse.json({ success: true, theme });
  } catch (err) {
    return NextResponse.json({ error: String(err), success: false }, { status: 500 });
  }
}

// PUT: تحديث قالب / زر / إعداد
export async function PUT(request: NextRequest) {
  try {
    const { authorized } = await getAdminFromRequest(request);
    if (!authorized) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await request.json();
    const { type } = body;

    if (type === 'theme') {
      const { themeId, themeName, description } = body;
      const theme = await updateBattleTheme(themeId, { themeName, description });
      return NextResponse.json({ success: true, theme });
    }

    if (type === 'button') {
      const { buttonId } = body;
      const updates: Record<string, unknown> = {};
      for (const k of ['label', 'imageSrc', 'strokeColor', 'width', 'height', 'tabHref', 'tabOrder', 'visibility', 'isActive']) {
        if (body[k] !== undefined) updates[k] = body[k];
      }
      const btn = await updateBattleButton(buttonId, updates);
      return NextResponse.json({ success: true, button: btn });
    }

    if (type === 'button_create') {
      const { themeId, gameType, buttonKey, label, imageSrc, strokeColor, width, height, tabHref, tabOrder } = body;
      const btn = await createBattleButton(themeId, { gameType, buttonKey, label, imageSrc, strokeColor, width, height, tabHref, tabOrder });
      return NextResponse.json({ success: true, button: btn });
    }

    if (type === 'config') {
      const { themeId, configKey, configValue } = body;
      const cfg = await updateBattleConfig(themeId, configKey, configValue);
      return NextResponse.json({ success: true, config: cfg });
    }

    return NextResponse.json({ error: 'type مطلوب (theme/button/button_create/config)' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err), success: false }, { status: 500 });
  }
}

// DELETE: حذف قالب / زر
export async function DELETE(request: NextRequest) {
  try {
    const { authorized } = await getAdminFromRequest(request);
    if (!authorized) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const url = new URL(request.url);
    const themeId = url.searchParams.get('themeId');
    const buttonId = url.searchParams.get('buttonId');

    if (buttonId) {
      await deleteBattleButton(buttonId);
      return NextResponse.json({ success: true });
    }
    if (themeId) {
      const ok = await deleteBattleTheme(themeId);
      if (!ok) return NextResponse.json({ error: 'لا يمكن حذف هذا القالب (نشط أو افتراضي)' }, { status: 400 });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'themeId أو buttonId مطلوب' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err), success: false }, { status: 500 });
  }
}
