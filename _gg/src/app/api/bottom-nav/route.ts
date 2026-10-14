import { NextResponse } from 'next/server';
import { getPublicBottomNavTabs } from '@/lib/admin-db';

export const runtime = 'nodejs';

/**
 * GET /api/bottom-nav
 * Returns all tabs that should be visible to public users (visible + maintenance).
 * Tabs with visibility='hidden' are not returned.
 * Used by SiteBottomNav to render the bottom navigation bar.
 *
 * The 'maintenance' tabs are returned with visibility='maintenance' so the
 * client can show a yellow "under maintenance" badge on them.
 */
export async function GET() {
  try {
    const tabs = await getPublicBottomNavTabs();
    return NextResponse.json({
      success: true,
      tabs: tabs.map((t) => ({
        tabKey: t.tabKey,
        tabLabel: t.tabLabel,
        tabIconOn: t.tabIconOn,
        tabIconOff: t.tabIconOff,
        tabHref: t.tabHref,
        tabOrder: t.tabOrder,
        visibility: t.visibility,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err), success: false, tabs: [] },
      { status: 500 }
    );
  }
}
