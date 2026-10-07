import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import {
  getAllVoiceRooms, createVoiceRoom, getRoomByHostId, updateRoomImage,
  migrateAssignNumericIds,
} from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'gg-platform-secret-key-2024');

async function getUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { const { payload } = await jwtVerify(token, JWT_SECRET); return payload.userId as string; }
  catch { return null; }
}

export async function GET(request: NextRequest) {
  try {
    // Auto-migrate: assign numeric IDs to existing users who don't have one
    try { await migrateAssignNumericIds(); } catch { /* silent */ }

    const userId = await getUserId(request);
    const myRoom = userId ? await getRoomByHostId(userId) : null;
    const rooms = await getAllVoiceRooms();
    return NextResponse.json({ success: true, rooms, myRoom });
  } catch (e) {
    console.error('[VR GET]', e);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    // Check if user already has a room
    const existing = await getRoomByHostId(userId);
    if (existing) {
      return NextResponse.json({ error: 'لديك غرفة بالفعل', existingRoom: existing }, { status: 400 });
    }

    const {
      name, description, hostName, maxParticipants, isPrivate, micSeatCount,
      roomMode, roomPassword, micTheme, isAutoMode, roomAvatar, roomImage,
    } = await request.json();
    if (!name) return NextResponse.json({ error: 'اسم الغرفة مطلوب' }, { status: 400 });

    const room = await createVoiceRoom(
      userId, hostName || 'مستخدم', name, description || '',
      maxParticipants || 10, isPrivate || false, micSeatCount || 10,
      roomMode || 'public', roomPassword || '', micTheme || 'default', isAutoMode !== false,
      roomAvatar || '', roomImage || '',
    );
    return NextResponse.json({ success: true, room });
  } catch (e) {
    console.error('[VR POST]', e);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await request.json();
    const { roomId, roomImage } = body;

    if (roomId && roomImage) {
      const ok = await updateRoomImage(roomId, roomImage, userId);
      if (!ok) return NextResponse.json({ error: 'فشل تحديث الصورة' }, { status: 403 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  } catch (e) {
    console.error('[VR PUT]', e);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
