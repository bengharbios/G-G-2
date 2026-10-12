'use client';

import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';
import type { SeatData } from '../types';
import { TUI, getAvatarColorFromPalette } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   MicSeat — Single voice seat using actual Yalla Ludo image assets

   States:
     • Empty (open)       — faint circle + mic icon (lucide)
     • Locked             — faint circle + ic_lock.webp image
     • Occupied           — avatar + optional badges
       – Speaking         — animated ripple ring (#29CC6A)
       – Muted            — red MicOff badge (bottom-right)
       – Owner            — room_ic_flag_member_king.webp badge (top-right)
       – Admin            — room_ic_flag_member_purple.webp badge
       – Level            — level_big_*.png badge below name

   All decorative badges use real Yalla Ludo PNG/WEBP images.
   Functional icons (mic on/off) stay as lucide-react for clarity.
   ═══════════════════════════════════════════════════════════════════════ */

interface MicSeatProps {
  seatData: SeatData;
  isOwner: boolean;
  isSpeaking: boolean;
  onClick: () => void;
}

/** Truncate string to maxLen chars with ellipsis */
function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '\u2026' : str;
}

/** Get the membership badge image based on role */
function getRoleBadge(role?: string): string | null {
  if (!role) return null;
  switch (role) {
    case 'owner': return '/yalla-ornaments/room_ic_flag_member_king.webp';
    case 'coowner': return '/yalla-ornaments/room_ic_flag_member_gold.webp';
    case 'admin': return '/yalla-ornaments/room_ic_flag_member_purple.webp';
    default: return '/yalla-ornaments/room_ic_flag_member.webp';
  }
}

/** Get level badge image based on level number */
function getLevelBadge(level: number): string {
  if (level >= 50) return '/yalla-ui/level_big_50_60_ic.png';
  if (level >= 40) return '/yalla-ui/level_big_40_49_ic.png';
  if (level >= 30) return '/yalla-ui/level_big_30_39_ic.png';
  if (level >= 20) return '/yalla-ui/level_big_20_29_ic.png';
  if (level >= 10) return '/yalla-ui/level_big_10_19_ic.png';
  return '/yalla-ui/level_big_1_9_ic.png';
}

