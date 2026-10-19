'use client';

import { useCallback, useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useBattleshipStore } from '@/lib/battleship-store';
import LandingPage from '@/components/battleship/LandingPage';
import GameSetup from '@/components/battleship/GameSetup';
import GameBoard from '@/components/battleship/GameBoard';
import BattleshipGameOver from '@/components/battleship/BattleshipGameOver';
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
export default function BattleshipPage() {
  return (
    <SubscriptionGuard gameSlug="battleship">
      <GameLayout gameSlug="battleship" gameName="سفن" gameEmoji="🚢" accentColor="emerald">
        <BattleshipContent />
      </GameLayout>
    </SubscriptionGuard>
  );
}

function BattleshipContent() {
  const { phase, setPhase, setGameMode, gameMode, roomCode } = useBattleshipStore();
  const mounted = useHydrated();
  const searchParams = useSearchParams();

  // Start host heartbeat in Diwaniya mode
  useHostHeartbeat('battleship', gameMode, roomCode);

  // Read ?mode=godfather or ?mode=diwaniya from URL
  useEffect(() => {
    if (!mounted) return;
    const mode = searchParams.get('mode');
    const canOverrideMode = phase === 'landing' || phase === 'setup';
    if (!canOverrideMode) return;

    if (mode === 'godfather') {
      setGameMode('classic');
      useBattleshipStore.getState().setRoomCode(null);
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
      <div className="min-h-screen flex flex-col items-center justify-center tobol-bg" dir="rtl">
        <div className="text-center flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ fontSize: '48px', marginBottom: '12px' }}
          >🚢</motion.div>
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
              <BattleshipGameOver />
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
