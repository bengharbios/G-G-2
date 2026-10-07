'use client';

import { useState, useCallback } from 'react';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { TUI } from '../../types';

/* ═══════════════════════════════════════════════════════════════════════
   PasswordDialog — TUILiveKit Password Entry for Key-Mode Rooms

   Center modal, lock icon, centered password input with
   show/hide toggle, error message area, submit + cancel.
   ═══════════════════════════════════════════════════════════════════════ */

interface PasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
}

export default function PasswordDialog({ isOpen, onClose, onSubmit }: PasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const resetForm = useCallback(() => {
    setPassword('');
    setShowPassword(false);
    setError('');
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(() => {
    if (!password.trim()) {
      setError('يرجى إدخال كلمة المرور');
      return;
    }
    onSubmit(password.trim());
    resetForm();
  }, [password, onSubmit, resetForm]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit();
    },
    [handleSubmit],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: TUI.colors.black80 }}
      onClick={handleClose}
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
        {/* ── Title ── */}
        <h2
          className="text-center"
          style={{
            fontSize: TUI.font.title16.size,
            fontWeight: 700,
            color: TUI.font.title16.color,
          }}
        >
          كلمة المرور
        </h2>

        {/* ── Lock Icon ── */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${TUI.colors.strokePrimary}40` }}
        >
          <KeyRound size={32} style={{ color: TUI.colors.G5 }} />
        </div>

        {/* ── Password Input ── */}
        <div className="relative w-full">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder="أدخل كلمة المرور"
            className="w-full text-center outline-none transition-colors"
            style={{
              backgroundColor: TUI.colors.bgInput,
              border: `1px solid ${TUI.colors.strokePrimary}`,
              color: TUI.colors.G7,
              borderRadius: TUI.radius.md,
              height: 44,
              fontSize: 15,
              paddingInlineEnd: 44,
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-1/2 left-3 -translate-y-1/2 p-1"
            style={{ color: TUI.colors.G5 }}
            tabIndex={-1}
            aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* ── Error Message ── */}
        {error && (
          <p className="text-center text-xs" style={{ color: TUI.colors.red }}>
            {error}
          </p>
        )}

        {/* ── Submit Button ── */}
        <button
          onClick={handleSubmit}
          disabled={!password.trim()}
          className="w-full rounded-[8px] text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: password.trim() ? TUI.colors.B1 : TUI.colors.sliderEmpty,
            height: 40,
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          تأكيد
        </button>

        {/* ── Cancel ── */}
        <button
          onClick={handleClose}
          className="text-center py-1 transition-colors hover:opacity-80"
          style={{ color: TUI.colors.G6, fontSize: 14 }}
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
