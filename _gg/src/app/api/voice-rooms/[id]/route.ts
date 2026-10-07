import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import {
  getVoiceRoomParticipants, joinVoiceRoom, leaveVoiceRoom, toggleMicInRoom,
  deleteVoiceRoom, sendGiftInRoom, getGifts, isUserBanned, getParticipant,
  banUserFromRoom, unbanUserFromRoom, getBannedUsers,
  kickFromMic, kickFromRoom, freezeSeat, unfreezeSeat,
  assignSeat, requestSeat, approveWaitlist, rejectWaitlist, getWaitlist,
  changeUserRole, transferOwnership, updateRoomSettings,
  getActionLog, setSeatStatus, getRoomById,
  kickFromRoomTimed, isUserKicked, cleanExpiredKicks,
  getRoomTemplate, saveRoomTemplate, getUserGiftStats,
  inviteRoleToRoom, acceptRoleInvite, rejectRoleInvite,
  inviteToMic, acceptMicInvite, rejectMicInvite,
  ROLE_HIERARCHY, RoomRole, getRoomWeeklyGems, getRoomTopGifts,
  getUserGemsBalance,
  cleanupStaleParticipants, updateParticipantLastSeen,
  getRoomMembers,
} from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'gg-platform-secret-key-2024');

async function getPayload(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { const { payload } = await jwtVerify(token, JWT_SECRET); return payload; }
  catch { return null; }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'heartbeat') {
      const p = await getPayload(request);
      if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      await updateParticipantLastSeen(id, p.userId as string);
      return NextResponse.json({ success: true });
    }
    if (action === 'participants') {
      // Clean up stale participants (users who left without clicking "leave")
      try { await cleanupStaleParticipants(id); } catch { /* ignore */ }
      const p = await getVoiceRoomParticipants(id);
      return NextResponse.json({ success: true, participants: p });
    }
    if (action === 'gifts') {
      const g = await getGifts();
      return NextResponse.json({ success: true, gifts: g });
    }
    if (action === 'banned') {
      const p = await getPayload(request);
      if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      const banned = await isUserBanned(id, p.userId as string);
      return NextResponse.json({ success: true, banned });
    }
    if (action === 'banned-list') {
      const p = await getPayload(request);
      if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      const list = await getBannedUsers(id);
      return NextResponse.json({ success: true, list });
    }
    if (action === 'waitlist') {
      const wl = await getWaitlist(id);
      return NextResponse.json({ success: true, waitlist: wl });
    }
    if (action === 'action-log') {
      const limit = Number(searchParams.get('limit')) || 50;
      const log = await getActionLog(id, limit);
      return NextResponse.json({ success: true, log });
    }
    if (action === 'room-details') {
      const p = await getPayload(request);
      if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      const room = await getRoomById(id);
      if (!room) return NextResponse.json({ error: 'الغرفة غير موجودة' }, { status: 404 });
      // Only return password to owner
      if (room.hostId !== p.userId) room.roomPassword = '';
      return NextResponse.json({ success: true, room });
    }
    if (action === 'my-participant') {
      const p = await getPayload(request);
      if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      const me = await getParticipant(id, p.userId as string);
      return NextResponse.json({ success: true, participant: me });
    }
    if (action === 'kicked') {
      const p = await getPayload(request);
      if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      await cleanExpiredKicks(id);
      const kicked = await isUserKicked(id, p.userId as string);
      return NextResponse.json({ success: true, kicked });
    }
    if (action === 'template') {
      const p = await getPayload(request);
      if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      const tpl = await getRoomTemplate(p.userId as string);
      return NextResponse.json({ success: true, template: tpl });
    }
    if (action === 'user-stats') {
      const p = await getPayload(request);
      if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      const targetUserId = searchParams.get('userId') || (p.userId as string);
      const stats = await getUserGiftStats(targetUserId);
      return NextResponse.json({ success: true, stats });
    }
    if (action === 'my-gems') {
      const p = await getPayload(request);
      if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
      const balance = await getUserGemsBalance(p.userId as string);
      return NextResponse.json({ success: true, gems: balance });
    }
    if (action === 'weekly-gems') {
      const gems = await getRoomWeeklyGems(id);
      return NextResponse.json({ success: true, gems });
    }
    if (action === 'top-gifts') {
      const limit = Number(searchParams.get('limit')) || 20;
      const gifts = await getRoomTopGifts(id, limit);
      return NextResponse.json({ success: true, gifts });
    }
    if (action === 'room-members') {
      const members = await getRoomMembers(id);
      return NextResponse.json({ success: true, members });
    }

    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  } catch (e) {
    console.error('[VR ID GET]', e);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await getPayload(request);
    if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = p.userId as string;

    if (action === 'toggle-mic') {
      const participant = await getParticipant(id, userId);
      if (!participant) return NextResponse.json({ error: 'لست في الغرفة' }, { status: 400 });
      if (participant.micFrozen) return NextResponse.json({ success: false, frozen: true, error: 'المايك مجمد' });
      const isMuted = await toggleMicInRoom(id, userId);
      return NextResponse.json({ success: true, isMuted });
    }

    if (action === 'update-settings') {
      const body = await request.json();
      const room = await updateRoomSettings(id, body, userId);
      if (!room) return NextResponse.json({ error: 'فشل تحديث الإعدادات' }, { status: 403 });
      return NextResponse.json({ success: true, room });
    }

    if (action === 'change-role') {
      const { targetUserId, newRole } = await request.json();
      if (!targetUserId || !newRole) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
      const ok = await changeUserRole(id, targetUserId, newRole, userId);
      if (!ok) return NextResponse.json({ error: 'لا تملك صلاحية تغيير هذا الدور' }, { status: 403 });
      return NextResponse.json({ success: true });
    }

    if (action === 'transfer-ownership') {
      const { newOwnerId } = await request.json();
      if (!newOwnerId) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
      const ok = await transferOwnership(id, newOwnerId, userId);
      if (!ok) return NextResponse.json({ error: 'فشل نقل الملكية' }, { status: 403 });
      return NextResponse.json({ success: true });
    }

    if (action === 'set-seat-status') {
      const { seatIndex, status } = await request.json();
      if (seatIndex === undefined || !status) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
      // Permission check: admin+ only
      const actor = await getParticipant(id, userId);
      if (!actor || ROLE_HIERARCHY[actor.role] < ROLE_HIERARCHY['admin' as RoomRole]) {
        return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
      }
      const ok = await setSeatStatus(id, seatIndex, status, userId);
      if (!ok) return NextResponse.json({ error: 'فشل تغيير حالة المقعد' }, { status: 403 });
      return NextResponse.json({ success: true });
    }

    if (action === 'invite-role') {
      const { targetUserId, newRole } = await request.json();
      if (!targetUserId || !newRole) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
      const ok = await inviteRoleToRoom(id, targetUserId, newRole as string, userId);
      if (!ok) return NextResponse.json({ error: 'فشل إرسال الدعوة' }, { status: 403 });
      return NextResponse.json({ success: true });
    }

    if (action === 'accept-invite') {
      try {
        const result = await acceptRoleInvite(id, userId);
        return NextResponse.json({ success: result.success, role: result.role });
      } catch (e: any) {
        console.error('[accept-invite] error:', e);
        return NextResponse.json({ success: false, error: e?.message || 'خطأ في قبول الدعوة' });
      }
    }

    if (action === 'reject-invite') {
      const ok = await rejectRoleInvite(id, userId);
      return NextResponse.json({ success: ok });
    }

    if (action === 'accept-mic-invite') {
      const result = await acceptMicInvite(id, userId);
      return NextResponse.json({ success: result.success, seatIndex: result.seatIndex });
    }

    if (action === 'reject-mic-invite') {
      const ok = await rejectMicInvite(id, userId);
      return NextResponse.json({ success: ok });
    }

    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  } catch (e) {
    console.error('[VR ID PUT]', e);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await getPayload(request);
    if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = p.userId as string;

    if (action === 'join') {
      const body = await request.json().catch(() => ({}));
      const result = await joinVoiceRoom(
        id, userId, body.username || '', body.displayName || '',
        body.avatar || '', body.password,
      );
      if (!result.success) return NextResponse.json({ error: result.error }, { status: 403 });
      return NextResponse.json({ success: true });
    }

    if (action === 'leave') {
      const ok = await leaveVoiceRoom(id, userId);
      return NextResponse.json({ success: ok });
    }

    if (action === 'gift') {
      const { giftId, toUserId, quantity, unitPrice } = await request.json();
      const result = await sendGiftInRoom(id, giftId, userId, toUserId, quantity || 1, unitPrice ? Number(unitPrice) : undefined);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, newBalance: result.newBalance });
    }

    if (action === 'request-seat') {
      const body = await request.json().catch(() => ({}));
      const vipLevel = Number(p.vipLevel) || 0;
      const result = await requestSeat(
        id, userId, body.username || '', body.displayName || '',
        body.avatar || '', vipLevel, body.seatIndex !== undefined ? Number(body.seatIndex) : -1,
      );
      return NextResponse.json({ success: result.success, autoAssigned: result.autoAssigned, seatIndex: result.seatIndex, error: result.error });
    }

    if (action === 'leave-seat') {
      const ok = await kickFromMic(id, userId, userId); // self leave seat
      return NextResponse.json({ success: ok });
    }

    if (action === 'ban') {
      const { targetUserId, reason } = await request.json();
      if (!targetUserId) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
      // Permission check: admin+ only
      const actor = await getParticipant(id, userId);
      if (!actor || ROLE_HIERARCHY[actor.role] < ROLE_HIERARCHY['admin' as RoomRole]) {
        return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
      }
      const target = await getParticipant(id, targetUserId);
      if (target && ROLE_HIERARCHY[target.role] >= ROLE_HIERARCHY[actor.role]) {
        return NextResponse.json({ error: 'لا يمكنك حظر هذا المستخدم' }, { status: 403 });
      }
      const ok = await banUserFromRoom(id, targetUserId, userId, reason || '');
      if (!ok) return NextResponse.json({ error: 'فشل حظر المستخدم' }, { status: 403 });
      return NextResponse.json({ success: true });
    }

    if (action === 'unban') {
      const { targetUserId } = await request.json();
      if (!targetUserId) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
      // Permission check: admin+ only
      const actor = await getParticipant(id, userId);
      if (!actor || ROLE_HIERARCHY[actor.role] < ROLE_HIERARCHY['admin' as RoomRole]) {
        return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
      }
      const ok = await unbanUserFromRoom(id, targetUserId);
      return NextResponse.json({ success: ok });
    }

    if (action === 'kick-from-mic') {
      const { targetUserId } = await request.json();
      if (!targetUserId) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
      // Permission check: admin+ only (unless kicking self)
      if (targetUserId !== userId) {
        const actor = await getParticipant(id, userId);
        if (!actor || ROLE_HIERARCHY[actor.role] < ROLE_HIERARCHY['admin' as RoomRole]) {
          return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
        }
        const target = await getParticipant(id, targetUserId);
        if (target && ROLE_HIERARCHY[target.role] >= ROLE_HIERARCHY[actor.role]) {
          return NextResponse.json({ error: 'لا يمكنك إنزال هذا المستخدم' }, { status: 403 });
        }
      }
      const ok = await kickFromMic(id, targetUserId, userId);
      return NextResponse.json({ success: true });
    }

    if (action === 'kick-from-room') {
      const { targetUserId, durationMinutes } = await request.json();
      if (!targetUserId) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
      // Permission check: admin+ only
      const actor = await getParticipant(id, userId);
      if (!actor || ROLE_HIERARCHY[actor.role] < ROLE_HIERARCHY['admin' as RoomRole]) {
        return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
      }
      const target = await getParticipant(id, targetUserId);
      if (target && ROLE_HIERARCHY[target.role] >= ROLE_HIERARCHY[actor.role]) {
        return NextResponse.json({ error: 'لا يمكنك طرد هذا المستخدم' }, { status: 403 });
      }
      if (durationMinutes && durationMinutes > 0) {
        const ok = await kickFromRoomTimed(id, targetUserId, userId, durationMinutes);
        return NextResponse.json({ success: ok });
      }
      const ok = await kickFromRoom(id, targetUserId, userId);
      if (!ok) return NextResponse.json({ error: 'فشل طرده من الغرفة' }, { status: 403 });
      return NextResponse.json({ success: true });
    }
    if (action === 'save-template') {
      const body = await request.json();
      const tpl = await saveRoomTemplate({ userId, ...body });
      return NextResponse.json({ success: true, template: tpl });
    }

    if (action === 'freeze-seat') {
      const { targetUserId } = await request.json();
      if (!targetUserId) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
      // Permission check: coowner+ only
      const actor = await getParticipant(id, userId);
      if (!actor || ROLE_HIERARCHY[actor.role] < ROLE_HIERARCHY['coowner' as RoomRole]) {
        return NextResponse.json({ error: 'صلاحيات غير كافية - مالك أو نائب فقط' }, { status: 403 });
      }
      const ok = await freezeSeat(id, targetUserId, userId);
      if (!ok) return NextResponse.json({ error: 'فشل تجميد المايك' }, { status: 403 });
      return NextResponse.json({ success: true });
    }

    if (action === 'unfreeze-seat') {
      const { targetUserId } = await request.json();
      if (!targetUserId) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
      // Permission check: coowner+ only
      const actor = await getParticipant(id, userId);
      if (!actor || ROLE_HIERARCHY[actor.role] < ROLE_HIERARCHY['coowner' as RoomRole]) {
        return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
      }
      const ok = await unfreezeSeat(id, targetUserId);
      return NextResponse.json({ success: ok });
    }

    if (action === 'assign-seat') {
      const { targetUserId, seatIndex } = await request.json();
      if (targetUserId === undefined || seatIndex === undefined) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
      // Permission check: admin+ only
      const actor = await getParticipant(id, userId);
      if (!actor || ROLE_HIERARCHY[actor.role] < ROLE_HIERARCHY['admin' as RoomRole]) {
        return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
      }
      const ok = await assignSeat(id, targetUserId, seatIndex, userId);
      if (!ok) return NextResponse.json({ error: 'فشل تعيين المقعد' }, { status: 403 });
      return NextResponse.json({ success: true });
    }

    if (action === 'approve-waitlist') {
      const { waitlistId } = await request.json();
      if (!waitlistId) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
      const ok = await approveWaitlist(waitlistId, userId);
      if (!ok) return NextResponse.json({ error: 'فشل الموافقة - لا توجد مقاعد متاحة' }, { status: 403 });
      return NextResponse.json({ success: true });
    }

    if (action === 'reject-waitlist') {
      const { waitlistId } = await request.json();
      if (!waitlistId) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
      const ok = await rejectWaitlist(waitlistId, userId);
      return NextResponse.json({ success: ok });
    }

    if (action === 'invite-to-mic') {
      const { targetUserId, seatIndex } = await request.json();
      if (!targetUserId || seatIndex === undefined) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
      const ok = await inviteToMic(id, targetUserId, Number(seatIndex), userId);
      if (!ok) return NextResponse.json({ error: 'فشل إرسال الدعوة' }, { status: 403 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  } catch (e) {
    console.error('[VR ID POST]', e);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await getPayload(request);
    if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const { id } = await params;
    const ok = await deleteVoiceRoom(id, p.userId as string);
    return NextResponse.json({ success: ok });
  } catch (e) {
    console.error('[VR ID DELETE]', e);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
