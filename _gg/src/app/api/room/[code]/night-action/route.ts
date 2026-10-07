import { NextRequest, NextResponse } from 'next/server';
import * as turso from '@/lib/turso';

// Map: night phase → required role
const PHASE_ROLE_MAP: Record<string, string> = {
  night_boss_kill: 'mafia_boss',
  night_silencer: 'mafia_silencer',
  night_medic: 'medic',
  night_sniper: 'sniper',
};

// Map: role → action type
const ROLE_ACTION_MAP: Record<string, string> = {
  mafia_boss: 'boss_kill',
  mafia_silencer: 'silencer',
  medic: 'medic_save',
  sniper: 'sniper_shoot',
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { playerId, playerName, actionType, targetName } = body;

    if ((!playerId && !playerName) || !actionType) {
      return NextResponse.json(
        { error: 'يجب تحديد اللاعب ونوع الفعل' },
        { status: 400 }
      );
    }

    // For sniper_shoot and medic_save, targetName is required
    // For sniper_hold, targetName is null
    if (actionType !== 'sniper_hold' && !targetName) {
      return NextResponse.json(
        { error: 'يجب تحديد الهدف' },
        { status: 400 }
      );
    }

    const room = await turso.getRoomWithPlayers(code.toUpperCase());

    if (!room) {
      return NextResponse.json(
        { error: 'الغرفة غير موجودة' },
        { status: 404 }
      );
    }

    // Find the acting player by ID or name
    let actingPlayer = playerId
      ? room.players.find((p) => p.id === playerId)
      : room.players.find((p) => p.name === playerName);
    if (!actingPlayer) {
      return NextResponse.json(
        { error: 'اللاعب غير موجود في الغرفة' },
        { status: 404 }
      );
    }

    if (!actingPlayer.isAlive) {
      return NextResponse.json(
        { error: 'يجب أن تكون حياً للقيام بهذا الفعل' },
        { status: 400 }
      );
    }

    // Validate the player has the correct role for this action
    const requiredRole = Object.entries(ROLE_ACTION_MAP).find(
      ([, action]) => action === actionType
    )?.[0];

    if (requiredRole && actingPlayer.role !== requiredRole) {
      return NextResponse.json(
        { error: 'ليس لديك الدور المناسب لهذا الفعل' },
        { status: 400 }
      );
    }

    // Validate the action matches the current phase
    const currentPhase = room.phase;
    const expectedPhase = Object.entries(PHASE_ROLE_MAP).find(
      ([, role]) => role === actingPlayer.role
    )?.[0];

    // Allow the action if the phase matches OR if we're in the right phase for this action type
    if (expectedPhase && currentPhase !== expectedPhase) {
      return NextResponse.json(
        { error: 'ليس الوقت المناسب لهذا الفعل' },
        { status: 400 }
      );
    }

    // Validate target if provided
    if (targetName && actionType !== 'sniper_hold') {
      const targetPlayer = room.players.find((p) => p.name === targetName);
      if (!targetPlayer) {
        return NextResponse.json(
          { error: 'اللاعب المستهدف غير موجود' },
          { status: 400 }
        );
      }

      if (!targetPlayer.isAlive) {
        return NextResponse.json(
          { error: 'لا يمكنك اختيار لاعب ميت!' },
          { status: 400 }
        );
      }

      // Can't target yourself (except medic can "save" anyone)
      if (actingPlayer.id === targetPlayer.id && actionType !== 'medic_save') {
        return NextResponse.json(
          { error: 'لا يمكنك اختيار نفسك!' },
          { status: 400 }
        );
      }

      // Boss can't target mafia members
      if (actionType === 'boss_kill') {
        const targetRole = targetPlayer.role;
        if (
          targetRole === 'mafia_boss' ||
          targetRole === 'mafia_silencer' ||
          targetRole === 'mafia_regular'
        ) {
          return NextResponse.json(
            { error: 'لا يمكنك اختيار عضو من المافيا!' },
            { status: 400 }
          );
        }
      }

      // Silencer can't target themselves
      if (actionType === 'silencer' && actingPlayer.id === targetPlayer.id) {
        return NextResponse.json(
          { error: 'لا يمكنك تسكيت نفسك!' },
          { status: 400 }
        );
      }

      // Sniper can't target themselves
      if (actionType === 'sniper_shoot' && actingPlayer.id === targetPlayer.id) {
        return NextResponse.json(
          { error: 'لا يمكنك إطلاق النار على نفسك!' },
          { status: 400 }
        );
      }
    }

    // Update the player's night action (use actingPlayer.id which works for both playerId and playerName lookups)
    await turso.updatePlayer(actingPlayer.id, {
      nightActionTarget: actionType === 'sniper_hold' ? null : targetName || null,
      nightActionType: actionType,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting night action:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تنفيذ الفعل' },
      { status: 500 }
    );
  }
}
