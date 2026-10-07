import { NextRequest, NextResponse } from 'next/server';
import { addRoomBookmark, removeRoomBookmark, getUserBookmarks, isRoomBookmarked } from '@/lib/admin-db';

export async function POST(req: NextRequest) {
  try {
    const { userId, roomId, roomName } = await req.json();
    if (!userId || !roomId) {
      return NextResponse.json({ error: 'Missing userId or roomId' }, { status: 400 });
    }
    await addRoomBookmark(userId, roomId, roomName || '');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add bookmark' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId, roomId } = await req.json();
    if (!userId || !roomId) {
      return NextResponse.json({ error: 'Missing userId or roomId' }, { status: 400 });
    }
    await removeRoomBookmark(userId, roomId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to remove bookmark' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const roomId = searchParams.get('roomId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (roomId) {
      const bookmarked = await isRoomBookmarked(userId, roomId);
      return NextResponse.json({ bookmarked });
    }

    const bookmarks = await getUserBookmarks(userId);
    return NextResponse.json({ bookmarks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to get bookmarks' }, { status: 500 });
  }
}
