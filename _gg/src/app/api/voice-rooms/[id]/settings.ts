import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getRoomById, updateRoomSettings, getParticipant, ROLE_HIERARCHY, VoiceRoom } from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'gg-platform-secret-key-2024');

async function getPayload(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { const { payload } = await jwtVerify(token, JWT_SECRET); return payload; }
  catch { return null; }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await getPayload(request);
    if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    const userId = p.userId as string;

    // Must be a participant to view settings
    const actor = await getParticipant(id, userId);
    if (!actor) return NextResponse.json({ error: 'لست في الغرفة' }, { status: 403 });

    const room = await getRoomById(id);
    if (!room) return NextResponse.json({ error: 'الغرفة غير موجودة' }, { status: 404 });

    // Don't expose password to non-owners
    if (ROLE_HIERARCHY[actor.role] < ROLE_HIERARCHY.owner) {
      room.roomPassword = '';
    }

    return NextResponse.json({ success: true, room });
  } catch (e) {
    console.error('[VR SETTINGS GET]', e);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await getPayload(request);
    if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    const userId = p.userId as string;
    const body = await request.json();

    // Build partial settings object
    const settings: Partial<VoiceRoom> = {};

    if (body.roomMode !== undefined) settings.roomMode = body.roomMode;
    if (body.roomPassword !== undefined) settings.roomPassword = body.roomPassword;
    if (body.roomLevel !== undefined) settings.roomLevel = Number(body.roomLevel);
    if (body.micTheme !== undefined) settings.micTheme = body.micTheme;
    if (body.bgmEnabled !== undefined) settings.bgmEnabled = Boolean(body.bgmEnabled);
    if (body.chatMuted !== undefined) settings.chatMuted = Boolean(body.chatMuted);
    if (body.announcement !== undefined) settings.announcement = body.announcement;
    if (body.giftSplit !== undefined) settings.giftSplit = Number(body.giftSplit);
    if (body.isAutoMode !== undefined) settings.isAutoMode = Boolean(body.isAutoMode);
    if (body.roomAvatar !== undefined) settings.roomAvatar = body.roomAvatar;

    const updatedRoom = await updateRoomSettings(id, settings, userId);
    if (!updatedRoom) return NextResponse.json({ error: 'فشل تحديث الإعدادات' }, { status: 400 });

    // Don't expose password in response
    updatedRoom.roomPassword = '';

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (e) {
    console.error('[VR SETTINGS PUT]', e);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
