'use client';

import { useCallback, useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useSpotDiffStore } from '@/lib/spotdiff-store';
import LandingPage from '@/components/spotdiff/LandingPage';
import GameSetup from '@/components/spotdiff/GameSetup';
import GameBoard from '@/components/spotdiff/GameBoard';
import SpotDiffGameOver from '@/components/spotdiff/SpotDiffGameOver';
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
export default function SpotDiffPage() {
  return (
    <SubscriptionGuard gameSlug="spotdiff">
      <GameLayout gameSlug="spotdiff" gameName="اختلاف الصور" gameEmoji="🔍" accentColor="emerald">
        <SpotDiffContent />
      </GameLayout>
    </SubscriptionGuard>
  );
}

function SpotDiffContent() {
  const { phase, setPhase, setGameMode, gameMode, roomCode } = useSpotDiffStore();
  const mounted = useHydrated();
  const searchParams = useSearchParams();

  // Start host heartbeat in Diwaniya mode
  useHostHeartbeat('spotdiff', gameMode, roomCode);

  // Read ?mode=godfather or ?mode=diwaniya from URL
  useEffect(() => {
    if (!mounted) return;
    const mode = searchParams.get('mode');
    // Allow mode override whenever the user is NOT mid-game
    const canOverrideMode = phase === 'landing' || phase === 'setup';
    if (!canOverrideMode) return;

    if (mode === 'godfather') {
      setGameMode('classic');
      // Clear any stale diwaniya roomCode when switching to godfather
      useSpotDiffStore.getState().setRoomCode(null);
      if (phase === 'landing') setPhase('setup');
    } else if (mode === 'diwaniya') {
      setGameMode('diwaniya');
      if (phase === 'landing') setPhase('setup');
      // roomCode will be created by GameSetup's useEffect
    }
  }, [mounted, searchParams, phase, setPhase, setGameMode]);

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
      <div className="min-h-screen flex flex-col items-center justify-center tobol-bg" dir="rtl">
        <div className="text-center flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ fontSize: '48px', marginBottom: '12px' }}
          >🔍</motion.div>
          <p style={{ color: '#9fc4b4', fontSize: '14px' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // LANDING
  if (phase === 'landing') {
    return (
      <main>
        <LandingPage onStartLocal={handleStartLocal} onStartDiwaniya={handleStartDiwaniya} />
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
    <div className="flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
      <main className="flex-1" style={{ overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {phase === 'game_over' ? (
            <motion.div
              key="gameover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SpotDiffGameOver />
            </motion.div>
          ) : (
            <motion.div
              key="board"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GameBoard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
