import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { getAllEvents, createEvent, generateId } from '@/lib/turso';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAdminFromRequest(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const events = await getAllEvents();
    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAdminFromRequest(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title, description, type, rewardType,
      rewardAmount, rewardBadge, isActive,
      startsAt, endsAt, imageUrl,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'العنوان مطلوب' },
        { status: 400 }
      );
    }

    const event = await createEvent({
      id: generateId(),
      title,
      description: description || '',
      type: type || 'permanent',
      rewardType: rewardType || 'gems',
      rewardAmount: rewardAmount || 0,
      rewardBadge: rewardBadge || null,
      isActive: isActive !== false,
      startsAt: startsAt || null,
      endsAt: endsAt || null,
      imageUrl: imageUrl || null,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
