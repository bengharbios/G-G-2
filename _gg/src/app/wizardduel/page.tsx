'use client';

import { useCallback, useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWizardDuelStore } from '@/lib/wizardduel-store';
import { useHostHeartbeat } from '@/lib/yalla-game-helpers';
import LandingPage from '@/components/wizardduel/LandingPage';
import GameSetup from '@/components/wizardduel/GameSetup';
import GameBoard from '@/components/wizardduel/GameBoard';
import WizardDuelGameOver from '@/components/wizardduel/WizardDuelGameOver';

// ============================================================
// Hydration guard — avoids SSR/CSR mismatch from persisted store
// ============================================================
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

// ============================================================
// WizardDuelPage — top-level wrapper for مبارزة السحرة
// ============================================================
export default function WizardDuelPage() {
  const {
    phase,
    gameMode,
    roomCode,
    setPhase,
    setGameMode,
  } = useWizardDuelStore();

  const mounted = useHydrated();
  const searchParams = useSearchParams();

  // Host heartbeat for diwaniya mode (5s interval + cleanup on unload)
  useHostHeartbeat('wizardduel', gameMode, roomCode);

  // ===== ?mode=godfather or ?mode=diwaniya from /play/[gameId] =====
  // If a mode is passed, skip LandingPage and go straight to setup
  useEffect(() => {
    if (!mounted) return;
    const mode = searchParams.get('mode');
    if (mode === 'godfather' && phase === 'landing') {
      setGameMode('classic');
      setPhase('setup');
    } else if (mode === 'diwaniya' && phase === 'landing') {
      setGameMode('diwaniya');
      setPhase('setup');
    }
  }, [mounted, searchParams, phase, setGameMode, setPhase]);

  const handleStartLocal = useCallback(() => {
    setGameMode('classic');
    setPhase('setup');
  }, [setPhase, setGameMode]);

  const handleStartDiwaniya = useCallback(() => {
    setGameMode('diwaniya');
    setPhase('setup');
  }, [setPhase, setGameMode]);

  // ── Pre-hydration splash ──
  if (!mounted) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: '100vh',
          background: 'url(/battle/game_bg.webp) center / cover no-repeat, #1a0833',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#c4a3e8',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px', animation: 'wdpulse 1.6s ease-in-out infinite' }}>🔮</div>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#c4a3e8' }}>جاري تحميل المبارزة...</p>
        </div>
        <style>{`@keyframes wdpulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }`}</style>
      </div>
    );
  }

  // ── Landing ──
  if (phase === 'landing') {
    return (
      <div style={{ height: '100vh', overflow: 'hidden' }}>
        <main style={{ height: '100%', overflow: 'auto' }}>
          <LandingPage onStartLocal={handleStartLocal} onStartDiwaniya={handleStartDiwaniya} />
        </main>
      </div>
    );
  }

  // ── Setup ──
  if (phase === 'setup') {
    return (
      <div style={{ height: '100vh', overflow: 'hidden' }}>
        <main style={{ height: '100%', overflow: 'auto' }}>
          <GameSetup />
        </main>
      </div>
    );
  }

  // ── Playing / Game Over (fill viewport, scroll inside board) ──
  return (
    <div
      style={{
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <main style={{ flex: 1, overflow: 'auto' }}>
        {phase === 'playing' && <GameBoard />}
        {phase === 'game_over' && <WizardDuelGameOver />}
      </main>
    </div>
  );
}

