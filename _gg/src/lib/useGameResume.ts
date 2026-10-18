'use client';

// ════════════════════════════════════════════════════════════════
// useGameResume — Hook for the "disconnected game" resume prompt.
//
// Logic (matches user request + Yalla Ludo pattern):
// 1. When user is in a game and the page is hidden / unloaded
//    (e.g., closes app by swiping up, loses internet, navigates away
//    WITHOUT clicking the explicit exit button), we DON'T wipe state.
//    We just record the disconnect timestamp in localStorage.
// 2. When the user returns to the game page, we check:
//    - Is there a persisted game state with a non-'landing' phase?
//    - Is there a disconnect timestamp?
//    - Is the timestamp within the 2-minute grace window?
// 3. If yes to all → show "لديك جلسة لعبة محفوظة. متابعة أم إنهاء نهائي؟"
//    - "متابعة" → resume (state is already in the store, just dismiss)
//    - "إنهاء نهائي" → wipe state + go home
// 4. If timestamp is older than 2 minutes → treat as voluntary forfeit:
//    wipe state silently and go to landing (no resume prompt).
//
// Explicit exit (clicking the in-game exit button) is handled by the
// game's own handleQuit handler which wipes state directly — this hook
// does NOT fire for that case because we set a `explicitExitRef` flag.
// ════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

const RESUME_GRACE_MS = 2 * 60 * 1000; // 2 minutes

interface ResumeState {
  showPrompt: boolean;
  ageMs: number;
  dismiss: () => void;
  confirmResume: () => void;
  confirmForfeit: () => void;
  markExplicitExit: () => void;
}

export function useGameResume(
  storageKey: string,
  gamePath: string,
  hasActiveGame: boolean,
): ResumeState {
  const router = useRouter();
  const [showPrompt, setShowPrompt] = useState(false);
  const [ageMs, setAgeMs] = useState(0);
  const explicitExitRef = useRef(false);

  const tsKey = `${storageKey}__disconnect_ts`;

  // ── On page hide / unload → record disconnect timestamp (unless explicit exit) ──
  useEffect(() => {
    if (!hasActiveGame) return;
    const recordDisconnect = () => {
      if (explicitExitRef.current) return;
      try {
        localStorage.setItem(tsKey, String(Date.now()));
      } catch { /* ignore */ }
    };
    const onVisChange = () => {
      if (document.visibilityState === 'hidden') recordDisconnect();
    };
    window.addEventListener('pagehide', recordDisconnect);
    window.addEventListener('beforeunload', recordDisconnect);
    document.addEventListener('visibilitychange', onVisChange);
    return () => {
      window.removeEventListener('pagehide', recordDisconnect);
      window.removeEventListener('beforeunload', recordDisconnect);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, [hasActiveGame, tsKey]);

  // ── On mount → check for a recent disconnect → show prompt ──
  useEffect(() => {
    if (!hasActiveGame) return;
    try {
      const raw = localStorage.getItem(tsKey);
      if (!raw) return;
      const ts = parseInt(raw, 10);
      if (!ts || isNaN(ts)) return;
      const age = Date.now() - ts;
      setAgeMs(age);
      if (age <= RESUME_GRACE_MS) {
        setShowPrompt(true);
      } else {
        // Past grace window → treat as voluntary forfeit, wipe silently
        localStorage.removeItem(tsKey);
        localStorage.removeItem(storageKey);
        // The store will pick up the empty localStorage on next hydration
        // and reset to initial 'landing' phase.
      }
    } catch { /* ignore */ }
  }, [hasActiveGame, storageKey, tsKey]);

  const dismiss = useCallback(() => {
    setShowPrompt(false);
    try { localStorage.removeItem(tsKey); } catch { /* ignore */ }
  }, [tsKey]);

  const confirmResume = useCallback(() => {
    try { localStorage.removeItem(tsKey); } catch { /* ignore */ }
    setShowPrompt(false);
  }, [tsKey]);

  const confirmForfeit = useCallback(() => {
    try {
      localStorage.removeItem(tsKey);
      localStorage.removeItem(storageKey);
    } catch { /* ignore */ }
    setShowPrompt(false);
    router.push('/');
  }, [tsKey, storageKey, router]);

  const markExplicitExit = useCallback(() => {
    explicitExitRef.current = true;
    try { localStorage.removeItem(tsKey); } catch { /* ignore */ }
  }, [tsKey]);

  return { showPrompt, ageMs, dismiss, confirmResume, confirmForfeit, markExplicitExit };
}
