'use client';

import { useCallback, useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRiskStore } from '@/lib/risk-store';
import LandingPage from '@/components/risk/LandingPage';
import GameSetup from '@/components/risk/GameSetup';
import GameBoard from '@/components/risk/GameBoard';
import RiskGameOver from '@/components/risk/RiskGameOver';
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
export default function RiskPage() {
  return (
    <SubscriptionGuard gameSlug="risk">
      <GameLayout gameSlug="risk" gameName="المجازفة" gameEmoji="💣" accentColor="violet">
        <RiskContent />
      </GameLayout>
    </SubscriptionGuard>
  );
}

function RiskContent() {
  const { phase, setPhase, setGameMode, gameMode, roomCode } = useRiskStore();
  const mounted = useHydrated();
  const searchParams = useSearchParams();

  // Start host heartbeat in Diwaniya mode
  useHostHeartbeat('risk', gameMode, roomCode);

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
    window.location.href = `/join/risk/${code}?name=${encodeURIComponent(name)}`;
  }, []);

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'url(/battle/game_bg.webp) center / cover, #041F18' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>💣</div>
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
        {phase === 'game_over' && <RiskGameOver />}
      </main>
    </div>
  );
}
