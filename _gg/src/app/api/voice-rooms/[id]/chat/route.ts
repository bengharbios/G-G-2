import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { chatStore } from '@/lib/chat-store';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'gg-platform-secret-key-2024');

async function getPayload(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { const { payload } = await jwtVerify(token, JWT_SECRET); return payload; }
  catch { return null; }
}

/* GET — fetch messages, optionally after a timestamp */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const after = request.nextUrl.searchParams.get('after');
    const messages = chatStore.getMessages(id, after ? Number(after) : undefined);
    return NextResponse.json({ success: true, messages });
  } catch (e) {
    console.error('[Chat GET]', e);
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}

/* POST — send a message */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await getPayload(request);
    if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    const { text, displayName, avatar, isSystem, isGift } = await request.json();

    if (!text?.trim()) return NextResponse.json({ error: 'الرسالة فارغة' }, { status: 400 });

    const msg = chatStore.addMessage({
      id: Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
      roomId: id,
      userId: p.userId as string,
      displayName: displayName || (p as Record<string, unknown>).username as string || 'مجهول',
      avatar: avatar || '',
      text: text.trim().slice(0, 500),
      timestamp: Date.now(),
      isSystem: !!isSystem,
      isGift: !!isGift,
    });

    return NextResponse.json({ success: true, message: msg });
  } catch (e) {
    console.error('[Chat POST]', e);
    return NextResponse.json({ error: 'خطأ' }, { status: 500 });
  }
}
