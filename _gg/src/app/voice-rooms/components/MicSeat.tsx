'use client';

import { motion } from 'framer-motion';
import { Mic, Lock, Crown, MicOff } from 'lucide-react';
import type { SeatData } from '../types';
import { TUI, getAvatarColorFromPalette } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   MicSeat — Single voice seat matching TUILiveKit VoiceRoomRootWidget

   States:
     • Empty (open)       — faint circle + mic icon
     • Locked             — faint circle + lock icon
     • Occupied           — avatar + optional badges
       – Speaking         — animated ripple ring (#29CC6A)
       – Muted            — red MicOff badge (bottom-right)
       – Owner            — crown badge (top-right)

   Responsive: clamp() for seat, avatar, icon, name — works on 320px+
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

  // Determine if the user on this seat is the owner (for crown badge)
  const isSeatOwner = isOccupied && participant?.role === 'owner';

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
            {/* Primary ripple */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: `2px solid ${TUI.colors.green}` }}
              animate={{
                scale: [1, 1.8],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
            {/* Secondary ripple (staggered) */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: `2px solid ${TUI.colors.green}` }}
              animate={{
                scale: [1, 1.8],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeOut',
                delay: 0.6,
              }}
            />
          </>
        )}

        {/* ── Seat Number Badge (top-left pill) — responsive ── */}
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
              <Lock
                size="clamp(20px, 6vw, 28px)"
                style={{ color: TUI.colors.G5 }}
                strokeWidth={1.5}
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
            {/* Avatar circle (responsive: 32–40px) */}
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

            {/* ── Muted Badge (bottom-right, red) ── */}
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

            {/* ── Owner Crown Badge (top-right) ── */}
            {isSeatOwner && (
              <span
                className="absolute -top-0.5 -right-0.5 flex items-center justify-center z-10"
                style={{
                  width: 'clamp(14px, 3.5vw, 16px)',
                  height: 'clamp(14px, 3.5vw, 16px)',
                }}
              >
                <Crown size={14} fill="#f59e0b" stroke="#f59e0b" strokeWidth={1} />
              </span>
            )}
          </>
        )}
      </div>

      {/* ── User Name Below Seat (responsive max-width) ── */}
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
    </button>
  );
}
