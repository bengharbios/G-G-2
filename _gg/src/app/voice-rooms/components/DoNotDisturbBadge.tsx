'use client';

import { useState, useCallback } from 'react';
import { Moon } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   useDND — Do Not Disturb hook
   
   Persists DND state in localStorage under key `vr_dnd`.
   When DND is on, floating reactions, gift animations, and
   notification toasts should be suppressed or dimmed.
   ═══════════════════════════════════════════════════════════════════════ */

const DND_STORAGE_KEY = 'vr_dnd';

export function useDND() {
  const [isDND, setIsDND] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(DND_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggle = useCallback(() => {
    setIsDND((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(DND_STORAGE_KEY, String(next));
      } catch {
        // localStorage not available
      }
      return next;
    });
  }, []);

  return { isDND, toggle };
}

/* ═══════════════════════════════════════════════════════════════════════
   DoNotDisturbToggle — Moon icon button
   
   Dimmed (gray) when DND is off, golden glow when DND is on.
   Touch-friendly 44px minimum target.
   ═══════════════════════════════════════════════════════════════════════ */

export function DoNotDisturbToggle({
  isDND,
  onToggle,
}: {
  isDND: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center justify-center cursor-pointer touch-manipulation bg-transparent border-none"
      style={{
        width: 34,
        height: 34,
        minWidth: 44,
        minHeight: 44,
        borderRadius: '50%',
        backgroundColor: isDND ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.08)',
        border: isDND ? '1.5px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255,255,255,0.1)',
        transition: 'all 0.25s ease',
        boxShadow: isDND ? '0 0 10px rgba(245, 158, 11, 0.2)' : 'none',
        position: 'relative',
      }}
      aria-label={isDND ? 'إلغاء عدم الإزعاج' : 'تفعيل عدم الإزعاج'}
      title={isDND ? 'وضع عدم الإزعاج مفعّل' : 'وضع عدم الإزعاج'}
    >
      <Moon
        size={16}
        style={{
          color: isDND ? '#f59e0b' : 'rgba(255,255,255,0.45)',
          transition: 'color 0.25s ease',
          fill: isDND ? '#f59e0b' : 'none',
        }}
        strokeWidth={isDND ? 2.5 : 1.8}
      />
      {/* Golden indicator dot when active */}
      {isDND && (
        <span
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: '#f59e0b',
            boxShadow: '0 0 4px rgba(245, 158, 11, 0.6)',
          }}
        />
      )}
    </button>
  );
}
