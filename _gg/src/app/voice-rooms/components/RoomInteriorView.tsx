'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Loader2, X, ArrowRight, Share2,
  Crown, Volume2, VolumeX, Mic, MicOff, Gift, Send, Headphones,
  Megaphone, Pencil,
  Lock, MoreVertical, Users, Settings2, Shield,
  PencilLine, Sparkles,
  UserPlus, LogOut, Heart, AlertTriangle,
  MessageSquare, UserCog, Trophy, LogIn, Minimize2, MoreHorizontal,
  Bell, BellOff, AudioWaveform,
  Medal, DollarSign,
} from 'lucide-react';
import { useVoiceRoom } from '../hooks/useVoiceRoom';
import { useVoiceRTC, type RoomNotification } from '../hooks/useVoiceRTC';
import {
  TUI, DEFAULT_BG_URLS, ROLE_LABELS, canDo, getAvatarColor,
  getAvatarColorFromPalette, getMicLayout,
  type RoomRole, type SeatData, type VoiceRoomParticipant, type MicLayoutId,
} from '../types';

// ─── Sub-components ──────────────────────────────────────────────────────────

import InjectStyles from './shared/InjectStyles';
import ChatPanel from './ChatPanel';
import LikeAnimation from './LikeAnimation';
import GiftAnimations from './GiftAnimations';

// ─── Sheets ──────────────────────────────────────────────────────────────────

import GiftSheet from './sheets/GiftSheet';
import SettingsSheet from './sheets/SettingsSheet';
import ProfileSheet from './sheets/ProfileSheet';
import MicMenuSheet from './sheets/MicMenuSheet';
import SeatManagementSheet from './sheets/SeatManagementSheet';
import RoomInfoSheet from './sheets/RoomInfoSheet';
import TopGiftersSheet from './sheets/TopGiftersSheet';
import AchievementsSheet from './sheets/AchievementsSheet';
import EarningsSheet from './sheets/EarningsSheet';

// ─── Dialogs ─────────────────────────────────────────────────────────────────

import KickDurationDialog from './dialogs/KickDurationDialog';
import MembershipDialog from './dialogs/MembershipDialog';
import MicInviteDialog from './dialogs/MicInviteDialog';
import AudioSettingsDialog from './dialogs/AudioSettingsDialog';

// ─── New Utility Components ───────────────────────────────────────────────────

import { ThemeToggle } from './ThemeToggle';
import { ReconnectIndicator } from './ReconnectIndicator';
import { RecordingIndicator } from './RecordingIndicator';
import { DailyRewardToast } from './DailyRewardToast';
import NetworkQualityIndicator from './NetworkQualityIndicator';
import { AudioLevelMeter } from './AudioLevelMeter';
import { OnlineStatusBadge } from './OnlineStatus';
import { UserSearchBar } from './UserSearch';
import ReportBlockDialog from './ReportBlockDialog';

// ─── Types ───────────────────────────────────────────────────────────────────

import type { VoiceRoom, AuthUser } from '../types';

// ─── Sound Effects & Floating Reactions ──────────────────────────────────────
import { playJoinSound, playLeaveSound, playMicOnSound, playMicOffSound, playGiftSound, playGiftReceivedSound, playNotificationSound, playSeatRequestSound, playKickSound, playErrorSound, SOUNDBOARD_ITEMS } from '@/lib/sound-effects';
import { useFloatingReactions, QuickReactionBar, FloatingReactions as FloatingReactionsOverlay } from './FloatingReactions';
import { useDND, DoNotDisturbToggle } from './DoNotDisturbBadge';

/* ═══════════════════════════════════════════════════════════════════════
   RoomInteriorView — TUILiveKit Room Interior (Improved Match)

   Structure (h-screen flex flex-col relative):
     ├── Background (teal-green: #0D8A7A → #0A6B5E → #074a42)
     ├── z-10 flex flex-col h-full
     │   ├── Header (room avatar+name+Lv | audience avatars | close+⋮)
     │   ├── Announcement bar
     │   ├── Mic Seat Area (5 layout patterns with number badges, names, glow)
     │   ├── Audience Row (stacked avatars with +N badge)
     │   ├── ChatPanel (floating transparent messages)
     │   ├── LikeAnimation (left side)
     │   ├── GiftAnimations (overlay)
     │   └── Bottom Bar (chat pill | ❤️ like | 🎁 gift | 🔊 mic/speaker)
     ├── LEFT SIDE MENU (3 music/function buttons — clean minimal style)
     ├── Three-Dots Menu (overlay, 3-column icon grid)
     └── All sheets/dialogs (SettingsSheet LOCKED)
   ═══════════════════════════════════════════════════════════════════════ */

interface RoomInteriorViewProps {
  room: VoiceRoom;
  onExit: (alreadyCalledLeave?: boolean) => void;
  authUser: AuthUser | null;
  onRoomUpdate: (room: VoiceRoom) => void;
}

