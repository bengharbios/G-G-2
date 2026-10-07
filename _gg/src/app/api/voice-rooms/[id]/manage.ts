import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import {
  getParticipant, ROLE_HIERARCHY, RoomRole,
  kickFromMic, kickFromRoom, banUserFromRoom, unbanUserFromRoom,
  freezeSeat, unfreezeSeat, muteUserChat, changeUserRole,
  transferOwnership, assignSeat, setSeatStatus, SeatStatus,
} from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'gg-platform-secret-key-2024');

async function getPayload(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { const { payload } = await jwtVerify(token, JWT_SECRET); return payload; }
  catch { return null; }
}

// Helper: check if actor has minimum required role level
function hasMinRole(actorRole: RoomRole, minRole: RoomRole): boolean {
  return ROLE_HIERARCHY[actorRole] >= ROLE_HIERARCHY[minRole];
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await getPayload(request);
    if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    const userId = p.userId as string;
    const body = await request.json();
    const { action } = body;

    if (!action) return NextResponse.json({ error: 'الإجراء مطلوب' }, { status: 400 });

    // Get actor's participant info for permission checks
    const actor = await getParticipant(id, userId);
    if (!actor) return NextResponse.json({ error: 'لست في الغرفة' }, { status: 403 });
    const actorRole = actor.role;

    // ─── kick-from-mic: admin+ ───
    if (action === 'kick-from-mic') {
      if (!hasMinRole(actorRole, 'admin')) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
      const { targetUserId } = body;
      if (!targetUserId) return NextResponse.json({ error: 'المستخدم مطلوب' }, { status: 400 });
      // Cannot kick someone with higher role
      const target = await getParticipant(id, targetUserId);
      if (target && ROLE_HIERARCHY[target.role] >= ROLE_HIERARCHY[actorRole]) {
        return NextResponse.json({ error: 'لا يمكنك طرد هذا المستخدم' }, { status: 403 });
      }
      const ok = await kickFromMic(id, targetUserId, userId);
      return NextResponse.json({ success: ok });
    }

    // ─── kick-from-room: admin+ ───
    if (action === 'kick-from-room') {
      if (!hasMinRole(actorRole, 'admin')) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
      const { targetUserId } = body;
      if (!targetUserId) return NextResponse.json({ error: 'المستخدم مطلوب' }, { status: 400 });
      const target = await getParticipant(id, targetUserId);
      if (target && ROLE_HIERARCHY[target.role] >= ROLE_HIERARCHY[actorRole]) {
        return NextResponse.json({ error: 'لا يمكنك طرد هذا المستخدم' }, { status: 403 });
      }
      const ok = await kickFromRoom(id, targetUserId, userId);
      return NextResponse.json({ success: ok });
    }

    // ─── ban: admin+ ───
    if (action === 'ban') {
      if (!hasMinRole(actorRole, 'admin')) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
      const { targetUserId, reason } = body;
      if (!targetUserId) return NextResponse.json({ error: 'المستخدم مطلوب' }, { status: 400 });
      const target = await getParticipant(id, targetUserId);
      if (target && ROLE_HIERARCHY[target.role] >= ROLE_HIERARCHY[actorRole]) {
        return NextResponse.json({ error: 'لا يمكنك حظر هذا المستخدم' }, { status: 403 });
      }
      const ok = await banUserFromRoom(id, targetUserId, userId, reason || '');
      return NextResponse.json({ success: ok });
    }

    // ─── unban: admin+ ───
    if (action === 'unban') {
      if (!hasMinRole(actorRole, 'admin')) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
      const { targetUserId } = body;
      if (!targetUserId) return NextResponse.json({ error: 'المستخدم مطلوب' }, { status: 400 });
      const ok = await unbanUserFromRoom(id, targetUserId);
      return NextResponse.json({ success: ok });
    }

    // ─── freeze: coowner+ ───
    if (action === 'freeze') {
      if (!hasMinRole(actorRole, 'coowner')) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
      const { targetUserId } = body;
      if (!targetUserId) return NextResponse.json({ error: 'المستخدم مطلوب' }, { status: 400 });
      const target = await getParticipant(id, targetUserId);
      if (target && ROLE_HIERARCHY[target.role] >= ROLE_HIERARCHY[actorRole]) {
        return NextResponse.json({ error: 'لا يمكنك تجميد هذا المستخدم' }, { status: 403 });
      }
      const ok = await freezeSeat(id, targetUserId, userId);
      return NextResponse.json({ success: ok });
    }

    // ─── unfreeze: coowner+ ───
    if (action === 'unfreeze') {
      if (!hasMinRole(actorRole, 'coowner')) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
      const { targetUserId } = body;
      if (!targetUserId) return NextResponse.json({ error: 'المستخدم مطلوب' }, { status: 400 });
      const ok = await unfreezeSeat(id, targetUserId);
      return NextResponse.json({ success: ok });
    }

    // ─── mute-chat: admin+ ───
    if (action === 'mute-chat') {
      if (!hasMinRole(actorRole, 'admin')) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
      const { targetUserId } = body;
      if (!targetUserId) return NextResponse.json({ error: 'المستخدم مطلوب' }, { status: 400 });
      const target = await getParticipant(id, targetUserId);
      if (target && ROLE_HIERARCHY[target.role] >= ROLE_HIERARCHY[actorRole]) {
        return NextResponse.json({ error: 'لا يمكنك كتم هذا المستخدم' }, { status: 403 });
      }
      const ok = await muteUserChat(id, targetUserId, userId);
      return NextResponse.json({ success: ok });
    }

    // ─── change-role: role hierarchy checks ───
    if (action === 'change-role') {
      const { targetUserId, role: newRole } = body;
      if (!targetUserId || !newRole) return NextResponse.json({ error: 'البيانات مطلوبة' }, { status: 400 });
      const ok = await changeUserRole(id, targetUserId, newRole as RoomRole, userId);
      if (!ok) return NextResponse.json({ error: 'صلاحيات غير كافية أو طلب غير صالح' }, { status: 403 });
      return NextResponse.json({ success: true });
    }

    // ─── transfer: owner only ───
    if (action === 'transfer') {
      if (actorRole !== 'owner') return NextResponse.json({ error: 'المالك فقط يستطيع نقل الملكية' }, { status: 403 });
      const { targetUserId } = body;
      if (!targetUserId) return NextResponse.json({ error: 'المستخدم مطلوب' }, { status: 400 });
      const ok = await transferOwnership(id, targetUserId, userId);
      if (!ok) return NextResponse.json({ error: 'فشل نقل الملكية' }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    // ─── assign-seat: admin+ ───
    if (action === 'assign-seat') {
      if (!hasMinRole(actorRole, 'admin')) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
      const { targetUserId, seatIndex } = body;
      if (targetUserId === undefined || seatIndex === undefined) return NextResponse.json({ error: 'البيانات مطلوبة' }, { status: 400 });
      const ok = await assignSeat(id, targetUserId, Number(seatIndex), userId);
      return NextResponse.json({ success: ok });
    }

    // ─── set-seat-status: admin+ ───
    if (action === 'set-seat-status') {
      if (!hasMinRole(actorRole, 'admin')) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
      const { seatIndex, status } = body;
      if (seatIndex === undefined || !status) return NextResponse.json({ error: 'البيانات مطلوبة' }, { status: 400 });
      const ok = await setSeatStatus(id, Number(seatIndex), status as SeatStatus, userId);
      return NextResponse.json({ success: ok });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (e) {
    console.error('[VR MANAGE]', e);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
