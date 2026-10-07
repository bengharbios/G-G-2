import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import {
  getParticipant, getWaitlist, requestSeat,
  approveWaitlist, rejectWaitlist, ROLE_HIERARCHY,
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
    const p = await getPayload(request);
    if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    const userId = p.userId as string;

    // Only admin+ can view waitlist
    const actor = await getParticipant(id, userId);
    if (!actor) return NextResponse.json({ error: 'لست في الغرفة' }, { status: 403 });
    if (ROLE_HIERARCHY[actor.role] < ROLE_HIERARCHY.admin) {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
    }

    const waitlist = await getWaitlist(id);
    return NextResponse.json({ success: true, waitlist });
  } catch (e) {
    console.error('[VR WAITLIST GET]', e);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await getPayload(request);
    if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    const userId = p.userId as string;
    const body = await request.json();
    const { action } = body;

    // ─── Add to waitlist / request seat ───
    if (!action) {
      const participant = await getParticipant(id, userId);
      if (!participant) return NextResponse.json({ error: 'لست في الغرفة' }, { status: 403 });

      const result = await requestSeat(
        id, userId,
        participant.username, participant.displayName, participant.avatar,
        participant.vipLevel,
        body.requestedSeat !== undefined ? Number(body.requestedSeat) : -1,
      );

      if (!result.success) return NextResponse.json({ error: 'لا يمكنك طلب مقعد الآن' }, { status: 400 });
      return NextResponse.json({
        success: true,
        autoAssigned: result.autoAssigned || false,
        seatIndex: result.seatIndex,
      });
    }

    // ─── approve waitlist: admin+ ───
    if (action === 'approve') {
      const actor = await getParticipant(id, userId);
      if (!actor) return NextResponse.json({ error: 'لست في الغرفة' }, { status: 403 });
      if (ROLE_HIERARCHY[actor.role] < ROLE_HIERARCHY.admin) {
        return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
      }
      const { waitlistId } = body;
      if (!waitlistId) return NextResponse.json({ error: 'معرف الطلب مطلوب' }, { status: 400 });
      const ok = await approveWaitlist(waitlistId, userId);
      if (!ok) return NextResponse.json({ error: 'فشل الموافقة' }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    // ─── reject waitlist: admin+ ───
    if (action === 'reject') {
      const actor = await getParticipant(id, userId);
      if (!actor) return NextResponse.json({ error: 'لست في الغرفة' }, { status: 403 });
      if (ROLE_HIERARCHY[actor.role] < ROLE_HIERARCHY.admin) {
        return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
      }
      const { waitlistId } = body;
      if (!waitlistId) return NextResponse.json({ error: 'معرف الطلب مطلوب' }, { status: 400 });
      const ok = await rejectWaitlist(waitlistId, userId);
      if (!ok) return NextResponse.json({ error: 'فشل الرفض' }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (e) {
    console.error('[VR WAITLIST POST]', e);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await getPayload(request);
    if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    const userId = p.userId as string;

    // Remove own waitlist request
    const { searchParams } = new URL(request.url);
    const waitlistId = searchParams.get('waitlistId');
    if (!waitlistId) return NextResponse.json({ error: 'معرف الطلب مطلوب' }, { status: 400 });

    // Verify the waitlist entry belongs to this user
    const waitlist = await getWaitlist(id);
    const entry = waitlist.find(w => w.id === waitlistId);
    if (!entry || entry.userId !== userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // Import not exported directly, use raw query approach - but we have it
    // Use the pattern from rejectWaitlist
    const { rejectWaitlist } = await import('@/lib/admin-db');
    const ok = await rejectWaitlist(waitlistId, userId);
    return NextResponse.json({ success: ok });
  } catch (e) {
    console.error('[VR WAITLIST DELETE]', e);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
