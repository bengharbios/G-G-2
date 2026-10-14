import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { getAllBottomNavTabs, updateBottomNavTab, createBottomNavTab, deleteBottomNavTab } from '@/lib/admin-db';

export const runtime = 'nodejs';

// GET: كل تبويبات الشريط السفلي (للأدمن)
export async function GET(request: NextRequest) {
  try {
    const { authorized } = await getAdminFromRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const tabs = await getAllBottomNavTabs();
    return NextResponse.json({ success: true, tabs });
  } catch (err) {
    return NextResponse.json({ error: String(err), success: false }, { status: 500 });
  }
}

// PUT: تحديث تبويب محدد
export async function PUT(request: NextRequest) {
  try {
    const { authorized } = await getAdminFromRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const body = await request.json();
    const { tabKey, tabLabel, tabIconOn, tabIconOff, tabHref, tabOrder, visibility, isActive } = body;

    if (!tabKey) {
      return NextResponse.json({ error: 'tabKey مطلوب' }, { status: 400 });
    }

    const updated = await updateBottomNavTab(String(tabKey), {
      tabLabel: tabLabel !== undefined ? String(tabLabel) : undefined,
      tabIconOn: tabIconOn !== undefined ? String(tabIconOn) : undefined,
      tabIconOff: tabIconOff !== undefined ? String(tabIconOff) : undefined,
      tabHref: tabHref !== undefined ? String(tabHref) : undefined,
      tabOrder: tabOrder !== undefined ? Number(tabOrder) : undefined,
      visibility: visibility !== undefined ? visibility : undefined,
      isActive: isActive !== undefined ? !!isActive : undefined,
    });

    return NextResponse.json({ success: true, tab: updated });
  } catch (err) {
    return NextResponse.json({ error: String(err), success: false }, { status: 500 });
  }
}

// POST: إنشاء تبويب جديد
export async function POST(request: NextRequest) {
  try {
    const { authorized } = await getAdminFromRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const body = await request.json();
    const { tabKey, tabLabel, tabIconOn, tabIconOff, tabHref, tabOrder, visibility } = body;

    if (!tabKey || !tabLabel) {
      return NextResponse.json({ error: 'tabKey و tabLabel مطلوبان' }, { status: 400 });
    }

    const created = await createBottomNavTab({
      tabKey: String(tabKey),
      tabLabel: String(tabLabel),
      tabIconOn: tabIconOn ? String(tabIconOn) : undefined,
      tabIconOff: tabIconOff ? String(tabIconOff) : undefined,
      tabHref: tabHref ? String(tabHref) : undefined,
      tabOrder: tabOrder !== undefined ? Number(tabOrder) : undefined,
      visibility: visibility || 'visible',
    });

    return NextResponse.json({ success: true, tab: created });
  } catch (err) {
    return NextResponse.json({ error: String(err), success: false }, { status: 500 });
  }
}

// DELETE: حذف تبويب محدد
export async function DELETE(request: NextRequest) {
  try {
    const { authorized } = await getAdminFromRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const url = new URL(request.url);
    const tabKey = url.searchParams.get('tabKey');

    if (!tabKey) {
      return NextResponse.json({ error: 'tabKey مطلوب (في query param)' }, { status: 400 });
    }

    await deleteBottomNavTab(tabKey);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err), success: false }, { status: 500 });
  }
}
