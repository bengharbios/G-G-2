import { NextRequest, NextResponse } from 'next/server';
import { submitAction, clearModal } from '@/lib/tobol-room-store';

// POST /api/tobol-room/[code]/action — Submit a button click action
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  try {
    const { playerId, btnId } = await request.json();
    if (!playerId || !btnId) {
      return NextResponse.json({ error: 'Missing playerId or btnId' }, { status: 400 });
    }

    const result = await submitAction(code, playerId, btnId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, room: result.room });
  } catch {
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}

// DELETE /api/tobol-room/[code]/action — Clear modal (close card)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  try {
    const room = await clearModal(code);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, room });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
