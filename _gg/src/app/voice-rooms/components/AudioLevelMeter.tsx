'use client';

import { TUI } from '../types';

// ─── Size Config ──────────────────────────────────────────────────────────────

const SIZE_CONFIG = {
  sm: { bars: 3, height: 12, width: 2, gap: 1 },
  md: { bars: 4, height: 16, width: 3, gap: 1.5 },
  lg: { bars: 5, height: 20, width: 3, gap: 2 },
} as const;

type SizeKey = keyof typeof SIZE_CONFIG;

// ─── Keyframes (one per bar index, max 5) ────────────────────────────────────

const KEYFRAMES = `
  @keyframes audioBar0 {
    0%, 100% { height: 20%; }
    15% { height: 80%; }
    30% { height: 45%; }
    50% { height: 95%; }
    70% { height: 30%; }
    85% { height: 70%; }
  }
  @keyframes audioBar1 {
    0%, 100% { height: 35%; }
    20% { height: 90%; }
    40% { height: 25%; }
    55% { height: 70%; }
    75% { height: 95%; }
    90% { height: 40%; }
  }
  @keyframes audioBar2 {
    0%, 100% { height: 25%; }
    10% { height: 60%; }
    25% { height: 95%; }
    45% { height: 40%; }
    65% { height: 85%; }
    80% { height: 20%; }
  }
  @keyframes audioBar3 {
    0%, 100% { height: 50%; }
    18% { height: 30%; }
    35% { height: 85%; }
    52% { height: 20%; }
    68% { height: 75%; }
    82% { height: 95%; }
  }
  @keyframes audioBar4 {
    0%, 100% { height: 40%; }
    12% { height: 75%; }
    28% { height: 50%; }
    48% { height: 100%; }
    62% { height: 35%; }
    78% { height: 80%; }
    92% { height: 55%; }
  }
`;

// Staggered animation durations + delays so bars never sync up
const BAR_ANIMATION = [
  { duration: '0.6s',  delay: '0s' },
  { duration: '0.8s',  delay: '0.12s' },
  { duration: '0.55s', delay: '0.06s' },
  { duration: '0.7s',  delay: '0.18s' },
  { duration: '0.65s', delay: '0.09s' },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface AudioLevelMeterProps {
  /** Whether the user is currently speaking / audio is active */
  isActive: boolean;
  /** Audio level from 0-1. If omitted, simulated animation is used when isActive */
  level?: number;
  /** Visual size preset */
  size?: 'sm' | 'md' | 'lg';
}

export function AudioLevelMeter({
  isActive,
  level,
  size = 'md',
}: AudioLevelMeterProps) {
  const cfg = SIZE_CONFIG[size];
  const barCount = cfg.bars;
  // Derive max height based on explicit level, or default to full animation
  const maxHeight = level !== undefined
    ? Math.max(cfg.height * 0.15, cfg.height * level) // scale with level, min 15%
    : cfg.height;
  const activeColor = TUI.colors.tealLight;
  const inactiveColor = 'rgba(255,255,255,0.15)';

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: cfg.gap,
          height: cfg.height,
          width: barCount * cfg.width + (barCount - 1) * cfg.gap,
        }}
        aria-hidden="true"
      >
        {Array.from({ length: barCount }, (_, i) => {
          const anim = BAR_ANIMATION[i];
          const isSimulated = isActive && level === undefined;
          return (
            <div
              key={i}
              style={{
                width: cfg.width,
                borderRadius: 1,
                backgroundColor: isActive ? activeColor : inactiveColor,
                opacity: isActive ? 1 : 0.4,
                height: isSimulated
                  ? '100%' // height controlled by keyframe percentage of container
                  : isActive
                    ? maxHeight
                    : '20%',
                animation: isSimulated
                  ? `audioBar${i} ${anim.duration} ease-in-out ${anim.delay} infinite`
                  : undefined,
                transition: isActive
                  ? 'height 0.12s ease, opacity 0.2s ease'
                  : 'opacity 0.3s ease',
                willChange: 'height',
              }}
            />
          );
        })}
      </div>
    </>
  );
}
