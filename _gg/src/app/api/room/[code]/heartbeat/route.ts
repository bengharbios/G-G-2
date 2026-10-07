import { NextRequest, NextResponse } from 'next/server';
import * as turso from '@/lib/turso';

// Host heartbeat endpoint - called every 5s by the host device
// Updates hostLastSeen so players can detect if host disconnected
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const room = await turso.getRoomByCode(code.toUpperCase());

    if (!room) {
      return NextResponse.json(
        { error: 'الغرفة غير موجودة' },
        { status: 404 }
      );
    }

    // Update hostLastSeen timestamp
    await turso.updateRoom(code.toUpperCase(), {
      hostLastSeen: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error updating heartbeat:', error);
    return NextResponse.json(
      { error: 'حدث خطأ' },
      { status: 500 }
    );
  }
}
