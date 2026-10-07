'use client';

import { Loader2 } from 'lucide-react';
import BottomSheetOverlay from '../shared/BottomSheetOverlay';
import { TUI, getAvatarColorFromPalette } from '../../types';

/* ═══════════════════════════════════════════════════════════════════════
   TopGiftersSheet — Bottom sheet showing top gifters in current room
   ═══════════════════════════════════════════════════════════════════════ */

interface TopGifter {
  userId: string;
  displayName: string;
  avatar?: string;
  totalValue: number;
}

interface TopGiftersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  topGifters: TopGifter[];
}

function getRankColor(rank: number): string {
  switch (rank) {
    case 1: return '#f59e0b'; // gold
    case 2: return '#9ca3af'; // silver
    case 3: return '#d97706'; // bronze
    default: return TUI.colors.G5;
  }
}

function getRankBg(rank: number): string {
  switch (rank) {
    case 1: return 'rgba(245, 158, 11, 0.12)';
    case 2: return 'rgba(156, 163, 175, 0.1)';
    case 3: return 'rgba(217, 119, 6, 0.1)';
    default: return 'transparent';
  }
}

function getRankBorder(rank: number): string {
  switch (rank) {
    case 1: return 'rgba(245, 158, 11, 0.3)';
    case 2: return 'rgba(156, 163, 175, 0.25)';
    case 3: return 'rgba(217, 119, 6, 0.25)';
    default: return 'rgba(255,255,255,0.06)';
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

function formatGems(value: number): string {
  if (value >= 10000) return `${(value / 1000).toFixed(1)}K`;
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
  return value.toLocaleString();
}

function calcHeight(count: number): string {
  // Header: 72px, padding: 48px, per-row: ~60px
  const h = 120 + count * 60;
  return `${Math.min(h, 600)}px`;
}

export default function TopGiftersSheet({ isOpen, onClose, topGifters }: TopGiftersSheetProps) {
  return (
    <BottomSheetOverlay
      isOpen={isOpen}
      onClose={onClose}
      height={calcHeight(topGifters.length)}
      title="🏆 أعلى المتبرعين"
      zIndex={56}
    >
      {topGifters.length === 0 ? (
        <div className="flex flex-col items-center justify-center" style={{ padding: '32px 0', gap: 12 }}>
          <span style={{ fontSize: 36 }}>💎</span>
          <span style={{ fontSize: 14, color: TUI.colors.G5 }}>
            لا توجد هدايا بعد
          </span>
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: 8 }}>
          {topGifters.map((gifter, idx) => {
            const rank = idx + 1;
            const isTop3 = rank <= 3;
            const rankColor = getRankColor(rank);
            const avatarColor = getAvatarColorFromPalette(gifter.userId);

            return (
              <div
                key={gifter.userId}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{
                  backgroundColor: getRankBg(rank),
                  border: `1px solid ${getRankBorder(rank)}`,
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Rank Badge */}
                <div
                  className="flex items-center justify-center shrink-0 rounded-full"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: isTop3 ? `${rankColor}20` : 'rgba(255,255,255,0.06)',
                    fontSize: isTop3 ? 16 : 13,
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
                    width: 40,
                    height: 40,
                    border: isTop3 ? `2px solid ${rankColor}` : '2px solid rgba(255,255,255,0.1)',
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
                        fontSize: 16,
                        fontWeight: 600,
                      }}
                    >
                      {gifter.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <span
                    className="block truncate"
                    style={{
                      fontSize: 14,
                      fontWeight: isTop3 ? 700 : 500,
                      color: isTop3 ? TUI.colors.white : TUI.colors.G7,
                      lineHeight: '20px',
                    }}
                  >
                    {gifter.displayName}
                  </span>
                </div>

                {/* Gems Value */}
                <div className="flex items-center gap-1 shrink-0">
                  <span style={{ fontSize: 12 }}>💎</span>
                  <span
                    style={{
                      fontSize: 14,
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
      )}
    </BottomSheetOverlay>
  );
}
