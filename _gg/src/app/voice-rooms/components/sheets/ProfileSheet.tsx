'use client';

import { useState } from 'react';
import {
  Mic,
  Gift,
  UserMinus,
  Shield,
  Crown,
  Star,
  User,
  Timer,
  Ban,
  X,
  ImageIcon,
} from 'lucide-react';
import BottomSheetOverlay from '../shared/BottomSheetOverlay';
import {
  TUI,
  ROLE_LABELS,
  ROLE_COLORS,
  ROLE_LEVELS,
  canDo,
  getAvatarColor,
  type VoiceRoomParticipant,
  type RoomRole,
} from '../../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  participant: VoiceRoomParticipant | null;
  currentUserId: string;
  myRole: RoomRole;
  hostId?: string;
  stats?: {
    daysActive: number;
    giftsSent: number;
    giftsReceived: number;
    totalReceivedValue: number;
  };
  onKickTemp?: (userId: string) => void;
  onBan?: (userId: string) => void;
  onChangeRole?: (userId: string, role: RoomRole) => void;
  onRemoveRole?: (userId: string) => void;
  onInviteToMic?: (userId: string) => void;
  onGiftClick?: () => void;
  authUserId?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_CHANGE_OPTIONS: { value: RoomRole; label: string; icon: typeof Shield }[] = [
  { value: 'member', label: 'عضو', icon: User },
  { value: 'admin', label: 'إدارة', icon: Shield },
  { value: 'coowner', label: 'نيابة', icon: Crown },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Section card wrapper */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{ backgroundColor: '#1c2035' }}
    >
      {children}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileSheet({
  isOpen,
  onClose,
  participant,
  currentUserId,
  myRole,
  hostId,
  stats,
  onKickTemp,
  onBan,
  onChangeRole,
  onRemoveRole,
  onInviteToMic,
  onGiftClick,
  authUserId,
}: ProfileSheetProps) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  if (!participant) return null;

  // ── Derived state ──────────────────────────────────────────────────────────

  const isMe = participant.userId === currentUserId;
  const isOwnerOrCoowner = canDo(myRole, 'coowner');
  const isOwner = myRole === 'owner';
  const isAdmin = canDo(myRole, 'admin');
  const targetRole = participant.role;
  const targetLevel = ROLE_LEVELS[targetRole] || 0;
  const myLevel = ROLE_LEVELS[myRole] || 0;
  const canManage = isAdmin && !isMe && myLevel > targetLevel;
  const isGuest = !participant?.username || participant?.userId?.startsWith('guest-');

  // ── Height calculation ─────────────────────────────────────────────────────

  const calcHeight = () => {
    // Chrome (drag indicator 24px + header 48px) + padding (48px)
    let h = 120;
    // Avatar header
    h += 80;
    // Stats row
    h += 88;
    // Gaps between always-visible sections
    h += 24;

    // Guest indicator
    if (isGuest) h += 52;

    // Role management
    if (isOwnerOrCoowner && !isMe) {
      h += 12; // gap
      if (targetRole === 'visitor') {
        h += 48; // Grant membership
      }
      if (!isGuest && targetRole !== 'owner' && targetRole !== 'visitor') {
        h += 48; // Change role button
        if (showRoleMenu) h += 50; // Expanded pill menu
      }
      if (!isGuest && targetRole !== 'owner' && targetRole !== 'visitor' && onRemoveRole) {
        h += 44; // Remove role
      }
    }

    // Admin actions
    if (canManage) {
      h += 12;
      h += 48; // kick + ban row
    }

    // Bottom action buttons
    h += 12;
    h += 84;

    return `${Math.min(h, 680)}px`;
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleRoleChange = (role: RoomRole) => {
    if (onChangeRole) onChangeRole(participant.userId, role);
    setShowRoleMenu(false);
  };

  const handleRemoveRole = () => {
    if (onRemoveRole) onRemoveRole(participant.userId);
    setShowRoleMenu(false);
  };

  const handleGrantMembership = () => {
    if (onChangeRole) onChangeRole(participant.userId, 'member');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <BottomSheetOverlay
      isOpen={isOpen}
      onClose={onClose}
      height={calcHeight()}
      zIndex={55}
    >
      {/* ══════════════════════════════════════════════════════════════════════
          1. HEADER — Large Avatar + Name + Role Pill + VIP Level
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-3 mb-4">
        {/* 56px Avatar with purple border */}
        <div
          className="shrink-0 overflow-hidden"
          style={{
            width: 56,
            height: 56,
            borderRadius: TUI.radius.circle,
            border: '2px solid #6c63ff',
            backgroundColor: participant.avatar
              ? 'transparent'
              : getAvatarColor(participant.userId),
          }}
        >
          {participant.avatar ? (
            <img
              src={participant.avatar}
              alt={participant.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon size={24} color="#6c63ff" />
            </div>
          )}
        </div>

        {/* Name + Role + VIP */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="truncate"
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#f0f0f8',
                lineHeight: 1.3,
              }}
            >
              {participant.displayName}
            </span>

            {/* Role pill badge */}
            <span
              className="shrink-0 px-2 py-0.5 rounded-full"
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: ROLE_COLORS[targetRole],
                backgroundColor: `${ROLE_COLORS[targetRole]}20`,
              }}
            >
              {ROLE_LABELS[targetRole]}
            </span>

            {/* VIP level indicator */}
            {participant.vipLevel > 0 && (
              <span
                className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#f59e0b',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                }}
              >
                <Crown size={10} />
                {participant.vipLevel}
              </span>
            )}
          </div>

          {/* Subtitle line: numeric ID or guest indicator */}
          <span
            className="block mt-0.5"
            style={{
              fontSize: '12px',
              color: TUI.colors.G5,
            }}
          >
            {isGuest
              ? 'زائر • مستخدم غير مسجل'
              : participant.numericId
                ? `ID: ${participant.numericId}`
                : `@${participant.username || participant.userId.slice(0, 10)}`}
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          2. STATS ROW — Gifts Sent / Gifts Received / Jewels
         ══════════════════════════════════════════════════════════════════════ */}
      <Card className="mb-3">
        <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {/* Gifts Sent */}
          <div className="flex flex-col items-center py-3">
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#f0f0f8' }}>
              {stats?.giftsSent ?? 0}
            </span>
            <span style={{ fontSize: '10px', color: TUI.colors.G5, marginTop: 2 }}>
              هدايا مرسلة
            </span>
          </div>

          {/* Gifts Received */}
          <div
            className="flex flex-col items-center py-3"
            style={{ borderColor: 'rgba(255,255,255,0.06)', borderLeftWidth: 1 }}
          >
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#f0f0f8' }}>
              {stats?.giftsReceived ?? 0}
            </span>
            <span style={{ fontSize: '10px', color: TUI.colors.G5, marginTop: 2 }}>
              هدايا مستلمة
            </span>
          </div>

          {/* Jewels */}
          <div
            className="flex flex-col items-center py-3"
            style={{ borderColor: 'rgba(255,255,255,0.06)', borderLeftWidth: 1 }}
          >
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#f0f0f8' }}>
              {stats?.totalReceivedValue ?? 0}
            </span>
            <span style={{ fontSize: '10px', color: TUI.colors.G5, marginTop: 2 }}>
              جواهر
            </span>
          </div>
        </div>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════════
          3. GUEST INDICATOR — for unregistered users
         ══════════════════════════════════════════════════════════════════════ */}
      {isGuest && (
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-3"
          style={{
            backgroundColor: 'rgba(148, 163, 184, 0.1)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
          }}
        >
          <User size={16} color={TUI.colors.G5} />
          <span style={{ fontSize: '12px', color: TUI.colors.G5 }}>
            مستخدم غير مسجل • يمكن منح العضوية لهذا المستخدم
          </span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          4. ROLE MANAGEMENT — Owner/CoOwner only
         ══════════════════════════════════════════════════════════════════════ */}
      {isOwnerOrCoowner && !isMe && (
        <div className="mb-3">
          {/* Grant Membership — for visitors */}
          {targetRole === 'visitor' && (
            <button
              onClick={handleGrantMembership}
              className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 transition-colors"
              style={{
                backgroundColor: 'rgba(41, 204, 106, 0.1)',
                border: '1px solid rgba(41, 204, 106, 0.25)',
                cursor: 'pointer',
              }}
            >
              <Star size={20} color="#29CC6A" />
              <div className="text-right flex-1">
                <span
                  className="block"
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#29CC6A',
                  }}
                >
                  منح العضوية
                </span>
                <span
                  className="block mt-0.5"
                  style={{ fontSize: '10px', color: TUI.colors.G5 }}
                >
                  ترقية الزائر إلى عضو في الغرفة
                </span>
              </div>
            </button>
          )}

          {/* Change Role — for members, admins, coowners */}
          {!isGuest && targetRole !== 'owner' && targetRole !== 'visitor' && (
            <div className="flex flex-col gap-2">
              {/* Role change trigger */}
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 transition-colors"
                style={{
                  backgroundColor: '#1c2035',
                  border: `1px solid ${TUI.colors.strokePrimary}`,
                  cursor: 'pointer',
                }}
              >
                <Shield size={18} color={ROLE_COLORS[targetRole]} />
                <span
                  className="flex-1 text-right"
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: ROLE_COLORS[targetRole],
                  }}
                >
                  تغيير الدور — {ROLE_LABELS[targetRole]}
                </span>
                <Ban
                  size={14}
                  color={TUI.colors.G5}
                  style={{
                    transform: showRoleMenu ? 'rotate(180deg)' : 'none',
                    transition: TUI.anim.fast,
                  }}
                />
              </button>

              {/* Expanded role menu — pill buttons */}
              {showRoleMenu && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{
                    backgroundColor: '#1c2035',
                    border: `1px solid ${TUI.colors.strokePrimary}`,
                  }}
                >
                  {ROLE_CHANGE_OPTIONS.filter(
                    (opt) => ROLE_LEVELS[opt.value] < myLevel,
                  ).map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = targetRole === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleRoleChange(opt.value)}
                        className="flex items-center gap-1.5 flex-1 justify-center py-1.5 rounded-full transition-all"
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: `1px solid ${isSelected ? ROLE_COLORS[opt.value] : TUI.colors.strokePrimary}`,
                          backgroundColor: isSelected
                            ? `${ROLE_COLORS[opt.value]}20`
                            : 'transparent',
                          color: ROLE_COLORS[opt.value],
                        }}
                      >
                        <Icon size={13} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Remove Role button */}
              {!isGuest && onRemoveRole && (
                <button
                  onClick={handleRemoveRole}
                  className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 transition-colors"
                  style={{
                    backgroundColor: 'rgba(252, 85, 85, 0.08)',
                    border: '1px solid rgba(252, 85, 85, 0.2)',
                    cursor: 'pointer',
                  }}
                >
                  <UserMinus size={18} color={TUI.colors.red} />
                  <span
                    className="flex-1 text-right"
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: TUI.colors.red,
                    }}
                  >
                    إزالة الدور
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          5. ADMIN ACTIONS — Kick Temp + Ban
         ══════════════════════════════════════════════════════════════════════ */}
      {canManage && (
        <div className="flex items-center gap-2 mb-3">
          {/* Kick Temp — orange bordered */}
          {onKickTemp && (
            <button
              onClick={() => onKickTemp(participant.userId)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 transition-colors"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#FF643D',
                backgroundColor: 'rgba(255, 100, 61, 0.08)',
                border: '1px solid rgba(255, 100, 61, 0.3)',
                cursor: 'pointer',
              }}
            >
              <Timer size={16} />
              طرد مؤقت
            </button>
          )}

          {/* Ban — red bordered */}
          {onBan && (
            <button
              onClick={() => onBan(participant.userId)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 transition-colors"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: TUI.colors.red,
                backgroundColor: 'rgba(252, 85, 85, 0.08)',
                border: '1px solid rgba(252, 85, 85, 0.3)',
                cursor: 'pointer',
              }}
            >
              <Ban size={16} />
              حظر
            </button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          6. BOTTOM ACTION BUTTONS — Invite to Mic / Send Gift / Frame / Close
         ══════════════════════════════════════════════════════════════════════ */}
      {!isMe && (
        <div className="flex items-center gap-2">
          {/* Invite to Mic — green border */}
          {onInviteToMic && (
            <button
              onClick={() => onInviteToMic(participant.userId)}
              className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl py-3 transition-colors"
              style={{
                backgroundColor: 'rgba(41, 204, 106, 0.08)',
                border: '1px solid rgba(41, 204, 106, 0.35)',
                cursor: 'pointer',
              }}
            >
              <Mic size={20} color="#29CC6A" />
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  color: '#29CC6A',
                }}
              >
                دعوة للميك
              </span>
            </button>
          )}

          {/* Send Gift — gold */}
          {onGiftClick && (
            <button
              onClick={onGiftClick}
              className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl py-3 transition-colors"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                cursor: 'pointer',
              }}
            >
              <Gift size={20} color="#f59e0b" />
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  color: '#f59e0b',
                }}
              >
                إرسال هدية
              </span>
            </button>
          )}

          {/* Frame 5 min — purple */}
          {canManage && (
            <button
              onClick={() => {
                if (onKickTemp) onKickTemp(participant.userId);
              }}
              className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl py-3 transition-colors"
              style={{
                backgroundColor: 'rgba(108, 99, 255, 0.08)',
                border: '1px solid rgba(108, 99, 255, 0.35)',
                cursor: 'pointer',
              }}
            >
              <Timer size={20} color="#6c63ff" />
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  color: '#6c63ff',
                }}
              >
                إطار 5 د
              </span>
            </button>
          )}

          {/* Close — gray */}
          <button
            onClick={onClose}
            className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl py-3 transition-colors"
            style={{
              backgroundColor: 'rgba(148, 163, 184, 0.08)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              cursor: 'pointer',
            }}
          >
            <X size={20} color={TUI.colors.G5} />
            <span
              style={{
                fontSize: '10px',
                fontWeight: 500,
                color: TUI.colors.G5,
              }}
            >
              إغلاق
            </span>
          </button>
        </div>
      )}
    </BottomSheetOverlay>
  );
}