export default function MicSeat({
  seatData,
  isOwner,
  isSpeaking,
  onClick,
}: MicSeatProps) {
  const { seatIndex, participant, status } = seatData;
  const isLocked = !participant && status === 'locked';
  const isEmpty = !participant && !isLocked;
  const isOccupied = !!participant;
  const isMySeat = isOwner;

  // Role badge image
  const roleBadge = isOccupied ? getRoleBadge(participant?.role) : null;
  // Level badge image
  const levelBadge = isOccupied && participant?.vipLevel ? getLevelBadge(participant.vipLevel) : null;

  // Determine if muted
  const isMuted = isOccupied && (participant?.isMuted || participant?.micFrozen);

  // Avatar palette color for fallback
  const palette = isOccupied ? getAvatarColorFromPalette(participant.userId) : null;

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center group outline-none touch-manipulation"
      style={{ gap: 'clamp(4px, 1.5vw, 6px)' }}
      aria-label={isOccupied ? `Seat ${seatIndex + 1}: ${participant.displayName}` : `Seat ${seatIndex + 1}: empty`}
    >
      {/* ── Seat Circle (responsive: 40–50px) ── */}
      <div
        className="relative rounded-full flex items-center justify-center transition-transform duration-150 ease-out group-hover:scale-105"
        style={{
          width: 'clamp(40px, 12vw, 50px)',
          height: 'clamp(40px, 12vw, 50px)',
          backgroundColor: isEmpty ? TUI.colors.emptySeatBg : 'transparent',
          border: isMySeat ? `2px solid ${TUI.colors.seatSelectedBorder}` : '2px solid transparent',
        }}
      >
        {/* ── Speaking Ripple Animation ── */}
        {isOccupied && isSpeaking && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: `2px solid ${TUI.colors.green}` }}
              animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: `2px solid ${TUI.colors.green}` }}
              animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
            />
          </>
        )}

        {/* ── Seat Number Badge (top-left pill) ── */}
        <span
          className="absolute -top-0.5 -left-0.5 flex items-center justify-center rounded-full z-10 pointer-events-none select-none"
          style={{
            minWidth: 'clamp(14px, 3.5vw, 16px)',
            height: 'clamp(12px, 3vw, 14px)',
            padding: '0 3px',
            backgroundColor: 'rgba(0,0,0,0.5)',
            fontSize: 'clamp(8px, 2.2vw, 10px)',
            lineHeight: 'clamp(12px, 3vw, 14px)',
            color: '#fff',
            fontWeight: 500,
          }}
        >
          {seatIndex + 1}
        </span>

        {/* ── Empty / Locked State ── */}
        {!isOccupied && (
          <>
            {isLocked ? (
              // أيقونة القفل الحقيقية من يلا لودو
              <img
                src="/yalla-settings/ic_lock.webp"
                alt="مقفل"
                style={{ width: 'clamp(18px, 5vw, 24px)', height: 'clamp(18px, 5vw, 24px)', opacity: 0.6 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <Mic
                size="clamp(20px, 6vw, 28px)"
                style={{ color: TUI.colors.G5 }}
                strokeWidth={1.5}
              />
            )}
          </>
        )}

        {/* ── Occupied State — Avatar ── */}
        {isOccupied && (
          <>
            {/* Avatar circle */}
            <div
              className="relative flex items-center justify-center rounded-full overflow-hidden"
              style={{
                width: 'clamp(32px, 10vw, 40px)',
                height: 'clamp(32px, 10vw, 40px)',
                border: `2px solid ${isSpeaking ? TUI.colors.green : 'transparent'}`,
              }}
            >
              {participant.avatar ? (
                <img
                  src={participant.avatar}
                  alt={participant.displayName}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <span
                  className="flex items-center justify-center rounded-full select-none"
                  style={{
                    width: 'clamp(32px, 10vw, 40px)',
                    height: 'clamp(32px, 10vw, 40px)',
                    backgroundColor: palette?.bg || '#eff6ff',
                    color: palette?.text || '#2563eb',
                    fontSize: 'clamp(14px, 4vw, 16px)',
                    fontWeight: 600,
                  }}
                >
                  {participant.displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* ── Muted Badge (bottom-right, red) — lucide MicOff ── */}
            {isMuted && (
              <span
                className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full z-10"
                style={{
                  width: 'clamp(14px, 3.5vw, 16px)',
                  height: 'clamp(14px, 3.5vw, 16px)',
                  backgroundColor: TUI.colors.red,
                }}
              >
                <MicOff size={9} color="#fff" strokeWidth={2.5} />
              </span>
            )}

            {/* ── Role Badge (top-right) — real Yalla Ludo image ── */}
            {roleBadge && (
              <img
                src={roleBadge}
                alt=""
                className="absolute -top-1 -right-1 z-10 pointer-events-none"
                style={{
                  width: 'clamp(16px, 4vw, 20px)',
                  height: 'clamp(16px, 4vw, 20px)',
                  objectFit: 'contain',
                }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </>
        )}
      </div>

      {/* ── User Name Below Seat ── */}
      <span
        className="text-center leading-tight select-none"
        style={{
          maxWidth: 'clamp(45px, 12vw, 60px)',
          fontSize: 'clamp(10px, 2.8vw, 12px)',
          color: TUI.colors.G6,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={isOccupied ? participant.displayName : ''}
      >
        {isOccupied ? truncate(participant.displayName, 6) : '\u00A0'}
      </span>

      {/* ── Level Badge below name — real Yalla Ludo image ── */}
      {isOccupied && levelBadge && (
        <img
          src={levelBadge}
          alt=""
          className="pointer-events-none"
          style={{
            width: 'clamp(24px, 7vw, 30px)',
            height: 'auto',
            marginTop: -2,
          }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      )}
    </button>
  );
}
