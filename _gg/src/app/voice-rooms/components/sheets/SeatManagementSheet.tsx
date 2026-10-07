'use client';

import { UserPlus, LogOut } from 'lucide-react';
import BottomSheetOverlay from '../shared/BottomSheetOverlay';
import {
  TUI,
  type VoiceRoomParticipant,
  type SeatData,
} from '../../types';

interface SeatManagementSheetProps {
  isOpen: boolean;
  onClose: () => void;
  participants: VoiceRoomParticipant[];
  seats: SeatData[];
  isAutoMode: boolean;
  onToggleAutoMode: () => void;
  onAcceptSeat: (userId: string) => void;
  onRejectSeat: (userId: string) => void;
  onKickFromMic: (userId: string) => void;
  onInviteToMic: () => void;
}

export default function SeatManagementSheet({
  isOpen,
  onClose,
  participants,
  seats,
  isAutoMode,
  onToggleAutoMode,
  onAcceptSeat,
  onRejectSeat,
  onKickFromMic,
  onInviteToMic,
}: SeatManagementSheetProps) {
  /* Seated participants */
  const seated = participants.filter((p) => p.seatIndex >= 0);
  const maxSeats = seats.length;

  /* Applicants (seatStatus === 'request') */
  const applicants = participants.filter((p) => p.seatStatus === 'request');

  /* Empty mic — no one seated */
  const isMicEmpty = seated.length === 0;

  return (
    <BottomSheetOverlay
      isOpen={isOpen}
      onClose={onClose}
      height="724px"
      title="إدارة المقاعد"
      showClose
    >
      {/* ── Header row: title + invite button ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1" /> {/* Spacer for centering */}
        <button
          onClick={onInviteToMic}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <UserPlus size={16} color={TUI.colors.B1} />
          <span
            style={{
              fontSize: TUI.font.caption12.size,
              fontWeight: 500,
              color: TUI.colors.B1,
            }}
          >
            دعوة
          </span>
        </button>
      </div>

      {/* ── Auto Mode Toggle ── */}
      <div className="flex items-center justify-between mb-4">
        <span
          style={{
            fontSize: TUI.font.body14.size,
            fontWeight: 500,
            color: TUI.colors.G7,
          }}
        >
          تحتاج موافقة
        </span>
        {/* Toggle switch */}
        <button
          onClick={onToggleAutoMode}
          className="relative shrink-0 transition-colors"
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            backgroundColor: !isAutoMode ? TUI.colors.B1 : TUI.colors.sliderEmpty,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span
            className="absolute top-[2px] transition-all"
            style={{
              width: 20,
              height: 20,
              borderRadius: TUI.radius.circle,
              backgroundColor: TUI.colors.white,
              left: !isAutoMode ? 22 : 2,
            }}
          />
        </button>
      </div>

      {/* ── Divider ── */}
      <div
        className="mb-4"
        style={{
          height: 1,
          backgroundColor: TUI.colors.G3Divider,
        }}
      />

      {/* ── Section 1: On Mic ── */}
      <div className="mb-4">
        <p
          className="mb-3"
          style={{
            fontSize: TUI.font.body14.size,
            fontWeight: 500,
            color: TUI.colors.G7,
          }}
        >
          على المايك ({seated.length}/{maxSeats})
        </p>

        {isMicEmpty ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <span
              style={{
                fontSize: TUI.font.captionG5.size,
                color: TUI.colors.G5,
              }}
            >
              لا يوجد أحد على المايك
            </span>
            <button
              onClick={onInviteToMic}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <UserPlus size={16} color={TUI.colors.B1} />
              <span
                style={{
                  fontSize: TUI.font.caption12.size,
                  fontWeight: 500,
                  color: TUI.colors.B1,
                }}
              >
                دعوة
              </span>
            </button>
          </div>
        ) : (
          /* ── Seated List (scrollable, max 280px) ── */
          <div
            className="flex flex-col gap-0 overflow-y-auto tuilivekit-scroll"
            style={{ maxHeight: 280 }}
          >
            {seated.map((p) => (
              <div
                key={p.userId}
                className="flex items-center gap-3"
                style={{
                  height: TUI.dim.itemHeight,
                  borderBottom: `1px solid ${TUI.colors.G3Divider}`,
                }}
              >
                {/* Avatar 40px */}
                <div
                  className="shrink-0 overflow-hidden"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: TUI.radius.circle,
                    backgroundColor: TUI.colors.bgInput,
                  }}
                >
                  {p.avatar ? (
                    <img
                      src={p.avatar}
                      alt={p.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span style={{ fontSize: 16, color: TUI.colors.G6 }}>
                        {p.displayName?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Name + seat badge */}
                <div className="flex-1 min-w-0">
                  <span
                    className="block truncate"
                    style={{
                      fontSize: TUI.font.body14.size,
                      color: TUI.colors.G7,
                    }}
                  >
                    {p.displayName}
                  </span>
                  <span
                    className="inline-block px-2 py-0.5 rounded-full"
                    style={{
                      fontSize: '10px',
                      color: TUI.colors.G6,
                      backgroundColor: TUI.colors.blue30,
                    }}
                  >
                    مقعد {p.seatIndex + 1}
                  </span>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => onKickFromMic(p.userId)}
                  className="shrink-0 flex items-center gap-1"
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 8px',
                  }}
                >
                  <LogOut size={16} color={TUI.colors.red} />
                  <span
                    style={{
                      fontSize: TUI.font.actionRed.size,
                      color: TUI.colors.red,
                      fontWeight: TUI.font.actionRed.weight as unknown as number,
                    }}
                  >
                    إنهاء
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 2: Seat Requests ── */}
      {applicants.length > 0 && (
        <div>
          <p
            className="mb-3"
            style={{
              fontSize: TUI.font.body14.size,
              fontWeight: 500,
              color: TUI.colors.G7,
            }}
          >
            طلبات المايك ({applicants.length})
          </p>

          <div className="flex flex-col gap-0">
            {applicants.map((p) => (
              <div
                key={p.userId}
                className="flex items-center gap-3"
                style={{
                  height: TUI.dim.itemHeight,
                  borderBottom: `1px solid ${TUI.colors.G3Divider}`,
                }}
              >
                {/* Avatar */}
                <div
                  className="shrink-0 overflow-hidden"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: TUI.radius.circle,
                    backgroundColor: TUI.colors.bgInput,
                  }}
                >
                  {p.avatar ? (
                    <img
                      src={p.avatar}
                      alt={p.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span style={{ fontSize: 16, color: TUI.colors.G6 }}>
                        {p.displayName?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Name */}
                <span
                  className="flex-1 truncate"
                  style={{
                    fontSize: TUI.font.body14.size,
                    color: TUI.colors.G7,
                  }}
                >
                  {p.displayName}
                </span>

                {/* Accept button */}
                <button
                  onClick={() => onAcceptSeat(p.userId)}
                  className="shrink-0 px-4 py-1.5 rounded-full"
                  style={{
                    backgroundColor: TUI.colors.B1,
                    color: TUI.colors.white,
                    fontSize: TUI.font.caption12.size,
                    fontWeight: 500,
                    borderRadius: TUI.radius.pill,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  قبول
                </button>

                {/* Reject button */}
                <button
                  onClick={() => onRejectSeat(p.userId)}
                  className="shrink-0 px-4 py-1.5 rounded-full"
                  style={{
                    backgroundColor: 'transparent',
                    color: TUI.colors.G6,
                    fontSize: TUI.font.caption12.size,
                    fontWeight: 400,
                    borderRadius: TUI.radius.pill,
                    border: `1px solid ${TUI.colors.G6}`,
                    cursor: 'pointer',
                  }}
                >
                  رفض
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </BottomSheetOverlay>
  );
}
