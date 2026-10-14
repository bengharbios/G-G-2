import { NextResponse } from 'next/server';
import { getActiveBattleTheme, getBattleButtonsByTheme, getBattleConfigsByTheme } from '@/lib/admin-db';

export const runtime = 'nodejs';

/**
 * GET /api/battle/config
 * Returns the active theme + its buttons + configs.
 * Used by BattlePage to render the games page dynamically.
 */
export async function GET() {
  try {
    const theme = await getActiveBattleTheme();
    if (!theme) {
      return NextResponse.json({ success: false, error: 'no active theme' }, { status: 404 });
    }
    const [buttons, configs] = await Promise.all([
      getBattleButtonsByTheme(theme.id),
      getBattleConfigsByTheme(theme.id),
    ]);
    // filter hidden buttons + inactive
    const visibleButtons = buttons.filter((b) => b.isActive && b.visibility !== 'hidden');
    // convert configs to key-value map
    const configMap: Record<string, string> = {};
    for (const cfg of configs) {
      configMap[cfg.configKey] = cfg.configValue;
    }
    return NextResponse.json({
      success: true,
      theme: {
        id: theme.id,
        themeKey: theme.themeKey,
        themeName: theme.themeName,
      },
      configs: configMap,
      buttons: visibleButtons.map((b) => ({
        id: b.id,
        gameType: b.gameType,
        buttonKey: b.buttonKey,
        label: b.label,
        imageSrc: b.imageSrc,
        strokeColor: b.strokeColor,
        width: b.width,
        height: b.height,
        tabHref: b.tabHref,
        tabOrder: b.tabOrder,
        visibility: b.visibility,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err), success: false }, { status: 500 });
  }
}
