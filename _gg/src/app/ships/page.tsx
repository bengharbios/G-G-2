'use client';
import { useCallback, useEffect, Suspense } from 'react';
import { useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useShipsStore } from '@/lib/ships-store';
import LandingPage from '@/components/ships/LandingPage';
import GameSetup from '@/components/ships/GameSetup';
import GameBoard from '@/components/ships/GameBoard';
import ShipsGameOver from '@/components/ships/ShipsGameOver';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import GameLayout from '@/components/shared/GameLayout';

function useHydrated() {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}

import { Suspense } from 'react';

export default function ShipsPage() {
  return (
    <SubscriptionGuard gameSlug="ships">
      <GameLayout gameSlug="ships" gameName="سفن" gameEmoji="🚢" accentColor="indigo">
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9fc4b4' }}>جاري التحميل...</div>}>
          <ShipsContent />
        </Suspense>
      </GameLayout>
    </SubscriptionGuard>
  );
}

function ShipsContent() {
  const { phase, setPhase, setGameMode, gameMode, roomCode } = useShipsStore();
  const mounted = useHydrated();
  const searchParams = useSearchParams();

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
  }, [mounted, searchParams, phase, setPhase, setGameMode]);

  const handleStartLocal = useCallback(() => {
    setGameMode('classic');
    useShipsStore.getState().setPlayMode('ai');
    setPhase('setup');
  }, [setPhase, setGameMode]);

  const handleStartDiwaniya = useCallback(() => {
    setGameMode('diwaniya');
    useShipsStore.getState().setPlayMode('teams');
    setPhase('setup');
  }, [setPhase, setGameMode]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center tobol-bg" dir="rtl">
        <div className="text-center flex-1 flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ fontSize: '48px', marginBottom: '12px' }}>🚢</motion.div>
          <p style={{ color: '#9fc4b4', fontSize: '14px' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (phase === 'landing') return <main><LandingPage onStartLocal={handleStartLocal} onStartDiwaniya={handleStartDiwaniya} /></main>;
  if (phase === 'setup') return <main><GameSetup /></main>;
  // phase 'placing' (ship placement) + 'attacking' → GameBoard
  return (
    <div className="flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
      <main className="flex-1" style={{ overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {phase === 'game_over' ? (
            <motion.div key="gameover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ShipsGameOver />
            </motion.div>
          ) : (
            <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GameBoard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
