'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Gem, TrendingUp, CalendarDays, Gift } from 'lucide-react';
import BottomSheetOverlay from '../shared/BottomSheetOverlay';
import { TUI, getAvatarColorFromPalette } from '../../types';

/* ═══════════════════════════════════════════════════════════════════════
   EarningsSheet — Bottom sheet for room host earnings dashboard
   ═══════════════════════════════════════════════════════════════════════ */

interface EarningsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  userId: string;
}

interface EarningsData {
  totalEarnings: number;
  todayEarnings: number;
  weekEarnings: number;
  topGifters: Array<{
    userId: string;
    displayName: string;
    avatar?: string;
    totalValue: number;
  }>;
}

function formatGems(value: number): string {
  if (value >= 10000) return `${(value / 1000).toFixed(1)}K`;
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
  return value.toLocaleString();
}

function getRankColor(rank: number): string {
  switch (rank) {
    case 1: return '#f59e0b';
    case 2: return '#9ca3af';
    case 3: return '#d97706';
    default: return TUI.colors.G5;
  }
}

function getRankEmoji(rank: number): string {
  switch (rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return '';
  }
}

export default function EarningsSheet({ isOpen, onClose, roomId, userId }: EarningsSheetProps) {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadEarnings = useCallback(async (rId: string, uId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/room-earnings?roomId=${rId}&userId=${uId}`);
      const json = await res.json();
      if (json && typeof json === 'object') {
        setData({
          totalEarnings: json.totalEarnings ?? json.total ?? 0,
          todayEarnings: json.todayEarnings ?? json.today ?? 0,
          weekEarnings: json.weekEarnings ?? json.week ?? 0,
          topGifters: json.topGifters ?? json.gifters ?? [],
        });
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !roomId || !userId) return;
    loadEarnings(roomId, userId);
  }, [isOpen, roomId, userId, loadEarnings]);

  return (
    <BottomSheetOverlay
      isOpen={isOpen}
      onClose={onClose}
      height="65%"
      title="💰 أرباح الغرفة"
      zIndex={56}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center" style={{ padding: '40px 0', gap: 12 }}>
          <Loader2 size={28} className="animate-spin" style={{ color: TUI.colors.tealLight }} />
          <span style={{ fontSize: 13, color: TUI.colors.G5 }}>جاري التحميل...</span>
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: 16 }}>
          {/* ── Total Earnings Card ── */}
          <div
            className="flex flex-col items-center justify-center rounded-2xl px-4 py-5"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.08))',
              border: '1.5px solid rgba(245, 158, 11, 0.3)',
              boxShadow: '0 0 24px rgba(245, 158, 11, 0.08)',
            }}
          >
            <span style={{ fontSize: 13, color: TUI.colors.G5, marginBottom: 4 }}>إجمالي الأرباح</span>
            <div className="flex items-center gap-2">
              <Gem size={24} fill={TUI.colors.gold} stroke={TUI.colors.gold} />
              <span
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: TUI.colors.gold,
                  direction: 'ltr',
                  lineHeight: 1.2,
                }}
              >
                {formatGems(data?.totalEarnings ?? 0)}
              </span>
            </div>
          </div>

          {/* ── Today & Week Row ── */}
          <div className="grid grid-cols-2" style={{ gap: 10 }}>
            {/* Today */}
            <div
              className="flex flex-col items-center rounded-xl px-3 py-3"
              style={{
                backgroundColor: 'rgba(0, 200, 150, 0.06)',
                border: '1px solid rgba(0, 200, 150, 0.15)',
              }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <CalendarDays size={14} style={{ color: TUI.colors.tealLight }} />
                <span style={{ fontSize: 11, color: TUI.colors.G5 }}>أرباح اليوم</span>
              </div>
              <div className="flex items-center gap-1">
                <Gem size={12} fill={TUI.colors.tealLight} stroke={TUI.colors.tealLight} />
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: TUI.colors.tealLight,
                    direction: 'ltr',
                  }}
                >
                  {formatGems(data?.todayEarnings ?? 0)}
                </span>
              </div>
            </div>

            {/* This Week */}
            <div
              className="flex flex-col items-center rounded-xl px-3 py-3"
              style={{
                backgroundColor: 'rgba(123, 97, 255, 0.06)',
                border: '1px solid rgba(123, 97, 255, 0.15)',
              }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp size={14} style={{ color: '#7B61FF' }} />
                <span style={{ fontSize: 11, color: TUI.colors.G5 }}>أرباح الأسبوع</span>
              </div>
              <div className="flex items-center gap-1">
                <Gem size={12} fill="#7B61FF" stroke="#7B61FF" />
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#7B61FF',
                    direction: 'ltr',
                  }}
                >
                  {formatGems(data?.weekEarnings ?? 0)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Top 3 Gifters ── */}
          {(data?.topGifters && data.topGifters.length > 0) && (
            <div className="flex flex-col" style={{ gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: TUI.colors.G6 }}>
                🎁 أعلى المتبرعين في هذه الغرفة
              </span>
              <div className="flex flex-col" style={{ gap: 6 }}>
                {data.topGifters.slice(0, 3).map((gifter, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;
                  const rankColor = getRankColor(rank);
                  const avatarColor = getAvatarColorFromPalette(gifter.userId);

                  return (
                    <div
                      key={gifter.userId}
                      className="flex items-center gap-3 rounded-xl px-3 py-2"
                      style={{
                        backgroundColor: isTop3 ? `${rankColor}10` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isTop3 ? `${rankColor}25` : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      {/* Rank */}
                      <div
                        className="flex items-center justify-center shrink-0 rounded-full"
                        style={{
                          width: 28,
                          height: 28,
                          backgroundColor: `${rankColor}18`,
                          fontSize: isTop3 ? 15 : 12,
                          fontWeight: 700,
                          color: rankColor,
                        }}
                      >
                        {isTop3 ? getRankEmoji(rank) : rank}
                      </div>

                      {/* Avatar */}
                      <div
                        className="shrink-0 rounded-full overflow-hidden"
                        style={{
                          width: 34,
                          height: 34,
                          border: isTop3 ? `2px solid ${rankColor}` : '2px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        {gifter.avatar ? (
                          <img
                            src={gifter.avatar}
                            alt={gifter.displayName}
                            className="w-full h-full object-cover"
                            draggable={false}
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center rounded-full"
                            style={{
                              backgroundColor: avatarColor.bg,
                              color: avatarColor.text,
                              fontSize: 14,
                              fontWeight: 600,
                            }}
                          >
                            {gifter.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <span
                        className="flex-1 min-w-0 truncate"
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: TUI.colors.G7,
                        }}
                      >
                        {gifter.displayName}
                      </span>

                      {/* Value */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Gem size={11} fill={TUI.colors.gold} stroke={TUI.colors.gold} />
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: TUI.colors.gold,
                            direction: 'ltr',
                          }}
                        >
                          {formatGems(gifter.totalValue)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </BottomSheetOverlay>
  );
}
