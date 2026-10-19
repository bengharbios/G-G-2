'use client';

import { useCallback, useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePrisonStore } from '@/lib/prison-store';
import LandingPage from '@/components/prison/LandingPage';
import GameSetup from '@/components/prison/GameSetup';
import GameBoard from '@/components/prison/GameBoard';
import PrisonGameOver from '@/components/prison/PrisonGameOver';
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
export default function PrisonPage() {
  return (
    <SubscriptionGuard gameSlug="prison">
      <GameLayout gameSlug="prison" gameName="السجن" gameEmoji="🔒" accentColor="amber">
        <PrisonContent />
      </GameLayout>
    </SubscriptionGuard>
  );
}

function PrisonContent() {
  const { phase, setPhase, setGameMode, gameMode, roomCode } = usePrisonStore();
  const mounted = useHydrated();
  const searchParams = useSearchParams();

  // Start host heartbeat in Diwaniya mode
  useHostHeartbeat('prison', gameMode, roomCode);

  // ===== قراءة ?mode=godfather أو ?mode=diwaniya من URL =====
  useEffect(() => {
    if (!mounted) return;
    const mode = searchParams.get('mode');
    const canOverrideMode = phase === 'landing' || phase === 'setup';
    if (!canOverrideMode) return;

    if (mode === 'godfather') {
      setGameMode('classic');
      useSyncExternalStore.getState().setRoomCode(null);
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
    window.location.href = `/join/prison/${code}?name=${encodeURIComponent(name)}`;
  }, []);

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'url(/battle/game_bg.webp) center / cover, #041F18' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
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
        {phase === 'game_over' && <PrisonGameOver />}
      </main>
    </div>
  );
}
