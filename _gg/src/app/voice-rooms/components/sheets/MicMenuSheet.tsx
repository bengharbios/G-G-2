'use client';

import { useState } from 'react';
import {
  User,
  ArrowUpCircle,
  ArrowLeftRight,
  Lock,
  Unlock,
  XCircle,
  MicOff,
  UserMinus,
  Ban,
  LogOut,
  AlertTriangle,
  Volume2,
} from 'lucide-react';
import BottomSheetOverlay from '../shared/BottomSheetOverlay';
import {
  TUI,
  ROLE_LABELS,
  ROLE_COLORS,
  ROLE_LEVELS,
  canDo,
  type MicMenuSheetState,
  type RoomRole,
  type VoiceRoomParticipant,
} from '../../types';

// ── Report reasons ──
const REPORT_REASONS = [
  { id: 'spam', label: 'سبام' },
  { id: 'inappropriate', label: 'محتوى غير لائق' },
  { id: 'harassment', label: 'تحرش' },
  { id: 'other', label: 'آخر' },
];

interface MicMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  state: MicMenuSheetState;
  myRole: RoomRole;
  isAutoMode: boolean;
  onAction: (action: string) => void;
  /** Called when user submits a report for another user */
  onReport?: (userId: string, reason: string) => void;
  /** Called when user blocks another user */
  onBlock?: (userId: string) => void;
  /** Called when volume slider changes for a peer (0-100) */
  onVolumeChange?: (userId: string, volume: number) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  dividerAfter?: boolean;
}

