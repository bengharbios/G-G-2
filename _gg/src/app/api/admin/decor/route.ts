import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/admin-auth';
import { getAllDecorItems, createDecorItem, updateDecorItem, deleteDecorItem, type DecorKind } from '@/lib/admin-db';

async function verifyAdminAuth(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) return null;
  try {
    return await validateToken(token);
  } catch {
    return null;
  }
}

const VALID_KINDS: DecorKind[] = ['ornament', 'theme', 'card'];

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const items = await getAllDecorItems();
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get('kind');
    return NextResponse.json({
      success: true,
      items: kind ? items.filter((i) => i.kind === kind) : items,
    });
  } catch (error) {
    console.error('Get decor error:', error);
    return NextResponse.json({ error: 'فشل تحميل عناصر الزينة' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const body = await request.json();
    const { kind, nameAr, imageUrl, rarity, price, isFree, sortOrder } = body;
    if (!nameAr || !VALID_KINDS.includes(kind as DecorKind)) {
      return NextResponse.json({ error: 'اسم العنصر والنوع مطلوبان' }, { status: 400 });
    }
    const item = await createDecorItem({
      kind: kind as DecorKind,
      nameAr: String(nameAr).trim(),
      imageUrl: String(imageUrl ?? '').trim(),
      rarity: rarity ?? 'common',
      price: Number(price) || 0,
      isFree: !!isFree,
      sortOrder: Number(sortOrder) || 0,
    });
    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('Create decor error:', error);
    return NextResponse.json({ error: 'فشل إنشاء العنصر' }, { status: 500 });
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
      return NextResponse.json({ error: 'معرف العنصر مطلوب' }, { status: 400 });
    }
    const item = await updateDecorItem(String(id), data);
    if (!item) {
      return NextResponse.json({ error: 'العنصر غير موجود' }, { status: 404 });
    }
    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('Update decor error:', error);
    return NextResponse.json({ error: 'فشل تحديث العنصر' }, { status: 500 });
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
      return NextResponse.json({ error: 'معرف العنصر مطلوب' }, { status: 400 });
    }
    await deleteDecorItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete decor error:', error);
    return NextResponse.json({ error: 'فشل حذف العنصر' }, { status: 500 });
  }
}
