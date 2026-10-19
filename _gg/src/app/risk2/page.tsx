'use client';

import { useCallback, useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRisk2Store } from '@/lib/risk2-store';
import LandingPage from '@/components/risk2/LandingPage';
import GameSetup from '@/components/risk2/GameSetup';
import GameBoard from '@/components/risk2/GameBoard';
import Risk2GameOver from '@/components/risk2/Risk2GameOver';
import { useHostHeartbeat } from '@/lib/yalla-game-helpers';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import GameLayout from '@/components/shared/GameLayout';

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
export default function Risk2Page() {
  return (
    <SubscriptionGuard gameSlug="risk2">
      <GameLayout gameSlug="risk2" gameName="المجازفة 2" gameEmoji="🎴" accentColor="orange">
        <Risk2Content />
      </GameLayout>
    </SubscriptionGuard>
  );
}

function Risk2Content() {
  const { phase, setPhase, setGameMode, gameMode, roomCode } = useRisk2Store();
  const mounted = useHydrated();
  const searchParams = useSearchParams();

  // Start host heartbeat in Diwaniya mode
  useHostHeartbeat('risk2', gameMode, roomCode);

  // ===== قراءة ?mode=godfather أو ?mode=diwaniya من URL =====
  useEffect(() => {
    if (!mounted) return;
    const mode = searchParams.get('mode');
    const canOverrideMode = phase === 'landing' || phase === 'setup';
    if (!canOverrideMode) return;

    if (mode === 'godfather') {
      setGameMode('classic');
      useRisk2Store.getState().setRoomCode(null);
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

  const handleJoinSpectator = useCallback((code: string, name: string) => {
    window.location.href = `/join/risk2/${code}?name=${encodeURIComponent(name)}`;
  }, []);

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'url(/battle/game_bg.webp) center / cover, #041F18' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎴</div>
          <p style={{ color: '#9fc4b4' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // LANDING
  if (phase === 'landing') {
    return (
      <main>
        <LandingPage
          onStartLocal={handleStartLocal}
          onStartDiwaniya={handleStartDiwaniya}
          onJoinSpectator={handleJoinSpectator}
        />
      </main>
    );
  }

  // SETUP
  if (phase === 'setup') {
    return (
      <main>
        <GameSetup />
      </main>
    );
  }

  // PLAYING / GAME OVER
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <main style={{ flex: 1, overflow: 'hidden' }}>
        {phase === 'playing' && <GameBoard />}
        {phase === 'game_over' && <Risk2GameOver />}
      </main>
    </div>
  );
}