export default function MicMenuSheet({
  isOpen,
  onClose,
  state,
  myRole,
  isAutoMode,
  onAction,
  onReport,
  onBlock,
  onVolumeChange,
}: MicMenuSheetProps) {
  const { seatIndex, participant, mySeatIndex } = state;
  const isAdmin = canDo(myRole, 'admin');
  const isOwner = canDo(myRole, 'coowner');
  const isOnMySeat = seatIndex === mySeatIndex;
  const isOccupied = !!participant;
  const isLocked = !isOccupied; // we detect locked from parent; empty but unlocked = open

  // ── Report dialog state ──
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  // ── Volume state ──
  const [volume, setVolume] = useState(100);

  const buildMenu = (): MenuItem[] => {
    const items: MenuItem[] = [];

    if (isOnMySeat) {
      /* ── My own seat ── */
      items.push({
        id: 'profile',
        label: 'الملف الشخصي',
        icon: <User size={22} />,
        color: TUI.colors.G7,
      });

      items.push({
        id: 'leave-seat',
        label: 'مغادرة المقعد',
        icon: <LogOut size={22} />,
        color: TUI.colors.red,
        dividerAfter: true,
      });
    } else if (isOccupied && participant) {
      /* ── Someone else's seat ── */
      const participantLevel = ROLE_LEVELS[participant.role] || 0;
      const myLevel = ROLE_LEVELS[myRole] || 0;

      // Profile (always visible)
      items.push({
        id: 'profile',
        label: 'الملف الشخصي',
        icon: <User size={22} />,
        color: TUI.colors.G7,
      });

      if (isAdmin && myLevel > participantLevel) {
        // Mute/Unmute
        items.push({
          id: participant.isMuted ? 'unmute' : 'mute',
          label: participant.isMuted ? 'إلغاء الكتم' : 'كتم',
          icon: participant.isMuted ? (
            <Unlock size={22} />
          ) : (
            <MicOff size={22} />
          ),
          color: participant.isMuted ? TUI.colors.green : TUI.colors.G7,
        });

        // Kick off mic
        items.push({
          id: 'close-seat',
          label: 'إغلاق المقعد',
          icon: <XCircle size={22} />,
          color: TUI.colors.red,
          dividerAfter: true,
        });

        // Kick temp
        items.push({
          id: 'kick-temp',
          label: 'طرد مؤقت',
          icon: <UserMinus size={22} />,
          color: TUI.colors.red,
        });

        // Ban
        items.push({
          id: 'kick-permanent',
          label: 'طرد نهائي',
          icon: <Ban size={22} />,
          color: TUI.colors.red,
        });
      }

      // ── Report (available for all users viewing other users' seats) ──
      items.push({
        id: '__report',
        label: 'إبلاغ',
        icon: <AlertTriangle size={22} />,
        color: TUI.colors.red,
        dividerAfter: !isAdmin || (isAdmin && myLevel <= participantLevel),
      });

      // ── Block (available for all users viewing other users' seats) ──
      items.push({
        id: '__block',
        label: 'حظر',
        icon: <Ban size={22} />,
        color: TUI.colors.orange,
      });
    } else {
      /* ── Empty seat ── */
      // Profile area (empty)
      items.push({
        id: 'profile',
        label: 'الملف الشخصي',
        icon: <User size={22} />,
        color: TUI.colors.G7,
        dividerAfter: true,
      });

      if (isAdmin) {
        // Take seat
        if (mySeatIndex < 0) {
          items.push({
            id: 'take-seat',
            label: 'صعود',
            icon: <ArrowUpCircle size={22} />,
            color: TUI.colors.B1,
          });
        }

        // Change mic (if already on another seat)
        if (mySeatIndex >= 0) {
          items.push({
            id: 'change-mic',
            label: 'نقل',
            icon: <ArrowLeftRight size={22} />,
            color: TUI.colors.B1,
          });
        }

        // Lock/Unlock
        items.push({
          id: 'toggle-lock',
          label: 'قفل',
          icon: <Lock size={22} />,
          color: TUI.colors.G7,
        });

        // Invite someone
        items.push({
          id: 'invite',
          label: 'دعوة',
          icon: <User size={22} />,
          color: TUI.colors.B1,
        });
      }
    }

    return items;
  };

  const menuItems = buildMenu();

  const handleAction = (actionId: string) => {
    // Handle special actions locally
    if (actionId === '__report') {
      setShowReportDialog(true);
      return;
    }
    if (actionId === '__block') {
      if (participant && onBlock) {
        onBlock(participant.userId);
      }
      onClose();
      return;
    }
    onAction(actionId);
    onClose();
  };

  const handleReportSubmit = () => {
    if (participant && onReport && selectedReason) {
      onReport(participant.userId, selectedReason);
    }
    setShowReportDialog(false);
    setSelectedReason(null);
    onClose();
  };

  const handleReportCancel = () => {
    setShowReportDialog(false);
    setSelectedReason(null);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    if (participant && onVolumeChange) {
      onVolumeChange(participant.userId, val);
    }
  };

  const renderAvatar = () => {
    if (isOccupied && participant) {
      return (
        <div
          className="shrink-0 overflow-hidden"
          style={{
            width: 36,
            height: 36,
            borderRadius: TUI.radius.circle,
            backgroundColor: TUI.colors.bgInput,
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
              <span style={{ fontSize: 16, color: TUI.colors.G6 }}>
                {participant.displayName?.charAt(0) || '?'}
              </span>
            </div>
          )}
        </div>
      );
    }
    return (
      <div
        className="shrink-0 flex items-center justify-center"
        style={{
          width: 36,
          height: 36,
          borderRadius: TUI.radius.circle,
          backgroundColor: TUI.colors.bgInput,
        }}
      >
        <span style={{ fontSize: 14, color: TUI.colors.G5 }}>
          {seatIndex + 1}
        </span>
      </div>
    );
  };

  // Determine if we should show volume slider (occupied seat of other user)
  const showVolumeSlider = isOccupied && participant && !isOnMySeat && !!onVolumeChange;

  return (
    <BottomSheetOverlay
      isOpen={isOpen}
      onClose={onClose}
      height="auto"
      showClose
    >
      {/* Participant header */}
      <div className="flex items-center gap-3 mb-1 pb-3" style={{ borderBottom: `1px solid ${TUI.colors.G3Divider}` }}>
        {renderAvatar()}
        <div className="flex-1 min-w-0">
          <span
            className="block truncate"
            style={{
              fontSize: TUI.font.title16.size,
              fontWeight: 600,
              color: TUI.colors.white,
            }}
          >
            {isOccupied && participant ? participant.displayName : `مقعد ${seatIndex + 1}`}
          </span>
          {isOccupied && participant && (
            <span
              style={{
                fontSize: TUI.font.captionG5.size,
                color: ROLE_COLORS[participant.role],
              }}
            >
              {ROLE_LABELS[participant.role]}
            </span>
          )}
          {!isOccupied && (
            <span style={{ fontSize: TUI.font.captionG5.size, color: TUI.colors.G5 }}>
              فارغ
            </span>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="mt-1">
        {menuItems.map((item, idx) => (
          <div key={item.id}>
            <button
              onClick={() => handleAction(item.id)}
              className="flex items-center gap-3 w-full py-0 transition-colors"
              style={{
                height: TUI.dim.itemHeight,
                padding: '0 4px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {/* Icon */}
              <div className="flex items-center justify-center" style={{ color: item.color }}>
                {item.icon}
              </div>
              {/* Label */}
              <span
                className="flex-1 text-right"
                style={{
                  fontSize: TUI.font.body14.size,
                  fontWeight: 500,
                  color: item.color,
                }}
              >
                {item.label}
              </span>
            </button>

            {/* Divider */}
            {item.dividerAfter && idx < menuItems.length - 1 && (
              <div
                style={{
                  height: 1,
                  backgroundColor: TUI.colors.G3Divider,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Volume Slider (for other users' occupied seats) ── */}
      {showVolumeSlider && (
        <div style={{ marginTop: 8, padding: '12px 4px' }}>
          <div
            style={{
              height: 1,
              backgroundColor: TUI.colors.G3Divider,
              marginBottom: 12,
            }}
          />
          <div className="flex items-center gap-3">
            <Volume2 size={20} style={{ color: TUI.colors.G7, flexShrink: 0 }} />
            <div className="flex-1" style={{ direction: 'ltr' }}>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={handleVolumeChange}
                style={{
                  width: '100%',
                  height: 4,
                  appearance: 'none' as any,
                  WebkitAppearance: 'none' as any,
                  background: `linear-gradient(to right, ${TUI.colors.sliderFilled} ${volume}%, ${TUI.colors.sliderEmpty} ${volume}%)`,
                  borderRadius: 2,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>
            <span
              style={{
                fontSize: TUI.font.captionG5.size,
                color: TUI.colors.G6,
                minWidth: 32,
                textAlign: 'center',
                direction: 'ltr',
              }}
            >
              {volume}%
            </span>
          </div>
        </div>
      )}

      {/* ── Report Dialog Overlay ── */}
      {showReportDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Backdrop */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
            }}
            onClick={handleReportCancel}
          />

          {/* Dialog Content */}
          <div
            style={{
              position: 'relative',
              width: '85%',
              maxWidth: 340,
              backgroundColor: TUI.colors.G2,
              borderRadius: TUI.radius.xl,
              padding: 24,
              boxShadow: TUI.shadow.card,
            }}
          >
            {/* Dialog Title */}
            <div
              style={{
                fontSize: TUI.font.title16.size,
                fontWeight: 600,
                color: TUI.colors.white,
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              إبلاغ عن المستخدم
            </div>

            {/* Dialog Subtitle */}
            <div
              style={{
                fontSize: TUI.font.captionG5.size,
                color: TUI.colors.G5,
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
              اختر سبب الإبلاغ
            </div>

            {/* Reason Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: TUI.radius.md,
                    border: selectedReason === reason.id
                      ? `1.5px solid ${TUI.colors.red}`
                      : `1px solid ${TUI.colors.strokePrimary}`,
                    backgroundColor: selectedReason === reason.id
                      ? 'rgba(252, 85, 85, 0.08)'
                      : TUI.colors.bgOperate,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Radio indicator */}
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: selectedReason === reason.id
                        ? `2px solid ${TUI.colors.red}`
                        : `2px solid ${TUI.colors.G4}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {selectedReason === reason.id && (
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: TUI.colors.red,
                        }}
                      />
                    )}
                  </div>

                  {/* Reason label */}
                  <span
                    style={{
                      fontSize: TUI.font.body14.size,
                      fontWeight: 500,
                      color: selectedReason === reason.id
                        ? TUI.colors.white
                        : TUI.colors.G7,
                    }}
                  >
                    {reason.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={handleReportCancel}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: TUI.radius.lg,
                  border: `1px solid ${TUI.colors.strokePrimary}`,
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: TUI.font.body14.size,
                  fontWeight: 500,
                  color: TUI.colors.G6,
                }}
              >
                إلغاء
              </button>
              <button
                onClick={handleReportSubmit}
                disabled={!selectedReason}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: TUI.radius.lg,
                  border: 'none',
                  backgroundColor: selectedReason
                    ? TUI.colors.red
                    : TUI.colors.G4,
                  cursor: selectedReason ? 'pointer' : 'not-allowed',
                  fontSize: TUI.font.body14.size,
                  fontWeight: 600,
                  color: TUI.colors.white,
                  opacity: selectedReason ? 1 : 0.5,
                  transition: 'all 0.2s ease',
                }}
              >
                إرسال
              </button>
            </div>
          </div>
        </div>
      )}
    </BottomSheetOverlay>
  );
}
