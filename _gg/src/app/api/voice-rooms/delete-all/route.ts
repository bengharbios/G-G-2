import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getClient, ensureAdminTables } from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'gg-platform-secret-key-2024');

export async function POST(request: NextRequest) {
  try {
    // Simple hardcoded admin key (not env-dependent) for one-time cleanup
    const adminKey = new URL(request.url).searchParams.get('key');
    const ADMIN_CLEANUP_KEY = 'gg-cleanup-2024-delete-rooms-only';
    
    if (adminKey !== ADMIN_CLEANUP_KEY) {
      // Also accept auth cookie
      const token = request.cookies.get('auth_token')?.value;
      if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      try {
        await jwtVerify(token, JWT_SECRET);
      } catch {
        return NextResponse.json({ error: 'رمز غير صالح' }, { status: 401 });
      }
    }

    await ensureAdminTables();
    const c = getClient();

    // Get all rooms
    const rooms = await c.execute({ sql: 'SELECT id, name FROM VoiceRoom' });
    const roomCount = rooms.rows.length;

    // Delete all participants
    const dp = await c.execute({ sql: 'DELETE FROM VoiceRoomParticipant' });
    
    // Delete all rooms
    const dr = await c.execute({ sql: 'DELETE FROM VoiceRoom' });

    return NextResponse.json({
      success: true,
      roomsDeleted: dr.rowsAffected,
      participantsDeleted: dp.rowsAffected,
      message: `تم حذف ${roomCount} غرفة بنجاح`,
    });
  } catch (error) {
    console.error('[Delete All Rooms] Error:', error);
    return NextResponse.json({ error: 'حدث خطأ', success: false }, { status: 500 });
  }
}
