'use client';

import { X, ArrowRight } from 'lucide-react';
import { TUI, getAvatarColor } from '../types';
import type { VoiceRoomParticipant } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   TopBar — TUILiveKit top_widget.dart exact replica

   Position: fixed top, overlays room background (transparent bg)
   Left: room name + ID (tappable → onRoomInfo)
   Center-Right: scrollable audience avatars (max 107px, 24px each)
   Right: Close button (X for owner, arrow-left for audience)

   Responsive: safe-area-inset-top, clamp room name, hide avatars <360px
   ═══════════════════════════════════════════════════════════════════════ */

interface TopBarProps {
  roomName: string;
  participantCount: number;
  isOwner: boolean;
  onClose: () => void;
  onRoomInfo: () => void;
  participants: VoiceRoomParticipant[];
}

const MAX_VISIBLE_AVATARS = 4;

export default function TopBar({
  roomName,
  participantCount,
  isOwner,
  onClose,
  onRoomInfo,
  participants,
}: TopBarProps) {
  /* ── Audience: participants NOT on a mic seat (seatIndex < 0) ── */
  const audienceList = participants.filter((p) => p.seatIndex < 0);
  const visibleAvatars = audienceList.slice(0, MAX_VISIBLE_AVATARS);
  const remainingCount = audienceList.length - MAX_VISIBLE_AVATARS;

  return (
    <div
      className="fixed flex items-center justify-between"
      style={{
        top: 'max(env(safe-area-inset-top, 0px), clamp(44px, 8vh, 54px))',
        left: 'clamp(8px, 3vw, 12px)',
        right: 'clamp(8px, 3vw, 12px)',
        height: 'clamp(36px, 6vh, 40px)',
        zIndex: 50,
      }}
    >
      {/* ── Left: Room info (tappable) ── */}
      <button
        onClick={onRoomInfo}
        className="flex flex-col justify-center min-w-0 flex-1 mr-2 cursor-pointer touch-manipulation"
        style={{ minHeight: 44 }}
        aria-label="Room info"
      >
        {/* Room name — responsive max-width */}
        <span
          className="truncate font-bold leading-tight"
          style={{
            fontSize: 'clamp(14px, 4vw, 16px)',
            fontWeight: 600,
            color: TUI.colors.white,
            maxWidth: 'clamp(100px, 40vw, 200px)',
          }}
        >
          {roomName}
        </span>

        {/* Participant count / ID hint */}
        <span
          className="leading-tight mt-0.5"
          style={{
            fontSize: 'clamp(10px, 2.8vw, 12px)',
            color: TUI.colors.G5,
          }}
        >
          {participantCount} مشاهد
        </span>
      </button>

      {/* ── Center-Right: Audience avatars row (hidden on very small screens) ── */}
      <div
        className="items-center overflow-hidden flex-shrink-0 max-[359px]:hidden flex"
        style={{
          maxWidth: 'clamp(60px, 25vw, 107px)',
          gap: 4,
        }}
      >
        {visibleAvatars.map((p) => (
          <div
            key={p.userId}
            className="rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center"
            style={{
              width: 'clamp(20px, 6vw, 24px)',
              height: 'clamp(20px, 6vw, 24px)',
              backgroundColor: p.avatar
                ? 'transparent'
                : getAvatarColor(p.userId),
            }}
          >
            {p.avatar ? (
              <img
                src={p.avatar}
                alt={p.displayName || p.username}
                className="w-full h-full object-cover rounded-full"
                loading="lazy"
              />
            ) : (
              <span
                className="font-medium"
                style={{
                  fontSize: 'clamp(8px, 2vw, 10px)',
                  color: TUI.colors.white,
                  lineHeight: 1,
                }}
              >
                {(p.displayName || p.username || '?').charAt(0)}
              </span>
            )}
          </div>
        ))}

        {/* "+N" badge for overflow */}
        {remainingCount > 0 && (
          <div
            className="flex-shrink-0 rounded-full flex items-center justify-center"
            style={{
              width: 'clamp(16px, 5vw, 20px)',
              height: 'clamp(16px, 5vw, 20px)',
              backgroundColor: 'rgba(0,0,0,0.5)',
              fontSize: 'clamp(9px, 2.5vw, 12px)',
              color: TUI.colors.white,
              fontWeight: 500,
            }}
          >
            +{remainingCount}
          </div>
        )}
      </div>

      {/* ── Right: Close / Exit button (44px touch target, 20px visual) ── */}
      <button
        onClick={onClose}
        className="flex-shrink-0 rounded-full flex items-center justify-center ml-3 cursor-pointer touch-manipulation"
        style={{
          width: 44,
          height: 44,
          minWidth: 44,
          minHeight: 44,
          backgroundColor: 'transparent',
        }}
        aria-label={isOwner ? 'End live' : 'Leave room'}
      >
        {isOwner ? (
          <X
            size={14}
            style={{ color: TUI.colors.white }}
            strokeWidth={2}
          />
        ) : (
          <ArrowRight
            size={14}
            style={{ color: TUI.colors.white }}
            strokeWidth={2}
          />
        )}
      </button>
    </div>
  );
}
