'use client';

import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

/**
 * useGameReward — Hook مساعد لطلب مكافأة من الخادم بعد play/win/loss/achievement
 *
 * الاستخدام:
 *   const { award, loading } = useGameReward();
 *   await award('mafia', 'win', 8);  // فوز بـ mafia مع 8 لاعبين
 *
 * Returns:
 *   { award, loading, lastReward }
 *
 * award(gameSlug, outcome, playerCount) يرجع:
 *   { success, xpAwarded, goldAwarded, newLevel, leveledUp, newGoldBalance, reason }
 */
export function useGameReward() {
  const [loading, setLoading] = useState(false);
  const [lastReward, setLastReward] = useState<{
    success: boolean;
    xpAwarded: number;
    goldAwarded: number;
    newLevel: number;
    leveledUp: boolean;
    newGoldBalance: number;
    reason: string;
  } | null>(null);
  const { toast } = useToast();

  const award = useCallback(async (
    gameSlug: string,
    outcome: 'play' | 'win' | 'loss' | 'achievement',
    playerCount: number = 1
  ) => {
    setLoading(true);
    try {
      const res = await fetch('/api/game/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameSlug, outcome, playerCount }),
      });
      const data = await res.json();
      setLastReward(data);

      if (data.success) {
        // عرض Toast للمكافأة
        if (outcome === 'win') {
          toast({
            title: '🎉 فوز!',
            description: `+${data.goldAwarded} ذهب • +${data.xpAwarded} XP`,
            duration: 4000,
          });
        } else if (outcome === 'achievement') {
          toast({
            title: '🏆 إنجاز جديد!',
            description: `+${data.goldAwarded} ذهب • +${data.xpAwarded} XP`,
            duration: 4000,
          });
        }
        // ترقية المستوى
        if (data.leveledUp) {
          toast({
            title: '⭐ مستوى جديد!',
            description: `وصلت للمستوى ${data.newLevel}`,
            duration: 5000,
          });
        }
      } else {
        // عرض سبب الفشل فقط لو كان مهماً
        if (data.reason === 'config_not_found' || data.reason === 'disabled') {
          // لا تعرض Toast — تجاهل بصمت
          // console.log('[useGameReward] no config/disabled:', data.reason);
        } else if (data.reason === 'daily_limit_reached') {
          toast({
            title: '⚠️ الحد اليومي',
            description: 'لقد وصلت للحد اليومي من المكافآت',
            variant: 'destructive',
            duration: 3000,
          });
        } else if (data.reason === 'not_logged_in') {
          // لا تعرض Toast — يتسجيل دخول لاحقاً
        }
      }
      return data;
    } catch (err) {
      console.error('[useGameReward] error:', err);
      return {
        success: false,
        xpAwarded: 0,
        goldAwarded: 0,
        newLevel: 0,
        leveledUp: false,
        newGoldBalance: 0,
        reason: 'network_error',
      };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { award, loading, lastReward };
}
