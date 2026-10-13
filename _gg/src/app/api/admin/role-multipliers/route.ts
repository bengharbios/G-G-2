import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/admin-auth';
import { getAllRoleMultipliers, updateRoleMultiplier, createRoleMultiplier } from '@/lib/admin-db';

export const runtime = 'nodejs';

// GET: كل أدوار المكافآت
export async function GET(request: NextRequest) {
  try {
    const { authorized } = await getAdminFromRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const roles = await getAllRoleMultipliers();
    return NextResponse.json({ success: true, roles });
  } catch (err) {
    return NextResponse.json({ error: String(err), success: false }, { status: 500 });
  }
}

// PUT: تحديث مضاعف دور
export async function PUT(request: NextRequest) {
  try {
    const { authorized } = await getAdminFromRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const body = await request.json();
    const { roleKey, roleName, xpMultiplier, goldMultiplier, description, isActive } = body;
    if (!roleKey) {
      return NextResponse.json({ error: 'roleKey مطلوب' }, { status: 400 });
    }
    const updated = await updateRoleMultiplier(String(roleKey), {
      roleName: roleName !== undefined ? String(roleName) : undefined,
      xpMultiplier: xpMultiplier !== undefined ? Number(xpMultiplier) : undefined,
      goldMultiplier: goldMultiplier !== undefined ? Number(goldMultiplier) : undefined,
      description: description !== undefined ? String(description) : undefined,
      isActive: isActive !== undefined ? !!isActive : undefined,
    });
    return NextResponse.json({ success: true, role: updated });
  } catch (err) {
    return NextResponse.json({ error: String(err), success: false }, { status: 500 });
  }
}

// POST: إنشاء دور جديد
export async function POST(request: NextRequest) {
  try {
    const { authorized } = await getAdminFromRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
    const body = await request.json();
    const { roleKey, roleName, xpMultiplier, goldMultiplier, description } = body;
    if (!roleKey || !roleName) {
      return NextResponse.json({ error: 'roleKey و roleName مطلوبان' }, { status: 400 });
    }
    const created = await createRoleMultiplier({
      roleKey: String(roleKey),
      roleName: String(roleName),
      xpMultiplier: xpMultiplier !== undefined ? Number(xpMultiplier) : 1.0,
      goldMultiplier: goldMultiplier !== undefined ? Number(goldMultiplier) : 1.0,
      description: description ? String(description) : '',
    });
    return NextResponse.json({ success: true, role: created });
  } catch (err) {
    return NextResponse.json({ error: String(err), success: false }, { status: 500 });
  }
}
