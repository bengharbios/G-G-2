import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getBackgroundsAvailableToUser, purchaseRoomBackground } from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'gg-platform-secret-key-2024');

async function getUser(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { const { payload } = await jwtVerify(token, JWT_SECRET); return payload; }
  catch { return null; }
}

// Get backgrounds available to the user (free + purchased)
export async function GET(request: NextRequest) {
  try {
    const p = await getUser(request);
    if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const userId = p.userId as string;
    const backgrounds = await getBackgroundsAvailableToUser(userId);
    return NextResponse.json({ success: true, backgrounds });
  } catch (error) {
    console.error('Get room backgrounds error:', error);
    return NextResponse.json({ error: 'فشل في تحميل الخلفيات' }, { status: 500 });
  }
}

// Purchase a background
export async function POST(request: NextRequest) {
  try {
    const p = await getUser(request);
    if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const userId = p.userId as string;
    const { backgroundId } = await request.json();
    if (!backgroundId) return NextResponse.json({ error: 'معرف الخلفية مطلوب' }, { status: 400 });
    const result = await purchaseRoomBackground(userId, backgroundId);
    if (result.success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  } catch (error) {
    console.error('Purchase background error:', error);
    return NextResponse.json({ error: 'فشل في شراء الخلفية' }, { status: 500 });
  }
}
