import { NextRequest, NextResponse } from 'next/server';
import { getClient, ensureAdminTables, createVoiceRoom } from '@/lib/admin-db';

/*
 * POST /api/voice-rooms/setup-room?key=gg-cleanup-2024-delete-rooms-only&numericId=100002&name=الغريب
 * ينشئ غرفة للمستخدم بإعدادات يلا لودو الصحيحة:
 * - 5 مايكات (FIVE layout)
 * - مستوى 1 (قياسي)
 * - نوع عام (public)
 * - isAutoMode = true
 */
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const adminKey = url.searchParams.get('key');
    const ADMIN_KEY = 'gg-cleanup-2024-delete-rooms-only';
    
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const numericId = url.searchParams.get('numericId') || '100002';
    const roomName = url.searchParams.get('name') || 'الغريب';

    await ensureAdminTables();
    const c = getClient();

    // Find user by numericId
    const userResult = await c.execute({
      sql: 'SELECT id, username, displayName FROM AppUser WHERE numericId = ?',
      args: [parseInt(numericId)],
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: `لم يتم العثور على مستخدم بمعرّف ${numericId}` }, { status: 404 });
    }

    const user = userResult.rows[0] as any;
    const hostId = user.id;
    const hostName = user.displayName || user.username || roomName;

    // Check if user already has a room
    const existing = await c.execute({ sql: 'SELECT id FROM VoiceRoom WHERE hostId = ?', args: [hostId] });
    if (existing.rows.length > 0) {
      // Delete old room first
      await c.execute({ sql: 'DELETE FROM VoiceRoomParticipant WHERE roomId = ?', args: [existing.rows[0].id] });
      await c.execute({ sql: 'DELETE FROM VoiceRoom WHERE id = ?', args: [existing.rows[0].id] });
    }

    // Create room with Yalla Ludo v1.5.1.0 defaults
    const room = await createVoiceRoom(
      hostId,        // hostId
      hostName,      // hostName
      roomName,      // name (الغريب)
      '',            // description
      10,            // maxParticipants
      false,         // isPrivate
      5,             // micSeatCount = 5 (FIVE layout)
      'public',      // roomMode
      '',            // roomPassword
      'chat5',       // micTheme = chat5 (5 mics in a row)
      true,          // isAutoMode
      '',            // roomAvatar
      '',            // roomImage
    );

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        hostId: room.hostId,
        hostName: room.hostName,
        micSeatCount: room.micSeatCount,
        roomMode: room.roomMode,
        micTheme: room.micTheme,
        roomLevel: room.roomLevel,
      },
      message: `تم إنشاء غرفة "${roomName}" بمعرّف ${room.id} (5 مايكات، مستوى 1)`,
    });
  } catch (error: any) {
    console.error('[Setup Room] Error:', error);
    return NextResponse.json({ error: error?.message || 'حدث خطأ', success: false }, { status: 500 });
  }
}
