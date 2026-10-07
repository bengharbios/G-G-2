'use client';

import { Wifi, WifiOff } from 'lucide-react';
import type { ConnectionQuality } from '../hooks/useVoiceRTC';
import { TUI } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   NetworkQualityIndicator — Compact signal-strength + WiFi icon

   Shows connection quality in the top bar area (~38px wide).
   Color-coded bars + WiFi icon, with Arabic tooltip on hover.
   RTL-compatible (uses logical layout).
   ═══════════════════════════════════════════════════════════════════════ */

interface NetworkQualityIndicatorProps {
  quality: ConnectionQuality;
}

/** Map quality level → display config */
const QUALITY_CONFIG: Record<
  ConnectionQuality,
  { label: string; color: string; activeBars: number }
> = {
  excellent: { label: 'اتصال ممتاز', color: TUI.colors.green, activeBars: 4 },
  good:      { label: 'اتصال جيد',   color: TUI.colors.gold,  activeBars: 3 },
  poor:      { label: 'اتصال ضعيف',  color: TUI.colors.red,   activeBars: 1 },
  disconnected: { label: 'غير متصل',  color: TUI.colors.G5,    activeBars: 0 },
};

/** Bar heights (from shortest to tallest, px) */
const BAR_HEIGHTS = [6, 9, 12, 16];

export default function NetworkQualityIndicator({ quality }: NetworkQualityIndicatorProps) {
  const config = QUALITY_CONFIG[quality];
  const isDisconnected = quality === 'disconnected';

  return (
    <div
      className="relative flex items-center net-q-wrap"
      style={{
        gap: 4,
        padding: '4px 6px',
        borderRadius: TUI.radius.pill,
        backgroundColor: 'rgba(255,255,255,0.06)',
        cursor: 'default',
        direction: 'rtl',
      }}
      role="status"
      aria-label={config.label}
    >
      {/* ── Signal bars ── */}
      {!isDisconnected && (
        <div className="flex items-end" style={{ gap: 1.5, height: 18 }}>
          {[0, 1, 2, 3].map((i) => {
            const isActive = i < config.activeBars;
            return (
              <div
                key={i}
                style={{
                  width: 3,
                  height: BAR_HEIGHTS[i],
                  borderRadius: 1,
                  backgroundColor: isActive
                    ? config.color
                    : 'rgba(255,255,255,0.15)',
                  transition: 'background-color 0.3s ease',
                }}
              />
            );
          })}
        </div>
      )}

      {/* ── WiFi icon ── */}
      {isDisconnected ? (
        <WifiOff size={14} style={{ color: config.color }} strokeWidth={2} />
      ) : (
        <Wifi size={14} style={{ color: config.color }} strokeWidth={2} />
      )}

      {/* ── Tooltip (shows on hover) ── */}
      <div className="net-q-tip" style={{
        position: 'absolute',
        bottom: -30,
        insetInlineStart: '50%',
        transform: 'translateX(50%)',
        padding: '3px 8px',
        borderRadius: TUI.radius.sm,
        backgroundColor: 'rgba(0,0,0,0.85)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        opacity: 0,
        transition: 'opacity 0.15s ease',
        zIndex: 100,
      }}>
        <span style={{
          fontSize: 10,
          fontWeight: 500,
          color: TUI.colors.white,
          lineHeight: 1.4,
        }}>
          {config.label}
        </span>
      </div>

      <style>{`
        .net-q-wrap:hover .net-q-tip {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
