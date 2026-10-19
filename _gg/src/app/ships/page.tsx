'use client';
import { useCallback, useEffect, Suspense } from 'react';
import { useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useShipsStore } from '@/lib/ships-store';
import { useGameResume } from '@/lib/useGameResume';
import { GameResumeDialog } from '@/components/shared/gamesetup/GameResumeDialog';
import GameSetup from '@/components/ships/GameSetup';
import GameBoard from '@/components/ships/GameBoard';
import ShipsGameOver from '@/components/ships/ShipsGameOver';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import GameLayout from '@/components/shared/GameLayout';

function useHydrated() {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}


export default function ShipsPage() {
  return (
    <SubscriptionGuard gameSlug="ships">
      <GameLayout gameSlug="ships" gameName="سفن" gameEmoji="🚢" accentColor="violet">
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9fc4b4' }}>جاري التحميل...</div>}>
          <ShipsContent />
        </Suspense>
      </GameLayout>
    </SubscriptionGuard>
  );
}

function ShipsContent() {
  const { phase, setPhase, setGameMode, gameMode, roomCode, playMode, setPlayMode } = useShipsStore();
  const mounted = useHydrated();
  const searchParams = useSearchParams();

  // Resume prompt — only active when phase is non-'landing' (mid-game)
  const resume = useGameResume('ships-game-storage', '/ships', phase !== 'landing' && phase !== 'setup');

  useEffect(() => {
    if (!mounted) return;
    const mode = searchParams.get('mode');
    // Allow mode override whenever the user is NOT mid-game
    // (phase === 'landing' or 'setup'). If they're mid-game
    // (placing / attacking / pass_phone / game_over), keep the
    // existing gameMode — we don't want to disrupt a running game.
    const canOverrideMode = phase === 'landing' || phase === 'setup';
    if (!canOverrideMode) return;

    if (mode === 'godfather') {
      setGameMode('classic');
      setPlayMode('ai');
      useShipsStore.getState().setRoomCode(null);
      if (phase === 'landing') setPhase('setup');
    } else if (mode === 'diwaniya') {
      setGameMode('diwaniya');
      setPlayMode('teams');
      if (phase === 'landing') setPhase('setup');
    } else if (phase === 'landing') {
      // No mode in URL but phase is 'landing' — user came directly via /play/ships
      // Default to local classic (godfather) mode.
      setGameMode('classic');
      setPlayMode('ai');
      setPhase('setup');
    }
  }, [mounted, searchParams, phase, setPhase, setGameMode, setPlayMode]);

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

  if (phase === 'landing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center tobol-bg" dir="rtl">
        <div className="text-center flex-1 flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ fontSize: '48px', marginBottom: '12px' }}>🚢</motion.div>
          <p style={{ color: '#9fc4b4', fontSize: '14px' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }
  if (phase === 'setup') return <main><GameSetup /></main>;
  return (
    <>
      <main>
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
      {/* Resume-after-disconnect prompt (2-minute grace window) */}
      <GameResumeDialog
        open={resume.showPrompt}
        ageMs={resume.ageMs}
        gameName="سفن"
        onResume={resume.confirmResume}
        onForfeit={resume.confirmForfeit}
      />
    </>
  );
}