/* ── Speaking Audio Bars sub-component ── */
function SpeakingBars({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="flex items-center justify-center" style={{ gap: 2, height: 14 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            display: 'block',
            width: 3,
            height: 8 + (i === 1 ? 6 : 3),
            borderRadius: '1.5px',
            backgroundColor: TUI.colors.tealLight,
            animation: `speakBar 0.6s ease-in-out ${i * 0.15}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes speakBar {
          0% { transform: scaleY(0.4); opacity: 0.5; }
          100% { transform: scaleY(1.2); opacity: 1; }
        }
        @keyframes seatRipple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes giftShimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
          50% { opacity: 0.8; transform: translateY(-40vh) scale(1.2) rotate(-15deg); }
          100% { opacity: 0; transform: translateY(-80vh) scale(0.6) rotate(15deg); }
        }
        .floating-reaction-emoji {
          pointer-events: none;
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
}

/* ── Role-based border colors for occupied seats ── */
function getSeatBorderColor(role: RoomRole, isSpeaking: boolean): string {
  if (isSpeaking) return TUI.colors.tealLight;
  switch (role) {
    case 'owner': return TUI.colors.gold;
    case 'coowner': return '#a78bfa';
    case 'admin': return '#60a5fa';
    default: return TUI.colors.tealLight;
  }
}

function getSeatGlow(role: RoomRole, isSpeaking: boolean): string {
  if (isSpeaking) return '0 0 16px rgba(0,200,150,0.55), 0 0 32px rgba(0,200,150,0.25), inset 0 0 10px rgba(0,200,150,0.12)';
  switch (role) {
    case 'owner': return '0 0 12px rgba(255,215,0,0.4), 0 0 24px rgba(255,215,0,0.15)';
    case 'coowner': return '0 0 10px rgba(167,139,250,0.35), 0 0 20px rgba(167,139,250,0.12)';
    case 'admin': return '0 0 10px rgba(96,165,250,0.35), 0 0 20px rgba(96,165,250,0.12)';
    default: return '0 0 10px rgba(0,200,150,0.3), 0 0 20px rgba(0,200,150,0.1)';
  }
}

/* ── Seat Circle — TUILiveKit exact mic seat with number badge, name label, glow ── */
function SeatCircle({
  seat,
  size = 50,
  onSeatClick,
  isRtcSpeaking = false,
}: {
  seat: SeatData;
  size?: number;
  onSeatClick: (idx: number) => void;
  isRtcSpeaking?: boolean;
}) {
  const isLocked = !seat.participant && seat.status === 'locked';
  const isEmpty = !seat.participant && !isLocked;
  const isOccupied = !!seat.participant;
  // Only show speaking when WebRTC confirms actual audio (no fallback to avoid false waves)
  const isSpeaking = isOccupied && isRtcSpeaking;
  const seatRole = isOccupied ? seat.participant!.role : 'visitor';
  const innerSize = size - 6;
  const fontSize = size <= 46 ? 10 : size <= 50 ? 11 : 12;

  return (
    <button
      type="button"
      onClick={() => onSeatClick(seat.seatIndex)}
      className="flex flex-col items-center touch-manipulation bg-transparent border-none cursor-pointer group"
      style={{ gap: 2, minWidth: size + 2, minHeight: size + 28 }}
      aria-label={
        isOccupied
          ? `مقعد ${seat.seatIndex + 1}: ${seat.participant!.displayName}`
          : `مقعد ${seat.seatIndex + 1}: ${isLocked ? 'مقفل' : 'فارغ'}`
      }
    >
      {/* Seat circle */}
      <div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          backgroundColor: isEmpty ? 'rgba(255,255,255,0.06)' : isLocked ? 'rgba(255,255,255,0.03)' : 'transparent',
          border: isOccupied
            ? `2.5px solid ${getSeatBorderColor(seatRole, isSpeaking)}`
            : isLocked
              ? '2px dashed rgba(255,255,255,0.15)'
              : '2px solid rgba(255,255,255,0.08)',
          boxShadow: isOccupied
            ? getSeatGlow(seatRole, isSpeaking)
            : 'none',
          transition: 'all 0.3s ease',
          transform: 'scale(1)',
        }}
        onMouseEnter={(e) => { if (isOccupied) { e.currentTarget.style.transform = 'scale(1.06)'; } }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {/* ── Seat Number Badge (top-left) ── */}
        <span
          className="absolute flex items-center justify-center rounded-full pointer-events-none select-none"
          style={{
            top: -4,
            left: -4,
            width: 17,
            height: 17,
            background: isOccupied
              ? ['linear-gradient(135deg, ', getSeatBorderColor(seatRole, false), ', ', TUI.colors.tealDark, ')'].join('')
              : 'rgba(255,255,255,0.12)',
            fontSize: 9,
            fontWeight: 700,
            color: isOccupied ? TUI.colors.white : 'rgba(255,255,255,0.5)',
            zIndex: 3,
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
            border: isOccupied ? '1.5px solid rgba(255,255,255,0.2)' : 'none',
          }}
        >
          {seat.seatIndex + 1}
        </span>

        {/* Locked state */}
        {isLocked && (
          <Lock size={size * 0.35} style={{ color: 'rgba(255,255,255,0.3)' }} strokeWidth={1.5} />
        )}

        {/* Empty state */}
        {isEmpty && (
          <Mic size={size * 0.35} style={{ color: 'rgba(255,255,255,0.18)' }} strokeWidth={1.5} />
        )}

        {/* Occupied — avatar */}
        {isOccupied && seat.participant && (
          <>
            {/* Speaking ripple ring */}
            {isSpeaking && (
              <>
                <span
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    inset: -5,
                    border: `2px solid ${TUI.colors.tealLight}`,
                    opacity: 0.6,
                    animation: 'seatRipple 1.5s ease-out infinite',
                  }}
                />
                <span
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    inset: -5,
                    border: `2px solid ${TUI.colors.tealLight}`,
                    opacity: 0.6,
                    animation: 'seatRipple 1.5s ease-out 0.75s infinite',
                  }}
                />
              </>
            )}

            <div
              className="rounded-full overflow-hidden flex items-center justify-center"
              style={{ width: innerSize, height: innerSize }}
            >
              {seat.participant.avatar ? (
                <img
                  src={seat.participant.avatar}
                  alt={seat.participant.displayName}
                  className="w-full h-full object-cover rounded-full"
                  draggable={false}
                  loading="lazy"
                />
              ) : (
                <div
                  className="flex items-center justify-center rounded-full w-full h-full"
                  style={{
                    backgroundColor: getAvatarColorFromPalette(seat.participant.userId).bg,
                    color: getAvatarColorFromPalette(seat.participant.userId).text,
                    fontSize: innerSize * 0.42,
                    fontWeight: 600,
                  }}
                >
                  {seat.participant.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Muted badge */}
            {(seat.participant.isMuted || seat.participant.micFrozen) && (
              <span
                className="absolute flex items-center justify-center rounded-full"
                style={{
                  bottom: -2,
                  right: -2,
                  width: 18,
                  height: 18,
                  backgroundColor: TUI.colors.red,
                  zIndex: 2,
                  boxShadow: '0 1px 6px rgba(252,85,85,0.5)',
                  border: '2px solid rgba(10,14,39,0.9)',
                }}
              >
                <MicOff size={9} color="#fff" strokeWidth={2.5} />
              </span>
            )}

            {/* Owner crown */}
            {seat.participant.role === 'owner' && (
              <span
                className="absolute flex items-center justify-center"
                style={{ top: -4, right: -4, width: 18, height: 18, zIndex: 2 }}
              >
                <Crown size={15} fill={TUI.colors.gold} stroke={TUI.colors.gold} strokeWidth={1} />
              </span>
            )}

            {/* Admin badge */}
            {seat.participant.role === 'admin' && !isSpeaking && (
              <span
                className="absolute flex items-center justify-center"
                style={{ top: -4, right: -4, width: 16, height: 16, zIndex: 2, backgroundColor: 'rgba(96,165,250,0.9)', borderRadius: '50%', border: '1.5px solid rgba(10,14,39,0.9)' }}
              >
                <Shield size={9} fill="#fff" stroke="#fff" strokeWidth={2} />
              </span>
            )}
          </>
        )}
      </div>

      {/* Name label below seat */}
      <span
        className="text-center leading-tight select-none"
        style={{
          maxWidth: size + 10,
          fontSize,
          color: isOccupied ? (isSpeaking ? TUI.colors.tealLight : TUI.colors.G7) : 'transparent',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          height: fontSize + 2,
          fontWeight: isSpeaking ? 600 : 400,
        }}
      >
        {isOccupied ? (seat.participant!.displayName.length > 6 ? seat.participant!.displayName.slice(0, 6) + '…' : seat.participant!.displayName) : '\u00A0'}
      </span>

      {/* Speaking bars (only when speaking, replaces name) */}
      {isSpeaking && <SpeakingBars active={true} />}
    </button>
  );
}

/* ── Mic Seat Layouts (TUILiveKit screenshot-matched) ── */
function MicSeatGrid({
  seats,
  layoutId,
  onSeatClick,
  speakingPeers,
  localUserId,
  localSpeaking,
}: {
  seats: SeatData[];
  layoutId: MicLayoutId;
  onSeatClick: (idx: number) => void;
  speakingPeers?: React.MutableRefObject<Map<string, boolean>>;
  localUserId?: string;
  localSpeaking?: boolean;
}) {
  const seatSize = seats.length <= 5 ? 54 : seats.length <= 10 ? 50 : 46;
  const rowGap = seats.length <= 5 ? 0 : seats.length <= 10 ? 12 : 10;

  // Helper: check if a participant is speaking via WebRTC
  const isSpeakingViaRTC = (participant: VoiceRoomParticipant | null): boolean => {
    if (!participant || !speakingPeers) return false;
    if (localUserId && participant.userId === localUserId) return !!localSpeaking;
    return speakingPeers.current.get(participant.userId) || false;
  };

  // ── Chat 5: 1 row of 5 (horizontal line) ──
  if (layoutId === 'chat5') {
    return (
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ padding: '24px 12px 8px', gap: 10 }}
      >
        {seats.map((seat) => (
          <SeatCircle key={seat.seatIndex} seat={seat} size={seatSize} onSeatClick={onSeatClick} isRtcSpeaking={isSpeakingViaRTC(seat.participant)} />
        ))}
      </div>
    );
  }

  // ── Broadcast 5: 1 top (host) + 4 bottom (pyramid) ──
  // NOTE: All seats rendered sequentially — owner moves like everyone else
  if (layoutId === 'broadcast5') {
    return (
      <div
        className="flex flex-col items-center flex-shrink-0"
        style={{ padding: '16px 16px 8px', gap: 14 }}
      >
        {/* Top row: seat 0 */}
        <div className="flex items-center justify-center">
          <SeatCircle seat={seats[0]} size={seatSize + 6} onSeatClick={onSeatClick} isRtcSpeaking={isSpeakingViaRTC(seats[0].participant)} />
        </div>
        {/* Bottom row: seats 1-4 */}
        <div className="flex items-center justify-center" style={{ gap: 10 }}>
          {seats.slice(1).map((seat) => (
            <SeatCircle key={seat.seatIndex} seat={seat} size={seatSize} onSeatClick={onSeatClick} isRtcSpeaking={isSpeakingViaRTC(seat.participant)} />
          ))}
        </div>
      </div>
    );
  }

  // ── Chat 10: 2 rows of 5 (2×5 grid) ──
  if (layoutId === 'chat10') {
    return (
      <div
        className="flex flex-col items-center flex-shrink-0"
        style={{ padding: '16px 12px 8px', gap: rowGap }}
      >
        {Array.from({ length: Math.ceil(seats.length / 5) }).map((_, row) => (
          <div key={row} className="flex items-center justify-center" style={{ gap: 8 }}>
            {seats.slice(row * 5, (row + 1) * 5).map((seat) => (
              <SeatCircle key={seat.seatIndex} seat={seat} size={seatSize} onSeatClick={onSeatClick} isRtcSpeaking={isSpeakingViaRTC(seat.participant)} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // ── Team 10: 2 rows of 5 with divider between seats 2&3 ──
  if (layoutId === 'team10') {
    return (
      <div
        className="flex flex-col items-center flex-shrink-0"
        style={{ padding: '16px 12px 8px', gap: rowGap }}
      >
        {Array.from({ length: Math.ceil(seats.length / 5) }).map((_, row) => {
          const rowSeats = seats.slice(row * 5, (row + 1) * 5);
          return (
            <div key={row} className="flex items-center justify-center" style={{ gap: 0 }}>
              {/* Team A: seats 0, 1 */}
              {rowSeats.slice(0, 2).map((seat) => (
                <div key={seat.seatIndex} style={{ padding: '0 4px' }}>
                  <SeatCircle seat={seat} size={seatSize} onSeatClick={onSeatClick} isRtcSpeaking={isSpeakingViaRTC(seat.participant)} />
                </div>
              ))}
              {/* Divider */}
              <div
                style={{
                  width: 2,
                  height: seatSize + 16,
                  backgroundColor: 'rgba(0, 200, 150, 0.35)',
                  borderRadius: 1,
                  margin: '0 6px',
                }}
              />
              {/* Team B: seats 2, 3, 4 */}
              {rowSeats.slice(2, 5).map((seat) => (
                <div key={seat.seatIndex} style={{ padding: '0 4px' }}>
                  <SeatCircle seat={seat} size={seatSize} onSeatClick={onSeatClick} isRtcSpeaking={isSpeakingViaRTC(seat.participant)} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Chat 15: 3 rows of 5 (3×5 grid) ──
  if (layoutId === 'chat15') {
    return (
      <div
        className="flex flex-col items-center flex-shrink-0"
        style={{ padding: '12px 8px 8px', gap: rowGap }}
      >
        {Array.from({ length: Math.ceil(seats.length / 5) }).map((_, row) => (
          <div key={row} className="flex items-center justify-center" style={{ gap: 6 }}>
            {seats.slice(row * 5, (row + 1) * 5).map((seat) => (
              <SeatCircle key={seat.seatIndex} seat={seat} size={seatSize} onSeatClick={onSeatClick} isRtcSpeaking={isSpeakingViaRTC(seat.participant)} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // ── Default fallback: single row (for any seat count) ──
  return (
    <div
      className="flex items-center justify-center flex-shrink-0 flex-wrap"
      style={{ padding: '16px 12px 8px', gap: 10 }}
    >
      {seats.map((seat) => (
        <SeatCircle key={seat.seatIndex} seat={seat} size={seatSize} onSeatClick={onSeatClick} isRtcSpeaking={isSpeakingViaRTC(seat.participant)} />
      ))}
    </div>
  );
}

// ─── Three-Dots Menu Overlay ─────────────────────────────────────────────────

function ThreeDotsMenu({
  isOpen,
  onClose,
  isAdmin,
  isOwner,
  pendingRequests,
  onOpenSettings,
  onOpenSeatMgmt,
  onOpenRoomInfo,
  onOpenProfile,
  onShare,
  onToggleRoomMute,
  isRoomMuted,
  onOpenTopGifters,
  onOpenAchievements,
  onOpenEarnings,
  onOpenUserSearch,
  onOpenReport,
  hasAuthUser,
}: {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  isOwner: boolean;
  pendingRequests: number;
  onOpenSettings: () => void;
  onOpenSeatMgmt: () => void;
  onOpenRoomInfo: () => void;
  onOpenProfile: () => void;
  onShare: () => void;
  onToggleRoomMute: () => void;
  isRoomMuted: boolean;
  onOpenTopGifters: () => void;
  onOpenAchievements: () => void;
  onOpenEarnings: () => void;
  onOpenUserSearch: () => void;
  onOpenReport: () => void;
  hasAuthUser: boolean;
}) {
  if (!isOpen) return null;

  const items = [
    { icon: Settings2, label: 'الإعدادات', action: onOpenSettings, show: isAdmin },
    { icon: PencilLine, label: 'تعديل الغرفة', action: onOpenRoomInfo, show: isOwner },
    { icon: Users, label: 'إدارة المقاعد', action: onOpenSeatMgmt, show: isAdmin, badge: pendingRequests },
    { icon: Shield, label: 'إدارة الأدوار', action: onOpenProfile, show: isAdmin },
    { icon: Volume2, label: isRoomMuted ? 'إلغاء كتم الغرفة' : 'كتم الغرفة', action: onToggleRoomMute, show: isAdmin, color: isRoomMuted ? TUI.colors.red : undefined },
    { icon: Share2, label: 'مشاركة', action: onShare, show: true },
    { icon: UserPlus, label: 'دعوة', action: () => {}, show: true },
    { icon: Sparkles, label: 'تأثيرات', action: () => {}, show: true },
    { icon: Trophy, label: 'المتبرعين', action: onOpenTopGifters, show: true },
    { icon: Medal, label: 'الإنجازات', action: onOpenAchievements, show: hasAuthUser },
    { icon: DollarSign, label: 'الأرباح', action: onOpenEarnings, show: isOwner },
    { icon: AudioWaveform, label: 'بحث عن مستخدم', action: onOpenUserSearch, show: true },
    { icon: AlertTriangle, label: 'إبلاغ عن مستخدم', action: onOpenReport, show: hasAuthUser },
    { icon: LogOut, label: 'خروج', action: onClose, show: true, color: TUI.colors.red },
  ];

  const visibleItems = items.filter(item => item.show);

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />

      {/* Menu Panel */}
      <div
        className="absolute"
        style={{
          top: 48,
          right: 12,
          width: 200,
          backgroundColor: 'rgba(10, 107, 94, 0.98)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(20px)',
          animation: 'fadeInScale 0.2s ease',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grid of icons (3 columns) */}
        <div className="grid grid-cols-3 gap-1 p-2">
          {visibleItems.map((item, i) => (
            <button
              key={i}
              onClick={() => { item.action(); onClose(); }}
              className="flex flex-col items-center justify-center py-2.5 px-1 rounded-lg bg-transparent border-none cursor-pointer touch-manipulation relative"
              style={{
                transition: TUI.anim.fast,
                gap: 4,
              }}
              aria-label={item.label}
            >
              <div
                className="relative flex items-center justify-center rounded-full"
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: item.color ? `${item.color}20` : 'rgba(255,255,255,0.08)',
                }}
              >
                <item.icon size={18} style={{ color: item.color || TUI.colors.white }} />
                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <span
                    className="absolute -top-1 -right-1 flex items-center justify-center rounded-full"
                    style={{
                      width: 16,
                      height: 16,
                      backgroundColor: TUI.colors.red,
                      fontSize: 10,
                      fontWeight: 700,
                      color: TUI.colors.white,
                      border: '2px solid rgba(10, 107, 94, 0.98)',
                    }}
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span
                className="truncate w-full text-center"
                style={{ fontSize: 10, color: item.color || TUI.colors.G6, lineHeight: '14px' }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.9) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Notification Toasts (In-App Push) ───────────────────────────────────────

function NotificationToasts({
  notifications,
  onDismiss,
}: {
  notifications: RoomNotification[];
  onDismiss: (id: string) => void;
}) {
  // Only show the latest 3 notifications
  const visible = notifications.slice(0, 3);

  if (visible.length === 0) return null;

  return (
    <div
      className="fixed flex flex-col"
      style={{
        top: 60,
        left: 12,
        right: 12,
        gap: 8,
        zIndex: 45,
        pointerEvents: 'none',
      }}
    >
      {visible.map((notif) => (
        <div
          key={notif.id}
          className="flex items-start gap-3 px-4 py-3 rounded-xl cursor-pointer touch-manipulation"
          style={{
            backgroundColor: 'rgba(10, 40, 36, 0.95)',
            border: '1px solid rgba(0, 200, 150, 0.2)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            animation: 'notifSlideIn 0.3s ease-out',
            pointerEvents: 'auto',
            direction: 'rtl',
          }}
          onClick={() => onDismiss(notif.id)}
        >
          {/* Icon */}
          <div
            className="flex items-center justify-center flex-shrink-0 rounded-full"
            style={{
              width: 32,
              height: 32,
              backgroundColor: notif.type === 'invite' ? 'rgba(0, 200, 150, 0.2)' :
                               notif.type === 'kick' ? 'rgba(252, 85, 85, 0.2)' :
                               notif.type === 'seat_granted' ? 'rgba(96, 165, 250, 0.2)' :
                               'rgba(255, 255, 255, 0.08)',
            }}
          >
            <Bell size={14} style={{
              color: notif.type === 'invite' ? TUI.colors.tealLight :
                     notif.type === 'kick' ? TUI.colors.red :
                     notif.type === 'seat_granted' ? '#60a5fa' :
                     TUI.colors.white,
            }} />
          </div>

          {/* Content */}
          <div className="flex flex-col flex-1 min-w-0" style={{ gap: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: TUI.colors.white }}>
              {notif.title}
            </span>
            <span
              className="truncate"
              style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: '16px' }}
            >
              {notif.body}
            </span>
          </div>

          {/* Dismiss */}
          <button
            className="flex items-center justify-center flex-shrink-0 bg-transparent border-none cursor-pointer"
            style={{ color: 'rgba(255,255,255,0.3)', padding: 4 }}
            aria-label="إغلاق"
          >
            <X size={14} />
          </button>
        </div>
      ))}

      <style>{`
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function RoomInteriorView({
  room: initialRoom,
  onExit,
  authUser,
  onRoomUpdate,
}: RoomInteriorViewProps) {
  /* ── Voice room hook — all state and actions ── */
  const vr = useVoiceRoom(initialRoom, authUser, onRoomUpdate);

  /* ── WebRTC Voice hook — real P2P audio ── */
  const voiceRTC = useVoiceRTC({
    roomId: vr.room.id,
    userId: authUser?.id || '',
    displayName: authUser?.displayName || '',
    isOnSeat: !!vr.isOnSeat,
    isMicMuted: vr.isMicMuted,
  });

  /* ── Derived state ── */
  const isOwner = vr.myRole === 'owner';
  const isAdmin = canDo(vr.myRole, 'admin');
  const pendingSeatRequests = vr.participants.filter(p => p.seatStatus === 'request').length;

  /* ── Like hold state ── */
  const [likeActive, setLikeActive] = useState(false);

  /* ── Chat input state ── */
  const [chatInput, setChatInput] = useState('');

  /* ── End Live confirmation dialog (owner only) ── */
  const [showEndLiveDialog, setShowEndLiveDialog] = useState(false);

  /* ── Exit menu state (share/exit dropdown) ── */
  const [showExitMenu, setShowExitMenu] = useState(false);

  /* ── Seat management sheet state ── */
  const [seatMgmtOpen, setSeatMgmtOpen] = useState(false);

  /* ── Room info sheet state ── */
  const [roomInfoOpen, setRoomInfoOpen] = useState(false);

  /* ── Three-dots menu state ── */
  const [showDotsMenu, setShowDotsMenu] = useState(false);

  /* ── Audio settings dialog state ── */
  const [showAudioSettings, setShowAudioSettings] = useState(false);

  /* ── Gift recipient preselection ── */
  const [giftRecipient, setGiftRecipient] = useState<{ type: 'everyone' | 'mic' | 'specific'; userId?: string; displayName?: string } | null>(null);

  /* ── Floating reactions ── */
  const floatingReactions = useFloatingReactions();

  /* ── Soundboard state ── */
  const [showSoundboard, setShowSoundboard] = useState(false);

  /* ── Sound effects enabled ── */
  const [soundEnabled, setSoundEnabled] = useState(true);

  /* ── Recording indicator ── */
  const [isRecording, setIsRecording] = useState(false);

  /* ── Top Gifters sheet state ── */
  const [showTopGifters, setShowTopGifters] = useState(false);

  /* ── Achievements sheet state ── */
  const [showAchievements, setShowAchievements] = useState(false);

  /* ── Earnings sheet state ── */
  const [showEarnings, setShowEarnings] = useState(false);

  /* ── User search state ── */
  const [showUserSearch, setShowUserSearch] = useState(false);

  /* ── Report/Block dialog state ── */
  const [reportTarget, setReportTarget] = useState<{ userId: string; displayName: string } | null>(null);

  /* ── Mic layout ── */
  const micLayout = getMicLayout(vr.room.micTheme, vr.seats.length);

  /* ── Connection quality — from RTC stats */
  const connectionQuality = voiceRTC.connectionQuality;

  /* ── Do Not Disturb mode */
  const { isDND, toggle: toggleDND } = useDND();

  /* ── Accept/Reject seat handlers ── */
  async function handleAcceptSeat(userId: string) {
    try {
      await fetch(`/api/voice-rooms/${vr.room.id}?action=accept-seat`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });
      await vr.fetchParticipants();
    } catch { /* ignore */ }
  }

  async function handleRejectSeat(userId: string) {
    try {
      await fetch(`/api/voice-rooms/${vr.room.id}?action=reject-seat`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });
      await vr.fetchParticipants();
    } catch { /* ignore */ }
  }

  /* ── Toggle auto mode ── */
  async function handleToggleAutoMode() {
    await vr.handleUpdateSettings({ isAutoMode: !vr.room.isAutoMode });
  }

  /* ── GiftSheet onSendGift adapter ── */
  function handleGiftSend(giftId: string, quantity: number, recipient?: { type: 'everyone' | 'mic' | 'specific'; userId?: string }) {
    let recipientName: string | undefined = giftRecipient?.displayName;
    if (recipient?.type === 'specific' && recipient.userId && !recipientName) {
      const found = vr.participants.find(p => p.userId === recipient.userId);
      recipientName = found?.displayName;
    }
    if (recipient?.type === 'specific' && recipient.userId) {
      vr.handleSendGift(giftId, 'specific', quantity, recipient.userId, recipientName);
    } else if (recipient?.type === 'mic') {
      vr.handleSendGift(giftId, 'everyone', quantity);
    } else {
      vr.handleSendGift(giftId, 'everyone', quantity);
    }
    vr.setGiftSheetOpen(false);
    setGiftRecipient(null);
  }

  /* ── Send chat handler with word filter ── */
  function handleSendChat() {
    if (!chatInput.trim() || vr.isRoomMuted || !authUser) return;
    // Word filter
    const BANNED_WORDS = ['كس', 'زب', 'قحب', 'شرم', 'طيز', 'لخ', 'خرا', 'عير', 'كسم', 'متناك', 'شرموطة', 'قحبة', 'نيك', 'نيج', 'لقط', 'لعنة'];
    let msg = chatInput.trim();
    let filtered = false;
    for (const word of BANNED_WORDS) {
      const regex = new RegExp(word, 'gi');
      if (regex.test(msg)) { filtered = true; msg = msg.replace(regex, '*'.repeat(word.length)); }
    }
    vr.handleSendChat(msg);
    setChatInput('');
    if (filtered && soundEnabled) playErrorSound();
  }

  /* ── Close handler ── */
  function handleClose() {
    if (isOwner) {
      setShowEndLiveDialog(true);
    } else {
      vr.handleLeaveRoom().then(() => onExit(true));
    }
  }

  /* ── End Live confirmed ── */
  async function handleEndLive() {
    setShowEndLiveDialog(false);
    await vr.handleLeaveRoom();
    onExit(true);
  }

  /* ── Kick duration confirmed ── */
  function handleKickDurationConfirm(minutes: number) {
    const targetUserId = vr.micMenuSheet.participant?.userId;
    if (targetUserId) vr.handleKickTemp(minutes, targetUserId);
    vr.setKickDialogOpen(false);
  }

  /* ── Copy link ── */
  function handleShare() {
    vr.handleCopyLink();
  }

  /* ── Host participant ── */
  const hostParticipant = vr.participants.find(p => p.userId === vr.room.hostId);

  /* ── Bottom bar input ref ── */
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); }
    },
    [handleSendChat],
  );

  /* ── Background: use roomImage if set, otherwise teal-green gradient ── */
  const currentBgImage = vr.room.roomImage || '';
  const bgStyle: React.CSSProperties = currentBgImage
    ? {
        backgroundImage: `url(${currentBgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : { background: 'linear-gradient(180deg, #0D8A7A 0%, #0A6B5E 30%, #074a42 100%)' };

  // Overlay to ensure text readability over background images
  const bgOverlay = currentBgImage
    ? 'rgba(0,0,0,0.35)'
    : 'transparent';

  /* ── Left side menu icon style (shared) ── */
  const menuBtnStyle: React.CSSProperties = {
    width: 38,
    height: 38,
    backgroundColor: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.06)',
    transition: TUI.anim.fast,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  };

  /* ── Loading state ── */
  if (vr.loading) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center"
        style={{ ...bgStyle }}
      >
        <Loader2 size={40} className="animate-spin mb-4" style={{ color: TUI.colors.white }} />
        <span style={{ fontSize: TUI.font.body14.size, color: TUI.colors.white }}>جاري تحميل الغرفة...</span>
      </div>
    );
  }

  return (
    <>
      <InjectStyles />

      {/* ═══════════════════════════════════════════════════════════════════════
          ROOT CONTAINER
          Background: teal-green gradient (matching lobby & WAFA Ludo design)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="fixed inset-0 flex flex-col"
        style={{ ...bgStyle }}>
        {/* Dark overlay for readability when background image is set */}
        {currentBgImage && (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: bgOverlay, zIndex: 1 }}
          />
        )}
        {/* ════════════════════════════════════════════════════════
            MAIN CONTENT LAYER (z-10)
            ════════════════════════════════════════════════════════ */}
        {/* Hidden audio elements for WebRTC remote streams — handled inside useVoiceRTC hook directly */}

        <div className="relative z-10 flex flex-col h-full" style={currentBgImage ? { zIndex: 2 } : undefined}>

          {/* ════════════════════════════════════════════
              HEADER — Room name + ID + Share/Exit buttons
              ════════════════════════════════════════════ */}
          <div
            className="flex flex-col flex-shrink-0"
            style={{
              padding: '8px 12px 0',
              backgroundColor: 'rgba(7, 74, 66, 0.4)',
            }}
          >
            {/* ── Top Row: Room avatar + Room info + Action buttons ── */}
            <div className="flex items-center justify-between">
              {/* Right: Room avatar + name + ID */}
              <button
                type="button"
                onClick={() => setRoomInfoOpen(true)}
                className="flex items-center gap-2 min-w-0 bg-transparent border-none cursor-pointer touch-manipulation"
                style={{ flex: 1 }}
                aria-label="معلومات الغرفة"
              >
                {/* Room avatar */}
                <div
                  className="shrink-0 rounded-full overflow-hidden"
                  style={{
                    width: 40,
                    height: 40,
                    border: '2px solid rgba(255,255,255,0.25)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  {vr.room.roomAvatar ? (
                    <img src={vr.room.roomAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Mic size={18} color="rgba(255,255,255,0.5)" />
                    </div>
                  )}
                </div>

                {/* Name + ID */}
                <div className="flex flex-col items-start min-w-0">
                  <span
                    className="truncate"
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: TUI.colors.white,
                      maxWidth: 180,
                      lineHeight: '20px',
                    }}
                  >
                    {vr.room.name}
                  </span>
                  <span
                    className="truncate"
                    style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.45)',
                      maxWidth: 150,
                      lineHeight: '14px',
                      direction: 'ltr',
                      textAlign: 'right',
                    }}
                  >
                    {vr.room.id}
                  </span>
                </div>
              </button>

              {/* Left: RecordingIndicator (admin) + ThemeToggle + Settings (admin) + Share + Exit buttons */}
              <div className="flex items-center flex-shrink-0" style={{ gap: 6 }}>
                {/* Recording indicator — admin only */}
                <RecordingIndicator
                  isRecording={false}
                  onToggle={() => {}}
                  isAdmin={isAdmin}
                />
                {/* Theme toggle */}
                <ThemeToggle />
                {/* Do Not Disturb toggle */}
                <DoNotDisturbToggle isDND={isDND} onToggle={toggleDND} />
                {/* Settings button — admin/owner only, opens three-dots menu */}
                {isAdmin && (
                  <button
                    onClick={() => setShowDotsMenu(true)}
                    className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
                    style={{
                      width: 34,
                      height: 34,
                      minWidth: 44,
                      minHeight: 44,
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      transition: TUI.anim.fast,
                    }}
                    aria-label="الإعدادات"
                  >
                    <Settings2 size={16} style={{ color: TUI.colors.white }} />
                  </button>
                )}
                {/* Share button */}
                <button
                  onClick={handleShare}
                  className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
                  style={{
                    width: 34,
                    height: 34,
                    minWidth: 44,
                    minHeight: 44,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: TUI.anim.fast,
                  }}
                  aria-label="مشاركة الغرفة"
                >
                  <Share2 size={16} style={{ color: TUI.colors.white }} />
                </button>

                {/* Exit button with dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowExitMenu(prev => !prev)}
                    className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
                    style={{
                      width: 34,
                      height: 34,
                      minWidth: 44,
                      minHeight: 44,
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      transition: TUI.anim.fast,
                    }}
                    aria-label="خروج"
                  >
                    {isOwner
                      ? <X size={16} style={{ color: TUI.colors.red }} strokeWidth={2.5} />
                      : <LogIn size={16} style={{ color: TUI.colors.white }} />
                    }
                  </button>

                  {/* Exit dropdown menu */}
                  {showExitMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowExitMenu(false)}
                      />
                      <div
                        className="absolute z-50 flex flex-col"
                        style={{
                          top: 40,
                          left: 0,
                          backgroundColor: 'rgba(10, 40, 36, 0.95)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 12,
                          padding: '4px 0',
                          minWidth: 150,
                          backdropFilter: 'blur(16px)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                        }}
                      >
                        {/* Minimize / Keep room alive */}
                        <button
                          onClick={() => {
                            setShowExitMenu(false);
                            // Minimize room — hide view but keep room running
                            // DO NOT call handleLeaveRoom — just signal minimize
                            onExit(false);
                          }}
                          className="flex items-center gap-2.5 px-4 py-2.5 bg-transparent border-none cursor-pointer touch-manipulation w-full"
                          style={{ transition: TUI.anim.fast }}
                        >
                          <Minimize2 size={15} style={{ color: TUI.colors.G6 }} />
                          <span style={{ fontSize: 12, color: TUI.colors.white }}>
                            تصغير الغرفة
                          </span>
                        </button>
                        <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', margin: '2px 12px' }} />
                        {/* Leave and close room */}
                        <button
                          onClick={() => {
                            setShowExitMenu(false);
                            handleClose();
                          }}
                          className="flex items-center gap-2.5 px-4 py-2.5 bg-transparent border-none cursor-pointer touch-manipulation w-full"
                          style={{ transition: TUI.anim.fast }}
                        >
                          <LogOut size={15} style={{ color: TUI.colors.red }} />
                          <span style={{ fontSize: 12, color: TUI.colors.red }}>
                            {isOwner ? 'إنهاء البث' : 'مغادرة الغرفة'}
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════
              INFO ROW — Trophy/club + Online avatars + Count
              ════════════════════════════════════════════ */}
          <div
            className="flex items-center flex-shrink-0"
            style={{
              padding: '6px 12px 4px',
              gap: 10,
              backgroundColor: 'rgba(7, 74, 66, 0.25)',
            }}
          >
            {/* ── Left: Trophy — Member Club weekly gems ── */}
            <div
              className="flex items-center gap-1.5 flex-shrink-0"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: '4px 10px 4px 6px',
              }}
            >
              <Trophy size={14} fill="#f59e0b" stroke="#f59e0b" />
              <span style={{ fontSize: 10, fontWeight: 600, color: TUI.colors.gold }}>
                {vr.weeklyGems > 0 ? vr.weeklyGems.toLocaleString() : '0'}
              </span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>💎</span>
            </div>

            {/* ── Center: Online avatars (overlapping, no names) ── */}
            <div className="flex items-center flex-1 min-w-0 overflow-hidden">
              <div
                className="flex items-center"
                style={{ marginRight: -6 }}
              >
                {vr.participants.length > 0 ? (
                  vr.participants.slice(0, 8).map((p, i) => (
                    <div
                      key={p.userId}
                      className="relative rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 22,
                        height: 22,
                        marginLeft: i > 0 ? -6 : 0,
                        border: '1.5px solid rgba(7, 74, 66, 0.9)',
                        zIndex: 8 - i,
                      }}
                    >
                      {p.avatar ? (
                        <img src={p.avatar} alt={p.displayName} className="w-full h-full object-cover rounded-full" draggable={false} loading="lazy" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center rounded-full"
                          style={{
                            backgroundColor: getAvatarColorFromPalette(p.userId).bg,
                            color: getAvatarColorFromPalette(p.userId).text,
                            fontSize: 8,
                            fontWeight: 600,
                          }}
                        >
                          {p.displayName.charAt(0)}
                        </div>
                      )}
                      {/* Owner crown badge */}
                      {p.role === 'owner' && (
                        <div
                          className="absolute flex items-center justify-center"
                          style={{
                            top: -4,
                            right: -4,
                            width: 12,
                            height: 12,
                            backgroundColor: '#a78bfa',
                            borderRadius: '50%',
                            border: '1.5px solid rgba(7, 74, 66, 0.9)',
                          }}
                        >
                          <Crown size={7} fill="#fff" stroke="#fff" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 22,
                      height: 22,
                      backgroundColor: 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <Users size={10} style={{ color: TUI.colors.G5 }} />
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: Connection quality + Online count badge ── */}
            <div
              className="flex items-center gap-1 flex-shrink-0"
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: '4px 10px',
              }}
            >
              {/* Connection quality indicator */}
              <NetworkQualityIndicator quality={connectionQuality} />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: TUI.colors.white,
                  lineHeight: '14px',
                }}
              >
                {vr.participants.length}
              </span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
                متواجد
              </span>
            </div>
          </div>

          {/* ════════════════════════════════════════════
              RECONNECTION INDICATOR — shown when disconnected
              ════════════════════════════════════════════ */}
          <ReconnectIndicator isConnected={true} reconnectAttempt={0} />

          {/* ════════════════════════════════════════════
              ANNOUNCEMENT BAR — subtle dark
              ════════════════════════════════════════════ */}
          <div
            className="flex items-center flex-shrink-0"
            style={{
              padding: '6px 14px',
              backgroundColor: 'rgba(255, 193, 7, 0.08)',
              gap: 8,
              borderBottom: '1px solid rgba(255, 193, 7, 0.1)',
            }}
          >
            <Megaphone size={14} style={{ color: TUI.colors.goldDark, flexShrink: 0 }} />
            <span
              className="flex-1 min-w-0 truncate"
              style={{ fontSize: 12, color: TUI.colors.goldDark, lineHeight: '18px' }}
            >
              {vr.room.announcement || 'أضف إعلان غرفتك هنا'}
            </span>
            {isAdmin && (
              <button
                onClick={() => setRoomInfoOpen(true)}
                className="flex items-center justify-center bg-transparent border-none cursor-pointer touch-manipulation flex-shrink-0"
                style={{ padding: 4, minWidth: 32, minHeight: 32 }}
                aria-label="تعديل الإعلان"
              >
                <Pencil size={12} style={{ color: TUI.colors.goldDark }} />
              </button>
            )}
          </div>

          {/* ════════════════════════════════════════════
              MIC SEAT AREA — layout based on micTheme
              ════════════════════════════════════════════ */}
          <MicSeatGrid
            seats={vr.seats}
            layoutId={micLayout.id}
            onSeatClick={vr.handleSeatClick}
            speakingPeers={voiceRTC.speakingPeers}
            localUserId={authUser?.id || ''}
            localSpeaking={voiceRTC.localSpeaking}
          />

          {/* ════════════════════════════════════════════
              CHAT PANEL
              ════════════════════════════════════════════ */}
          <ChatPanel
            messages={vr.chatMessages}
            isRoomMuted={vr.isRoomMuted}
            authUser={authUser}
            participants={vr.participants}
            onProfileClick={(p) => vr.setProfileSheet(p)}
          />

          {/* ════════════════════════════════════════════
              LIKE ANIMATION (left side overlay)
              ════════════════════════════════════════════ */}
          {!isDND && (
            <div
              className="absolute left-4 bottom-20 pointer-events-none"
              style={{ width: 80, height: 200, zIndex: 30 }}
            >
              <LikeAnimation active={likeActive} />
            </div>
          )}

          {/* ════════════════════════════════════════════
              GIFT ANIMATIONS (overlay)
              ════════════════════════════════════════════ */}
          {!isDND && <GiftAnimations activeAnimation={vr.activeGiftAnimation} />}

          {/* ════════════════════════════════════════════
              FLOATING REACTIONS (overlay)
              ════════════════════════════════════════════ */}
          {!isDND && (
            <FloatingReactionsOverlay reactions={floatingReactions.reactions} onReact={floatingReactions.addReaction} />
          )}

          {/* Quick reaction bar */}
          {!isDND && (
            <QuickReactionBar
              visible={floatingReactions.showBar}
              onClose={() => floatingReactions.setShowBar(false)}
              onReact={(emoji) => {
                floatingReactions.addReaction(emoji);
                // Also add a burst of multiple
                for (let i = 1; i <= 3; i++) {
                  setTimeout(() => floatingReactions.addReaction(emoji), i * 150);
                }
              }}
            />
          )}

          {/* ════════════════════════════════════════════
              BOTTOM BAR — TUILiveKit: chat input | like | gift | speaker
              ════════════════════════════════════════════ */}
          <footer
            className="flex-shrink-0 w-full"
            style={{
              padding: '6px 10px',
              paddingBottom: 'max(6px, env(safe-area-inset-bottom, 6px))',
              backgroundColor: 'rgba(7, 74, 66, 0.75)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderTop: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div className="flex items-center w-full" style={{ gap: 6 }}>

              {/* Chat text input (pill) */}
              <div
                className="flex items-center flex-1 min-w-0"
                style={{
                  height: 36,
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  borderRadius: '9999px',
                  padding: '0 14px',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={
                    vr.isRoomMuted ? 'الغرفة مكتومة'
                    : !authUser ? 'سجل دخولك للمشاركة'
                    : 'اكتب رسالة...'
                  }
                  disabled={vr.isRoomMuted || !authUser}
                  maxLength={200}
                  dir="rtl"
                  className="flex-1 min-w-0 bg-transparent outline-none"
                  style={{ fontSize: 12, color: TUI.colors.white, caretColor: 'rgba(255,255,255,0.6)' }}
                />
                {chatInput.trim() && !vr.isRoomMuted && authUser && (
                  <button
                    onClick={() => { handleSendChat(); inputRef.current?.focus(); }}
                    className="flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
                    style={{ width: 26, height: 26, color: 'rgba(255,255,255,0.7)', transition: TUI.anim.fast }}
                    aria-label="إرسال"
                  >
                    <Send size={13} />
                  </button>
                )}
              </div>

              {/* Like / Heart button */}
              {authUser && (
                <button
                  onTouchStart={() => { setLikeActive(true); if (soundEnabled) playGiftReceivedSound(); }}
                  onTouchEnd={() => setLikeActive(false)}
                  onMouseDown={() => { setLikeActive(true); if (soundEnabled) playGiftReceivedSound(); }}
                  onMouseUp={() => setLikeActive(false)}
                  onMouseLeave={() => setLikeActive(false)}
                  className="rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation relative"
                  style={{
                    width: 38, height: 38, minWidth: 44, minHeight: 44,
                    transition: TUI.anim.fast,
                  }}
                  aria-label="إعجاب"
                >
                  <Heart
                    size={22}
                    fill={likeActive ? TUI.colors.likeRed : 'none'}
                    style={{
                      color: likeActive ? TUI.colors.likeRed : 'rgba(255,255,255,0.55)',
                      transform: likeActive ? 'scale(1.2)' : 'scale(1)',
                      transition: 'transform 0.15s ease, fill 0.15s ease',
                      filter: likeActive ? 'drop-shadow(0 0 6px rgba(255,59,48,0.5))' : 'none',
                    }}
                  />
                </button>
              )}

              {/* Quick reaction button */}
              {authUser && (
                <button
                  onClick={floatingReactions.toggleBar}
                  className="rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
                  style={{
                    width: 38, height: 38, minWidth: 44, minHeight: 44,
                    backgroundColor: floatingReactions.showBar ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.07)',
                    transition: TUI.anim.fast,
                  }}
                  aria-label="ردود فعل"
                >
                  <Sparkles size={18} style={{ color: floatingReactions.showBar ? TUI.colors.gold : 'rgba(255,255,255,0.55)' }} />
                </button>
              )}

              {/* Gift button (golden glow with badge) */}
              {authUser && (
                <button
                  onClick={() => vr.setGiftSheetOpen(true)}
                  className="rounded-[10px] flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation relative overflow-hidden"
                  style={{
                    width: 38, height: 38, minWidth: 44, minHeight: 44,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #f59e0b 100%)',
                    backgroundSize: '200% 200%',
                    boxShadow: '0 2px 12px rgba(245,158,11,0.4)',
                    transition: TUI.anim.fast,
                    animation: 'giftShimmer 3s ease-in-out infinite',
                  }}
                  aria-label="إرسال هدية"
                >
                  <Gift size={18} fill={TUI.colors.white} style={{ color: TUI.colors.white, zIndex: 1, position: 'relative' }} />
                  {/* Unread gifts count badge */}
                  {vr.topGifts.length > 0 && (
                    <span
                      className="absolute flex items-center justify-center rounded-full"
                      style={{
                        top: -4,
                        right: -4,
                        minWidth: 16,
                        height: 16,
                        padding: '0 4px',
                        backgroundColor: TUI.colors.red,
                        fontSize: 9,
                        fontWeight: 700,
                        color: TUI.colors.white,
                        boxShadow: `0 0 6px ${TUI.colors.red}`,
                        border: '2px solid rgba(7, 74, 66, 0.9)',
                        zIndex: 2,
                      }}
                    >
                      {vr.topGifts.length > 9 ? '9+' : vr.topGifts.length}
                    </span>
                  )}
                </button>
              )}

              {/* Audio Settings button — ALL users can access this */}
              <button
                onClick={() => setShowAudioSettings(true)}
                className="rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
                style={{
                  width: 36, height: 36, minWidth: 44, minHeight: 44,
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  transition: TUI.anim.fast,
                }}
                aria-label="إعدادات الصوت"
              >
                <AudioWaveform size={17} style={{ color: 'rgba(255,255,255,0.6)' }} />
              </button>

              {/* Soundboard button */}
              <button
                onClick={() => setShowSoundboard(!showSoundboard)}
                className="rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
                style={{
                  width: 36, height: 36, minWidth: 44, minHeight: 44,
                  backgroundColor: showSoundboard ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.07)',
                  border: showSoundboard ? '1px solid rgba(245, 158, 11, 0.3)' : 'none',
                  transition: TUI.anim.fast,
                }}
                aria-label="لوحة المؤثرات"
              >
                <AudioWaveform size={16} style={{ color: showSoundboard ? TUI.colors.gold : 'rgba(255,255,255,0.5)' }} />
              </button>

              {/* Voice control buttons */}
              {/* Mic toggle — when user is on a mic seat (including owner/admin) */}
              {vr.isOnSeat && (
                <button
                  onClick={async () => {
                    voiceRTC.toggleMic();
                    await vr.handleToggleMic();
                  }}
                  className="rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
                  style={{
                    width: 36, height: 36, minWidth: 44, minHeight: 44,
                    backgroundColor: voiceRTC.isLocalMicMuted ? 'rgba(252, 85, 85, 0.15)' : 'rgba(255,255,255,0.07)',
                    transition: TUI.anim.fast,
                  }}
                  aria-label={voiceRTC.isLocalMicMuted ? 'فتح المايك' : 'كتم المايك'}
                >
                  {voiceRTC.isLocalMicMuted
                    ? <MicOff size={17} style={{ color: TUI.colors.red }} />
                    : <Mic size={17} style={{ color: voiceRTC.localSpeaking ? TUI.colors.tealLight : 'rgba(255,255,255,0.6)' }} />}
                </button>
              )}
              {/* Speaker toggle — mute/unmute room audio (local playback) */}
              <button
                onClick={voiceRTC.toggleSpeaker}
                className="rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
                style={{
                  width: 36, height: 36, minWidth: 44, minHeight: 44,
                  backgroundColor: voiceRTC.isSpeakerMuted ? 'rgba(252, 85, 85, 0.15)' : 'rgba(255,255,255,0.07)',
                  transition: TUI.anim.fast,
                }}
                aria-label={voiceRTC.isSpeakerMuted ? 'تشغيل السماعة' : 'كتم السماعة'}
              >
                <Headphones size={17} style={{ color: voiceRTC.isSpeakerMuted ? TUI.colors.red : 'rgba(255,255,255,0.6)' }} />
              </button>
            </div>
          </footer>

          {/* ════════════════════════════════════════════
              SOUNDBOARD PANEL
              ════════════════════════════════════════════ */}
          {showSoundboard && (
            <div
              className="flex-shrink-0 w-full"
              style={{
                padding: '8px 12px',
                paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
                backgroundColor: 'rgba(7, 74, 66, 0.9)',
                backdropFilter: 'blur(16px)',
                borderTop: '1px solid rgba(245, 158, 11, 0.15)',
                animation: 'notifSlideIn 0.2s ease-out',
              }}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <span style={{ fontSize: 11, fontWeight: 600, color: TUI.colors.gold }}>لوحة المؤثرات الصوتية 🔊</span>
                <button onClick={() => setSoundEnabled(!soundEnabled)} className="flex items-center gap-1 bg-transparent border-none cursor-pointer" style={{ padding: '2px 8px' }}>
                  <span style={{ fontSize: 10, color: soundEnabled ? TUI.colors.green : TUI.colors.red }}>{soundEnabled ? '🔊 مفعّل' : '🔇 مكتوم'}</span>
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {SOUNDBOARD_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (soundEnabled) {
                        item.play(); // Play locally
                        voiceRTC.sendSoundEffect(item.id); // Send to all room members
                      }
                    }}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-transparent border-none cursor-pointer touch-manipulation active:scale-90"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      transition: TUI.anim.fast,
                      minHeight: 56,
                    }}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span style={{ fontSize: 9, color: TUI.colors.G6, marginTop: 2 }}>{item.nameAr}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            LEFT SIDE VERTICAL MENU — TUILiveKit-style floating function buttons
            ════════════════════════════════════════════════════════════════════ */}
        <div
          className="fixed flex-col items-center"
          style={{
            left: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 20,
            gap: 8,
          }}
        >
          {/* Chat / Messages */}
          <button
            className="flex flex-col items-center cursor-pointer touch-manipulation bg-transparent border-none"
            onClick={() => inputRef.current?.focus()}
            aria-label="الرسائل"
          >
            <div className="flex items-center justify-center" style={{ ...menuBtnStyle, borderRadius: 12 }}>
              <MessageSquare size={16} style={{ color: 'rgba(255,255,255,0.55)' }} />
            </div>
          </button>

          {/* Seat Management (admin only) */}
          {isAdmin && (
            <button
              className="flex flex-col items-center cursor-pointer touch-manipulation bg-transparent border-none relative"
              onClick={() => setSeatMgmtOpen(true)}
              aria-label="إدارة المقاعد"
            >
              <div className="flex items-center justify-center" style={{ ...menuBtnStyle, borderRadius: 12 }}>
                <UserCog size={16} style={{ color: 'rgba(255,255,255,0.55)' }} />
              </div>
              {pendingSeatRequests > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex items-center justify-center rounded-full"
                  style={{ width: 14, height: 14, backgroundColor: TUI.colors.red, fontSize: 8, fontWeight: 700, color: '#fff', border: '1.5px solid rgba(10,14,39,0.9)' }}
                >
                  {pendingSeatRequests > 9 ? '9' : pendingSeatRequests}
                </span>
              )}
            </button>
          )}

          {/* Share */}
          <button
            className="flex flex-col items-center cursor-pointer touch-manipulation bg-transparent border-none"
            onClick={handleShare}
            aria-label="مشاركة"
          >
            <div className="flex items-center justify-center" style={{ ...menuBtnStyle, borderRadius: 12 }}>
              <Share2 size={16} style={{ color: 'rgba(255,255,255,0.55)' }} />
            </div>
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            THREE-DOTS MENU OVERLAY
            ════════════════════════════════════════════════════════════════════ */}
        {/* ════════════════════════════════════════════════════════
            PUSH NOTIFICATION TOASTS (in-app)
            ════════════════════════════════════════════════════════ */}
        <div style={isDND ? { opacity: 0.3, transition: 'opacity 0.3s ease' } : undefined}>
          <NotificationToasts
            notifications={voiceRTC.notifications}
            onDismiss={voiceRTC.clearNotification}
          />
        </div>

        <ThreeDotsMenu
          isOpen={showDotsMenu}
          onClose={() => setShowDotsMenu(false)}
          isAdmin={isAdmin}
          isOwner={isOwner}
          pendingRequests={pendingSeatRequests}
          onOpenSettings={() => vr.setSettingsOpen(true)}
          onOpenSeatMgmt={() => setSeatMgmtOpen(true)}
          onOpenRoomInfo={() => setRoomInfoOpen(true)}
          onOpenProfile={() => {}}
          onShare={handleShare}
          onToggleRoomMute={vr.handleToggleRoomMute}
          isRoomMuted={vr.isRoomMuted}
          onOpenTopGifters={() => setShowTopGifters(true)}
          onOpenAchievements={() => setShowAchievements(true)}
          onOpenEarnings={() => setShowEarnings(true)}
          onOpenUserSearch={() => setShowUserSearch(true)}
          onOpenReport={() => {
            // If there's a mic menu participant selected, report them
            const target = vr.micMenuSheet.participant;
            if (target) {
              setReportTarget({ userId: target.userId, displayName: target.displayName });
            }
          }}
          hasAuthUser={!!authUser}
        />

        {/* ════════════════════════════════════════════════════════════════════
            ALL SHEETS & DIALOGS (z-50)
            SettingsSheet and all others — EXACTLY unchanged
            ════════════════════════════════════════════════════════════════════ */}

        {/* ── Settings Sheet (owner/admin only) ── */}
        {isAdmin && (
          <SettingsSheet
            isOpen={vr.settingsOpen}
            onClose={() => vr.setSettingsOpen(false)}
            room={vr.room}
            onUpdate={(data) => vr.handleUpdateSettings(data)}
          />
        )}

        {/* ── Gift Sheet ── */}
        {authUser && (
          <GiftSheet
            key={giftRecipient?.userId || 'default'}
            isOpen={vr.giftSheetOpen}
            onClose={() => { vr.setGiftSheetOpen(false); setGiftRecipient(null); }}
            onSendGift={handleGiftSend}
            gems={vr.myGemsBalance}
            preselectedRecipient={giftRecipient}
            micParticipants={vr.participants.filter(p => p.userId !== authUser?.id).map(p => ({
              userId: p.userId,
              displayName: p.displayName,
              avatar: p.avatar,
            }))}
          />
        )}

        {/* ── Profile Sheet ── */}
        <ProfileSheet
          isOpen={!!vr.profileSheet}
          onClose={() => vr.setProfileSheet(null)}
          participant={vr.profileSheet}
          currentUserId={vr.currentUserId}
          myRole={vr.myRole}
          hostId={vr.room.hostId}
          stats={vr.profileStats ? {
            daysActive: 0,
            giftsSent: vr.profileStats.giftsSent,
            giftsReceived: vr.profileStats.giftsReceived,
            totalReceivedValue: vr.profileStats.totalReceivedValue ?? 0,
          } : undefined}
          onKickTemp={vr.handleProfileKickTemp}
          onBan={vr.handleProfileBan}
          onChangeRole={vr.handleChangeRole}
          onRemoveRole={vr.handleRemoveRole}
          onInviteToMic={vr.handleInviteToMic}
          onGiftClick={() => {
            const targetUser = vr.profileSheet;
            setGiftRecipient({
              type: 'specific',
              userId: targetUser?.userId,
              displayName: targetUser?.displayName,
            });
            vr.setProfileSheet(null);
            setTimeout(() => vr.setGiftSheetOpen(true), 300);
          }}
          authUserId={authUser?.id}
        />

        {/* ── Mic Menu Sheet ── */}
        <MicMenuSheet
          isOpen={vr.micMenuSheet.isOpen}
          onClose={() => vr.setMicMenuSheet(prev => ({ ...prev, isOpen: false }))}
          state={vr.micMenuSheet}
          myRole={vr.myRole}
          isAutoMode={vr.room.isAutoMode}
          onAction={vr.handleMicMenuAction}
        />

        {/* ── Seat Management Sheet (owner/admin only) ── */}
        {isAdmin && (
          <SeatManagementSheet
            isOpen={seatMgmtOpen}
            onClose={() => setSeatMgmtOpen(false)}
            participants={vr.participants}
            seats={vr.seats}
            isAutoMode={vr.room.isAutoMode}
            onToggleAutoMode={handleToggleAutoMode}
            onAcceptSeat={handleAcceptSeat}
            onRejectSeat={handleRejectSeat}
            // @ts-expect-error — pre-existing
            onKickFromMic={vr.handleKickFromMic as unknown as (userId: string) => void}
            onInviteToMic={vr.handleInviteToMic as unknown as () => void}
          />
        )}

        {/* ── Room Info Sheet ── */}
        <RoomInfoSheet
          isOpen={roomInfoOpen}
          onClose={() => setRoomInfoOpen(false)}
          room={vr.room}
          participantCount={vr.participants.length}
          participants={vr.participants}
          weeklyGems={vr.weeklyGems}
          topGifts={vr.topGifts}
          isOwner={isOwner}
          onUpdateAvatar={async (avatarBase64: string) => { await vr.handleUpdateSettings({ roomAvatar: avatarBase64 }); }}
        />

        {/* ── Kick Duration Dialog ── */}
        <KickDurationDialog
          isOpen={vr.kickDialogOpen}
          onClose={() => vr.setKickDialogOpen(false)}
          onConfirm={handleKickDurationConfirm}
        />

        {/* ── Membership / Role Invitation Dialog ── */}
        <MembershipDialog
          isOpen={!!vr.pendingInvite}
          onClose={() => vr.setPendingInvite('')}
          onAccept={vr.handleAcceptInvite}
          onReject={vr.handleRejectInvite}
          roleLabel={ROLE_LABELS[vr.pendingInvite as RoomRole] || vr.pendingInvite}
        />

        {/* ── Audio Settings Dialog (all users) ── */}
        <AudioSettingsDialog
          isOpen={showAudioSettings}
          onClose={() => setShowAudioSettings(false)}
          onMicChange={voiceRTC.changeMicDevice}
          onSpeakerChange={voiceRTC.changeSpeakerDevice}
        />

        {/* ── Mic Invite Dialog ── */}
        <MicInviteDialog
          isOpen={vr.pendingMicInvite >= 0}
          onClose={() => vr.setPendingMicInvite(-1)}
          onAccept={vr.handleAcceptMicInvite}
          onReject={vr.handleRejectMicInvite}
          seatIndex={vr.pendingMicInvite}
        />

        {/* ── End Live Confirmation Dialog (owner only) ── */}
        {showEndLiveDialog && (
          <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: 60, backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowEndLiveDialog(false); }}
          >
            <div
              className="flex flex-col items-center w-[300px] p-6"
              style={{
                backgroundColor: '#0A6B5E',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.08)',
                animation: TUI.anim.drawer,
              }}
            >
              <div className="flex items-center justify-center mb-4" style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(252, 85, 85, 0.15)' }}>
                <AlertTriangle size={24} style={{ color: TUI.colors.red }} />
              </div>
              <h3 className="mb-3 font-bold text-center" style={{ fontSize: TUI.font.title16.size, fontWeight: 600, color: TUI.colors.white }}>
                إنهاء الغرفة
              </h3>
              <p className="mb-6 text-center leading-relaxed" style={{ fontSize: TUI.font.body14.size, color: 'rgba(255,255,255,0.6)', lineHeight: '22px' }}>
                هل أنت متأكد من إنهاء الغرفة؟ سيتم إخراج جميع المشاركين.
              </p>
              <button
                onClick={handleEndLive}
                className="w-full mb-3 flex items-center justify-center cursor-pointer"
                style={{ height: 44, backgroundColor: TUI.colors.red, color: TUI.colors.white, borderRadius: 10, border: 'none', fontSize: TUI.font.title16.size, fontWeight: 600, transition: TUI.anim.fast }}
              >
                إنهاء
              </button>
              <button
                onClick={() => setShowEndLiveDialog(false)}
                className="w-full flex items-center justify-center cursor-pointer"
                style={{ height: 44, backgroundColor: 'rgba(255,255,255,0.08)', color: TUI.colors.white, borderRadius: 10, border: 'none', fontSize: TUI.font.title16.size, fontWeight: 500, transition: TUI.anim.fast }}
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* ── Top Gifters Sheet ── */}
        <TopGiftersSheet
          isOpen={showTopGifters}
          onClose={() => setShowTopGifters(false)}
          topGifters={vr.topGifts?.map((g, idx) => ({
            userId: `gift-${idx}`,
            displayName: g.senderName,
            avatar: g.senderAvatar,
            totalValue: g.gems,
          })) ?? []}
        />

        {/* ── Achievements Sheet ── */}
        <AchievementsSheet
          isOpen={showAchievements}
          onClose={() => setShowAchievements(false)}
          userId={authUser?.id || ''}
        />

        {/* ── Earnings Sheet (owner only) ── */}
        <EarningsSheet
          isOpen={showEarnings}
          onClose={() => setShowEarnings(false)}
          roomId={vr.room.id}
          userId={authUser?.id || ''}
        />

        {/* ════════════════════════════════════════════════════════════════════
            DAILY REWARD TOAST — auto-checks and shows claim prompt
            ════════════════════════════════════════════════════════════════════ */}
        <DailyRewardToast userId={authUser?.id} />

        {/* ════════════════════════════════════════════════════════════════════
            USER SEARCH — search participants within the room
            ════════════════════════════════════════════════════════════════════ */}
        <UserSearchBar
          isOpen={showUserSearch}
          onClose={() => setShowUserSearch(false)}
          participants={vr.participants.map(p => ({
            userId: p.userId,
            displayName: p.displayName,
            avatar: p.avatar,
            role: p.role,
          }))}
          onUserSelect={(userId) => {
            setShowUserSearch(false);
          }}
        />

        {/* ════════════════════════════════════════════════════════════════════
            REPORT & BLOCK DIALOG — report/block a user
            ════════════════════════════════════════════════════════════════════ */}
        <ReportBlockDialog
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetUserId={reportTarget?.userId || ''}
          targetDisplayName={reportTarget?.displayName || ''}
          reporterUserId={authUser?.id}
          roomId={vr.room.id}
        />
      </div>
    </>
  );
}
