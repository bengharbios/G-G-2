'use client';
import { useCallback, useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useFoodWarStore } from '@/lib/foodwar-store';
import GameSetup from '@/components/foodwar/GameSetup';
import GameBoard from '@/components/foodwar/GameBoard';
import FoodWarGameOver from '@/components/foodwar/FoodWarGameOver';
import { useHostHeartbeat } from '@/lib/yalla-game-helpers';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import GameLayout from '@/components/shared/GameLayout';

function useHydrated() { return useSyncExternalStore(() => () => {}, () => true, () => false); }

export default function FoodWarPage() {
  return (
    <SubscriptionGuard gameSlug="foodwar">
      <GameLayout gameSlug="foodwar" gameName="حرب الاكلات" gameEmoji="🍕" accentColor="emerald">
        <FoodWarContent />
      </GameLayout>
    </SubscriptionGuard>
  );
}

function FoodWarContent() {
  const { phase, setPhase, setGameMode, gameMode, roomCode } = useFoodWarStore();
  const mounted = useHydrated();
  const searchParams = useSearchParams();
  useHostHeartbeat('foodwar', gameMode, roomCode);

  useEffect(() => {
    if (!mounted) return;
    const mode = searchParams.get('mode');
    const canOverride = phase === 'landing' || phase === 'setup';
    if (!canOverride) return;
    if (mode === 'godfather') { setGameMode('classic'); useFoodWarStore.getState().setRoomCode(null); if (phase === 'landing') setPhase('setup'); }
    else if (mode === 'diwaniya') { setGameMode('diwaniya'); if (phase === 'landing') setPhase('setup'); }
  }, [mounted, searchParams, phase, setPhase, setGameMode]);

  if (!mounted || phase === 'landing') return (
    <div className="min-h-screen flex flex-col items-center justify-center tobol-bg" dir="rtl">
      <div className="text-center flex-1 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ fontSize: '48px', marginBottom: '12px' }}>🍕</motion.div>
        <p style={{ color: '#9fc4b4', fontSize: '14px' }}>جاري التحميل...</p>
      </div>
    </div>
  );
  if (phase === 'setup') return <main><GameSetup /></main>;
  return (
    <div className="flex flex-col">
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {phase === 'game_over' ? (
            <motion.div key="gameover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><FoodWarGameOver /></motion.div>
          ) : (
            <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><GameBoard /></motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
