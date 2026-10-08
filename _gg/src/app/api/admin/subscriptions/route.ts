import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/admin-auth';
import {
  getAllSubscriptions,
  createSubscriber,
  updateSubscriber,
  deleteSubscriber,
  getUserById,
  linkUserToSubscription,
} from '@/lib/admin-db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const user = await validateToken(token);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const subscriptions = await getAllSubscriptions();
    return NextResponse.json({ subscriptions });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const user = await validateToken(token);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, telegram, plan, allowedGames, startDate, endDate, userId } = body;

    // إذا اختير مستخدم موجود، نجلب بياناته ونعبئ الاسم والبريد منه
    let linkedUser: Awaited<ReturnType<typeof getUserById>> = null;
    if (userId) {
      linkedUser = await getUserById(String(userId));
      if (!linkedUser) {
        return NextResponse.json({ error: 'المستخدم المحدد غير موجود' }, { status: 404 });
      }
    }

    const finalName = linkedUser ? linkedUser.displayName || linkedUser.username : name;
    const finalEmail = linkedUser ? linkedUser.email : email;

    if (!finalEmail || !finalName) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني والاسم مطلوبان' },
        { status: 400 }
      );
    }

    const subscription = await createSubscriber({
      name: finalName,
      email: finalEmail,
      phone: phone || linkedUser?.phone || '',
      telegram: telegram || '',
      plan: plan || 'free',
      allowedGames: allowedGames || [],
      startDate,
      endDate,
    });

    // اربط الاشتراك بالمستخدم المختار (إن وُجد)
    if (linkedUser) {
      await linkUserToSubscription(linkedUser.id, subscription.id);
    }

    return NextResponse.json({ subscription }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const user = await validateToken(token);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'معرف الاشتراك مطلوب' }, { status: 400 });
    }

    const subscription = await updateSubscriber(id, data);
    if (!subscription) {
      return NextResponse.json({ error: 'الاشتراك غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ subscription });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const user = await validateToken(token);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'معرف الاشتراك مطلوب' }, { status: 400 });
    }

    await deleteSubscriber(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
