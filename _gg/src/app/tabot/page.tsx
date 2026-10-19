'use client';

import { useSyncExternalStore, useCallback, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTabotStore } from '@/lib/tabot-store';
import LandingPage from '@/components/tabot/LandingPage';
import GameSetup from '@/components/tabot/GameSetup';
import GameBoard from '@/components/tabot/GameBoard';
import GameOver from '@/components/tabot/GameOver';
import { useHostHeartbeat } from '@/lib/yalla-game-helpers';
import { useToast } from '@/hooks/use-toast';
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
export default function TabotPage() {
  return (
    <SubscriptionGuard gameSlug="tabot">
      <GameLayout gameSlug="tabot" gameName="الهروب من التابوت" gameEmoji="⚰️" accentColor="purple">
        <TabotContent />
      </GameLayout>
    </SubscriptionGuard>
  );
}

function TabotContent() {
  const { phase, setPhase, setGameMode, setRoomCode, gameMode, roomCode } = useTabotStore();
  const [creatingRoom, setCreatingRoom] = useState(false);
  const { toast } = useToast();
  const mounted = useHydrated();
  const searchParams = useSearchParams();

  // Start host heartbeat in Diwaniya mode
  useHostHeartbeat('tabot', gameMode === 'diwaniya' ? 'diwaniya' : undefined, roomCode);

  // ===== قراءة ?mode=godfather أو ?mode=diwaniya من URL =====
  useEffect(() => {
    if (!mounted) return;
    const mode = searchParams.get('mode');
    const canOverrideMode = phase === 'landing' || phase === 'setup';
    if (!canOverrideMode) return;

    if (mode === 'godfather') {
      setGameMode('local');
      setRoomCode(null);
      if (phase === 'landing') setPhase('setup');
    } else if (mode === 'diwaniya' && phase === 'landing') {
      // Trigger diwaniya setup directly via handler
      handleStartDiwaniya();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, searchParams, phase]);

  const handleStartSetup = useCallback(() => {
    setGameMode('local');
    setRoomCode(null);
    setPhase('setup');
  }, [setPhase, setGameMode, setRoomCode]);

  const handleStartDiwaniya = useCallback(async () => {
    setCreatingRoom(true);
    try {
      const res = await fetch('/api/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostName: 'تابوت',
          playerCount: 20,
          gameType: 'tabot',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: '❌ خطأ', description: data.error || 'فشل إنشاء الغرفة', variant: 'destructive' });
        setCreatingRoom(false);
        return;
      }

      setGameMode('diwaniya');
      setRoomCode(data.code);
      setPhase('setup');
      toast({
        title: '🎉 تم إنشاء الغرفة!',
        description: `كود الغرفة: ${data.code} — شاركه مع المتفرجين`,
      });
    } catch {
      toast({ title: '❌ خطأ', description: 'تعذر الاتصال بالخادم', variant: 'destructive' });
    }
    setCreatingRoom(false);
  }, [setPhase, setGameMode, setRoomCode, toast]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center tobol-bg" dir="rtl">
        <div className="text-center flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ fontSize: '48px', marginBottom: '12px' }}
          >⚰️</motion.div>
          <p style={{ color: '#9fc4b4', fontSize: '14px' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Loading state while creating room
  if (creatingRoom) {
    return (
      <div className="min-h-screen flex flex-col tobol-bg" dir="rtl">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: '48px', marginBottom: '12px' }}
            >🏠</motion.div>
            <p style={{ color: '#9fc4b4', fontSize: '14px' }}>جاري إنشاء الغرفة...</p>
          </div>
        </div>
      </div>
    );
  }

  // LANDING
  if (phase === 'landing') {
    return (
      <main>
        <LandingPage onStartSetup={handleStartSetup} onStartDiwaniya={handleStartDiwaniya} />
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

  // PLAYING / GAME OVER — wrapper height:100vh + overflow:hidden
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
              <GameOver />
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
