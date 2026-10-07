import { NextRequest, NextResponse } from 'next/server';
import { createUserReport, blockUser, unblockUser, isUserBlocked, getBlockedUserIds } from '@/lib/admin-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'report') {
      const { reporterId, reportedUserId, reason, category, roomId } = body;
      if (!reporterId || !reportedUserId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      await createUserReport(reporterId, reportedUserId, reason || '', category || 'other', roomId || '');
      return NextResponse.json({ success: true });
    }

    if (action === 'block') {
      const { blockerId, blockedId } = body;
      if (!blockerId || !blockedId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      await blockUser(blockerId, blockedId);
      return NextResponse.json({ success: true });
    }

    if (action === 'unblock') {
      const { blockerId, blockedId } = body;
      if (!blockerId || !blockedId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      await unblockUser(blockerId, blockedId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const targetId = searchParams.get('targetId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (targetId) {
      const blocked = await isUserBlocked(userId, targetId);
      return NextResponse.json({ blocked });
    }

    const blockedIds = await getBlockedUserIds(userId);
    return NextResponse.json({ blockedIds });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
