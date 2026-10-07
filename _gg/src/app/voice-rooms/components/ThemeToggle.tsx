'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';

function readStoredTheme(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem('voice-room-theme');
  return stored ? stored === 'dark' : true;
}

export function ThemeToggle() {
  // Lazy initializer reads localStorage on mount (no effect needed for initial read)
  const [isDark, setIsDark] = useState(readStoredTheme);

  // Apply DOM class on mount when stored theme is light
  useEffect(() => {
    const stored = localStorage.getItem('voice-room-theme');
    if (stored === 'light') {
      document.documentElement.classList.add('light-theme');
    }
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const newDark = !prev;
      localStorage.setItem('voice-room-theme', newDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('light-theme', !newDark);
      return newDark;
    });
  }, []);

  return (
    <button
      onClick={toggle}
      className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
      style={{
        width: 36,
        height: 36,
        minWidth: 44,
        minHeight: 44,
        backgroundColor: 'rgba(255,255,255,0.07)',
        transition: 'all 0.2s ease',
      }}
      aria-label={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
      title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
    >
      {isDark ? (
        <Moon size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
      ) : (
        <Sun size={16} style={{ color: '#f59e0b' }} />
      )}
    </button>
  );
}
