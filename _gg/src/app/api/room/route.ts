import { NextRequest, NextResponse } from 'next/server';
import * as turso from '@/lib/turso';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hostName, playerCount, gameType } = body;

    if (!hostName || typeof hostName !== 'string' || hostName.trim().length === 0) {
      return NextResponse.json(
        { error: 'يجب إدخال اسم العراب' },
        { status: 400 }
      );
    }

    const count = playerCount || 14;
    if (count < 6 || count > 20) {
      return NextResponse.json(
        { error: 'عدد اللاعبين يجب أن يكون بين 6 و 20' },
        { status: 400 }
      );
    }

    // Generate unique code
    let code = generateCode();
    let attempts = 0;
    while (await turso.getRoomByCode(code) && attempts < 10) {
      code = generateCode();
      attempts++;
    }

    if (attempts >= 10) {
      return NextResponse.json(
        { error: 'تعذر إنشاء كود فريد، حاول مرة أخرى' },
        { status: 500 }
      );
    }

    const room = await turso.createRoom({
      id: turso.generateId(),
      code,
      hostName: hostName.trim(),
      playerCount: count,
      phase: 'waiting',
      stateJson: '{}',
      gameType: gameType || null,
    });

    return NextResponse.json({ room, code });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الغرفة' },
      { status: 500 }
    );
  }
}
