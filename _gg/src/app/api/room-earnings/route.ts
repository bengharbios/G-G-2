import { NextRequest, NextResponse } from 'next/server';
import { getRoomEarnings, getTopGifters } from '@/lib/admin-db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
    }

    const [earnings, topGifters] = await Promise.all([
      getRoomEarnings(roomId, days),
      getTopGifters(roomId, 10),
    ]);

    return NextResponse.json({ earnings, topGifters });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
