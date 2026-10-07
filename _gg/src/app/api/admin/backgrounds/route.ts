import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/admin-auth';
import { getAllRoomBackgrounds, createRoomBackground, updateRoomBackground, deleteRoomBackground, grantRoomBackground } from '@/lib/admin-db';

async function verifyAdminAuth(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return null;
  try {
    return await validateToken(token);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const backgrounds = await getAllRoomBackgrounds();
    return NextResponse.json({ success: true, backgrounds });
  } catch (error) {
    console.error('Get backgrounds error:', error);
    return NextResponse.json({ error: 'فشل في تحميل الخلفيات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const body = await request.json();
    if (!body.name || !body.nameAr || !body.imageUrl) {
      return NextResponse.json({ error: 'الاسم ورابط الصورة مطلوبان' }, { status: 400 });
    }
    const bg = await createRoomBackground(body);
    return NextResponse.json({ success: true, background: bg });
  } catch (error) {
    console.error('Create background error:', error);
    return NextResponse.json({ error: 'فشل في إنشاء الخلفية' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: 'معرف الخلفية مطلوب' }, { status: 400 });
    }
    const bg = await updateRoomBackground(id, data);
    if (!bg) {
      return NextResponse.json({ error: 'الخلفية غير موجودة' }, { status: 404 });
    }
    return NextResponse.json({ success: true, background: bg });
  } catch (error) {
    console.error('Update background error:', error);
    return NextResponse.json({ error: 'فشل في تحديث الخلفية' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'معرف الخلفية مطلوب' }, { status: 400 });
    }
    await deleteRoomBackground(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete background error:', error);
    return NextResponse.json({ error: 'فشل في حذف الخلفية' }, { status: 500 });
  }
}
