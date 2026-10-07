'use client';

import { useState, useCallback } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { TUI } from '../../types';

/* ═══════════════════════════════════════════════════════════════════════
   KickDurationDialog — TUILiveKit Temporary Kick Duration Selection

   Center modal with destructive styling. Duration options as cards
   with red selected border. Red confirm button.
   ═══════════════════════════════════════════════════════════════════════ */

interface KickDurationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (minutes: number) => void;
}

const DURATION_OPTIONS = [
  { label: '10 دقائق', value: 10 },
  { label: '30 دقيقة', value: 30 },
  { label: 'ساعة واحدة', value: 60 },
  { label: '24 ساعة', value: 1440 },
];

export default function KickDurationDialog({ isOpen, onClose, onConfirm }: KickDurationDialogProps) {
  const [selected, setSelected] = useState<number>(30);

  const handleClose = useCallback(() => {
    setSelected(30);
    onClose();
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    onConfirm(selected);
    setSelected(30);
  }, [selected, onConfirm]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: TUI.colors.black80 }}
      onClick={handleClose}
    >
      <div
        className="relative flex flex-col gap-4"
        style={{
          backgroundColor: TUI.colors.G2,
          borderRadius: TUI.radius.xl,
          maxWidth: 300,
          width: '100%',
          padding: 24,
          animation: `${TUI.anim.spring} forwards`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${TUI.colors.red}15` }}
          >
            <AlertTriangle size={20} style={{ color: TUI.colors.red }} />
          </div>
          <h2
            style={{
              fontSize: TUI.font.title16.size,
              fontWeight: 700,
              color: TUI.font.title16.color,
            }}
          >
            طرد مؤقت
          </h2>
          <p style={{ fontSize: TUI.font.captionG5.size, color: TUI.font.captionG5.color }}>
            اختر مدة الطرد
          </p>
        </div>

        {/* ── Duration Options ── */}
        <div className="flex flex-col gap-2">
          {DURATION_OPTIONS.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                className="flex items-center gap-3 px-4 transition-all"
                style={{
                  height: 60,
                  backgroundColor: TUI.colors.bgInput,
                  borderRadius: TUI.radius.md,
                  border: isSelected
                    ? `1.5px solid ${TUI.colors.red}`
                    : `1px solid ${TUI.colors.strokePrimary}`,
                }}
              >
                <Clock
                  size={18}
                  style={{
                    color: isSelected ? TUI.colors.red : TUI.colors.G5,
                    transition: 'color 200ms',
                  }}
                />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? TUI.colors.G8 : TUI.colors.G7,
                    transition: 'color 200ms',
                  }}
                >
                  {opt.label}
                </span>
                {/* Radio indicator */}
                <span
                  className="mr-auto w-4 h-4 rounded-full flex items-center justify-center"
                  style={{
                    border: `2px solid ${isSelected ? TUI.colors.red : TUI.colors.G4}`,
                    transition: 'border-color 200ms',
                  }}
                >
                  {isSelected && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: TUI.colors.red }}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Confirm Button (Destructive) ── */}
        <button
          onClick={handleConfirm}
          className="w-full rounded-[8px] text-white font-bold transition-all hover:brightness-110 active:scale-[0.98]"
          style={{
            backgroundColor: TUI.colors.red,
            height: 44,
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          تأكيد الطرد
        </button>

        {/* ── Cancel ── */}
        <button
          onClick={handleClose}
          className="w-full text-center py-1 transition-colors hover:opacity-80"
          style={{ color: TUI.colors.G6, fontSize: 14 }}
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
