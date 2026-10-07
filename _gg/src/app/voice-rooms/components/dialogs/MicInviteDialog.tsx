'use client';

import { useCallback } from 'react';
import { Mic } from 'lucide-react';
import { TUI } from '../../types';

/* ═══════════════════════════════════════════════════════════════════════
   MicInviteDialog — TUILiveKit Mic Seat Invitation

   Center modal with green mic icon, seat invitation message,
   accept (blue) and reject (text) buttons.
   ═══════════════════════════════════════════════════════════════════════ */

interface MicInviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  seatIndex: number;
}

export default function MicInviteDialog({
  isOpen,
  onClose,
  onAccept,
  onReject,
  seatIndex,
}: MicInviteDialogProps) {
  const handleAccept = useCallback(() => {
    onAccept();
    onClose();
  }, [onAccept, onClose]);

  const handleReject = useCallback(() => {
    onReject();
    onClose();
  }, [onReject, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: TUI.colors.black80 }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center gap-4"
        style={{
          backgroundColor: TUI.colors.G2,
          borderRadius: TUI.radius.xl,
          maxWidth: 320,
          width: '100%',
          padding: 24,
          animation: `${TUI.anim.spring} forwards`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Mic Icon ── */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(41, 204, 106, 0.12)' }}
        >
          <Mic size={32} style={{ color: TUI.colors.green }} />
        </div>

        {/* ── Title ── */}
        <h2
          className="text-center"
          style={{
            fontSize: TUI.font.title16.size,
            fontWeight: 700,
            color: TUI.font.title16.color,
          }}
        >
          دعوة للمايك
        </h2>

        {/* ── Body ── */}
        <p
          className="text-center"
          style={{
            fontSize: TUI.font.body14.size,
            color: TUI.font.body14.color,
            lineHeight: 1.6,
          }}
        >
          تمت دعوتك للصعود على مقعد{' '}
          <span style={{ color: TUI.colors.green, fontWeight: 600 }}>{seatIndex + 1}</span>
        </p>

        {/* ── Accept Button ── */}
        <button
          onClick={handleAccept}
          className="w-full rounded-[8px] text-white font-bold transition-all hover:brightness-110 active:scale-[0.98]"
          style={{
            backgroundColor: TUI.colors.B1,
            height: 44,
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          قبول
        </button>

        {/* ── Reject ── */}
        <button
          onClick={handleReject}
          className="w-full text-center py-1 transition-colors hover:opacity-80"
          style={{ color: TUI.colors.G6, fontSize: 14 }}
        >
          رفض
        </button>
      </div>
    </div>
  );
}
