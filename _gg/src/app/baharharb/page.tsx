'use client';

import { useSyncExternalStore, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBaharHarbStore } from '@/lib/baharharb-store';
import LandingPage from '@/components/baharharb/LandingPage';
import GameSetup from '@/components/baharharb/GameSetup';
import GameBoard from '@/components/baharharb/GameBoard';
import GameOver from '@/components/baharharb/GameOver';
import { useHostHeartbeat } from '@/lib/yalla-game-helpers';
import SubscriptionGuard from '@/components/SubscriptionGuard';

// ============================================================
// Hydration guard
// ============================================================
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

// ============================================================
// Main Page
// ============================================================
export default function BaharHarbPage() {
  return (
    <SubscriptionGuard gameSlug="baharharb">
      <BaharHarbContent />
    </SubscriptionGuard>
  );
}

function BaharHarbContent() {
  const { phase, setPhase, resetGame, setGameMode, gameMode, roomCode } = useBaharHarbStore();
  const mounted = useHydrated();
  const searchParams = useSearchParams();

  // Start host heartbeat in Diwaniya mode (uses generic /api/baharharb-room/[code]/heartbeat pattern)
  useHostHeartbeat('baharharb', gameMode, roomCode);

  // ===== قراءة ?mode=godfather أو ?mode=diwaniya من URL =====
  useEffect(() => {
    if (!mounted) return;
    const mode = searchParams.get('mode');
    const canOverrideMode = phase === 'landing' || phase === 'setup';
    if (!canOverrideMode) return;

    if (mode === 'godfather') {
      setGameMode('classic');
      useBaharHarbStore.getState().setRoomCode(null);
      if (phase === 'landing') setPhase('setup');
    } else if (mode === 'diwaniya') {
      setGameMode('diwaniya');
      if (phase === 'landing') setPhase('setup');
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

  if (!mounted) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'url(/battle/game_bg.webp) center / cover no-repeat, #041F18',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌊⚔️</div>
          <p style={{ color: '#9fc4b4' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // ============================
  // LANDING PAGE
  // ============================
  if (phase === 'landing') {
    return (
      <main>
        <LandingPage onStartLocal={handleStartLocal} onStartDiwaniya={handleStartDiwaniya} />
      </main>
    );
  }

  // ============================
  // SETUP PAGE
  // ============================
  if (phase === 'setup') {
    return (
      <main>
        <GameSetup />
      </main>
    );
  }

  // ============================
  // PLAYING / GAME OVER (NO SCROLL)
  // ============================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <main style={{ flex: 1, overflow: 'hidden' }}>
        {phase === 'playing' && <GameBoard />}
        {phase === 'game_over' && <GameOver />}
      </main>
    </div>
  );
}
