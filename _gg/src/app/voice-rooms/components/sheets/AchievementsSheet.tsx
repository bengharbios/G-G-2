'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Lock } from 'lucide-react';
import BottomSheetOverlay from '../shared/BottomSheetOverlay';
import { TUI } from '../../types';

/* ═══════════════════════════════════════════════════════════════════════
   AchievementsSheet — Bottom sheet showing user achievements grid
   ═══════════════════════════════════════════════════════════════════════ */

interface AchievementsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

// Achievement definitions matching admin-db.ts keys
const ACHIEVEMENTS: Array<{
  key: string;
  emoji: string;
  name: string;
  description: string;
}> = [
  { key: 'first_room', emoji: '🏠', name: 'أول غرفة', description: 'انضمام لأول غرفة صوتية' },
  { key: 'first_speak', emoji: '🎤', name: 'أول تكلم', description: 'التحدث لأول مرة في غرفة' },
  { key: 'rooms_10', emoji: '🏨', name: '10 غرف', description: 'زيارة 10 غرف صوتية' },
  { key: 'rooms_50', emoji: '🏙️', name: '50 غرفة', description: 'زيارة 50 غرفة صوتية' },
  { key: 'first_gift', emoji: '🎁', name: 'أول هدية', description: 'إرسال أول هدية' },
  { key: 'gifts_100', emoji: '💎', name: '100 هدية', description: 'إرسال 100 هدية' },
  { key: 'streak_3', emoji: '🔥', name: '3 أيام', description: 'دخول متتالي 3 أيام' },
  { key: 'streak_7', emoji: '⚡', name: '7 أيام', description: 'دخول متتالي 7 أيام' },
  { key: 'streak_30', emoji: '🌟', name: '30 يوم', description: 'دخول متتالي 30 يوم' },
  { key: 'host_5', emoji: '👑', name: '5 غرف كصاحب', description: 'إنشاء 5 غرف صوتية' },
  { key: 'host_50', emoji: '🏰', name: '50 غرفة كصاحب', description: 'إنشاء 50 غرفة صوتية' },
  { key: 'hours_10', emoji: '⏰', name: '10 ساعات', description: 'قضاء 10 ساعات في الغرف' },
];

export default function AchievementsSheet({ isOpen, onClose, userId }: AchievementsSheetProps) {
  const [achievements, setAchievements] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const loadAchievements = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/achievements?userId=${uid}`);
      const data = await res.json();
      if (data && typeof data === 'object') {
        const unlocked = data.achievements || data;
        setAchievements(typeof unlocked === 'object' ? unlocked : {});
      }
    } catch {
      // Silently fail — show all locked
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !userId) return;
    loadAchievements(userId);
  }, [isOpen, userId, loadAchievements]);

  const unlockedCount = Object.values(achievements).filter(Boolean).length;

  return (
    <BottomSheetOverlay
      isOpen={isOpen}
      onClose={onClose}
      height="70%"
      title="🏅 الإنجازات"
      zIndex={56}
    >
      {/* Summary */}
      <div
        className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 mb-4"
        style={{
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
        }}
      >
        <span style={{ fontSize: 14 }}>🏅</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: TUI.colors.gold }}>
          {unlockedCount}
        </span>
        <span style={{ fontSize: 12, color: TUI.colors.G5 }}>
          / {ACHIEVEMENTS.length} إنجاز مفتوح
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center" style={{ padding: '40px 0', gap: 12 }}>
          <Loader2 size={28} className="animate-spin" style={{ color: TUI.colors.tealLight }} />
          <span style={{ fontSize: 13, color: TUI.colors.G5 }}>جاري التحميل...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2" style={{ gap: 10 }}>
          {ACHIEVEMENTS.map(ach => {
            const isUnlocked = !!achievements[ach.key];
            return (
              <div
                key={ach.key}
                className="flex flex-col items-center text-center rounded-xl px-3 py-4"
                style={{
                  backgroundColor: isUnlocked ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.03)',
                  border: isUnlocked
                    ? '1.5px solid rgba(245, 158, 11, 0.35)'
                    : '1.5px solid rgba(255,255,255,0.06)',
                  boxShadow: isUnlocked
                    ? '0 0 16px rgba(245, 158, 11, 0.1)'
                    : 'none',
                  transition: 'all 0.2s ease',
                  opacity: isUnlocked ? 1 : 0.5,
                }}
              >
                {/* Lock icon overlay for locked achievements */}
                <div className="relative mb-2">
                  <span
                    style={{
                      fontSize: 32,
                      lineHeight: 1,
                      filter: isUnlocked ? 'none' : 'grayscale(1)',
                    }}
                  >
                    {ach.emoji}
                  </span>
                  {!isUnlocked && (
                    <div
                      className="absolute -top-1 -left-1 flex items-center justify-center rounded-full"
                      style={{
                        width: 18,
                        height: 18,
                        backgroundColor: 'rgba(255,255,255,0.15)',
                      }}
                    >
                      <Lock size={10} style={{ color: TUI.colors.G5 }} />
                    </div>
                  )}
                </div>

                {/* Name */}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: isUnlocked ? 700 : 500,
                    color: isUnlocked ? TUI.colors.gold : TUI.colors.G5,
                    lineHeight: '18px',
                    marginBottom: 2,
                  }}
                >
                  {ach.name}
                </span>

                {/* Description */}
                <span
                  className="leading-tight"
                  style={{
                    fontSize: 10,
                    color: isUnlocked ? TUI.colors.G6 : TUI.colors.G4,
                    lineHeight: '14px',
                  }}
                >
                  {ach.description}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </BottomSheetOverlay>
  );
}
