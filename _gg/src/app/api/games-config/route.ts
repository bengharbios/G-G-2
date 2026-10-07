import { NextResponse } from 'next/server';
import { getAllGames } from '@/lib/admin-db';

export async function GET() {
  try {
    // Return ALL games (including disabled) so homepage can apply isEnabled/isComingSoon
    const games = await getAllGames();
    return NextResponse.json({
      games: games.map((g) => ({
        slug: g.gameSlug,
        name: g.gameName,
        icon: g.icon,
        color: g.color,
        isEnabled: g.isEnabled,
        isComingSoon: g.isComingSoon,
        isFree: g.isFree,
        playerRange: g.playerRange,
        description: g.description,
        order: g.order,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { games: [], error: String(error) },
      { status: 500 }
    );
  }
}
