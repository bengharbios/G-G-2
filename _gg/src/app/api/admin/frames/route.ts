import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/admin-auth';
import { getAllFrames, createFrame, updateFrame, deleteFrame } from '@/lib/admin-db';

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
    const frames = await getAllFrames();
    return NextResponse.json({ success: true, frames });
  } catch (error) {
    console.error('Get frames error:', error);
    return NextResponse.json({ error: 'فشل في تحميل الإطارات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const body = await request.json();
    if (!body.name || !body.nameAr) {
      return NextResponse.json({ error: 'اسم الإطار مطلوب' }, { status: 400 });
    }
    const frame = await createFrame(body);
    return NextResponse.json({ success: true, frame });
  } catch (error) {
    console.error('Create frame error:', error);
    return NextResponse.json({ error: 'فشل في إنشاء الإطار' }, { status: 500 });
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
      return NextResponse.json({ error: 'معرف الإطار مطلوب' }, { status: 400 });
    }
    const frame = await updateFrame(id, data);
    if (!frame) {
      return NextResponse.json({ error: 'الإطار غير موجود' }, { status: 404 });
    }
    return NextResponse.json({ success: true, frame });
  } catch (error) {
    console.error('Update frame error:', error);
    return NextResponse.json({ error: 'فشل في تحديث الإطار' }, { status: 500 });
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
      return NextResponse.json({ error: 'معرف الإطار مطلوب' }, { status: 400 });
    }
    await deleteFrame(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete frame error:', error);
    return NextResponse.json({ error: 'فشل في حذف الإطار' }, { status: 500 });
  }
}
