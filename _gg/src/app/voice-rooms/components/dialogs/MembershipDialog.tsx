'use client';

import { useCallback } from 'react';
import { Star } from 'lucide-react';
import { TUI } from '../../types';

/* ═══════════════════════════════════════════════════════════════════════
   MembershipDialog — TUILiveKit Role Invitation Acceptance

   Center modal with star icon, role invitation message,
   accept (blue) and reject (text) buttons.
   ═══════════════════════════════════════════════════════════════════════ */

interface MembershipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  roleLabel: string;
}

export default function MembershipDialog({
  isOpen,
  onClose,
  onAccept,
  onReject,
  roleLabel,
}: MembershipDialogProps) {
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
        {/* ── Star Icon ── */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)' }}
        >
          <Star size={32} style={{ color: '#f59e0b', fill: 'rgba(245, 158, 11, 0.3)' }} />
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
          دعوة للانضمام
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
          تمت دعوتك لتصبح{' '}
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>{roleLabel}</span>
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
