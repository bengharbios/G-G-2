'use client';

import { useSyncExternalStore, useCallback, useState, useEffect, useRef } from 'react';
import { useTabotStore } from '@/lib/tabot-store';
import LandingPage from '@/components/tabot/LandingPage';
import TeamSetup from '@/components/tabot/TeamSetup';
import GameBoard from '@/components/tabot/GameBoard';
import GameOver from '@/components/tabot/GameOver';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home as HomeIcon, RotateCcw, Copy, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import GameLayout from '@/components/shared/GameLayout';

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}





// ============================================================
// Persistent top navigation bar during gameplay
// ============================================================

function GameTopBar() {
  const { phase, resetGame, currentTeam, teamAlphaName, teamBetaName, currentRound, roomCode, gameMode } = useTabotStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const { toast } = useToast();

  const isGameOver = phase === 'game_over';

  const handleExit = () => {
    resetGame();
    setShowExitDialog(false);
  };

  const handleReset = () => {
    resetGame();
    setShowResetConfirm(false);
  };

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).then(() => {
      toast({ title: '✅ تم النسخ!', description: `كود الغرفة: ${roomCode}` });
    }).catch(() => {
      toast({ title: '📋 الكود', description: roomCode });
    });
  };

  const phaseLabel = phase === 'playing'
    ? `📋 الجولة ${currentRound} — ${currentTeam === 'alpha' ? teamAlphaName : teamBetaName}`
    : phase === 'game_over'
    ? '🏁 انتهت اللعبة'
    : '';

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-purple-800/50 bg-[#0a0810]/90 backdrop-blur-sm">
        <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5">
          <Button
            onClick={() => setShowExitDialog(true)}
            variant="ghost"
            className="text-slate-400 hover:text-red-400 hover:bg-red-950/30 gap-1.5 text-xs h-8 px-2"
          >
            <HomeIcon className="w-4 h-4" />
            <span className="hidden sm:inline">الرئيسية</span>
          </Button>

          <Badge
            variant="outline"
            className={`text-[10px] sm:text-xs px-2 py-0.5 ${
              isGameOver
                ? 'border-amber-500/50 text-amber-300'
                : 'border-purple-500/50 text-purple-400'
            }`}
          >
            {phaseLabel}
          </Badge>

          {!isGameOver && (
            <div className="relative">
              {!showResetConfirm ? (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-950/30"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1"
                >
                  <span className="text-[10px] text-red-400 font-bold">مؤكد؟</span>
                  <button
                    onClick={handleReset}
                    className="text-[10px] bg-red-900/60 text-red-300 px-1.5 py-0.5 rounded font-bold"
                  >
                    نعم
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="text-[10px] bg-slate-800/60 text-slate-400 px-1.5 py-0.5 rounded font-bold"
                  >
                    لا
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Room Code Banner for Diwaniya mode */}
        {gameMode === 'diwaniya' && roomCode && !isGameOver && (
          <div className="border-t border-purple-800/30 bg-purple-950/40">
            <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5">
              <div className="flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-green-400" />
                <span className="text-[10px] text-slate-400">بث مباشر</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">كود الغرفة:</span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-600/50 rounded-lg px-3 py-1 hover:bg-slate-700/60 transition-colors"
                >
                  <span className="text-sm font-mono font-bold text-amber-300 tracking-wider">{roomCode}</span>
                  <Copy className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exit Confirmation Dialog */}
      <AnimatePresence>
        {showExitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowExitDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1025] border border-purple-700/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="text-5xl mb-3">🚪</div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">الخروج من اللعبة؟</h3>
                <p className="text-sm text-slate-400 mb-6">سيتم إعادة تعيين اللعبة بالكامل. هل تريد المتابعة؟</p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowExitDialog(false)}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 h-11"
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleExit}
                    className="flex-1 bg-gradient-to-l from-purple-700 to-purple-900 hover:from-purple-600 hover:to-purple-800 text-white font-bold h-11"
                  >
                    نعم، اخرج
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// Host Heartbeat Hook
// ============================================================

function useHostHeartbeat() {
  const { roomCode, gameMode, phase } = useTabotStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!roomCode || gameMode !== 'diwaniya' || phase === 'landing' || phase === 'setup' || phase === 'game_over') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const sendHeartbeat = () => {
      fetch(`/api/room/${roomCode}/heartbeat`, { method: 'POST' }).catch(() => {});
    };

    sendHeartbeat();
    intervalRef.current = setInterval(sendHeartbeat, 5000);

    const handleBeforeUnload = () => {
      // End room session when host closes tab
      fetch(`/api/room/${roomCode}`, { method: 'DELETE' }).catch(() => {});
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`/api/room/${roomCode}`, JSON.stringify({ _method: 'DELETE' }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomCode, gameMode, phase]);
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function TabotPage() {
  const { phase, setPhase, setGameMode, setRoomCode } = useTabotStore();

  return (
    <SubscriptionGuard gameSlug="tabot">
      <GameLayout gameSlug="tabot" gameName="الهروب من التابوت" gameEmoji="⚰️" accentColor="purple">
        <TabotContent />
      </GameLayout>
    </SubscriptionGuard>
  );
}

function TabotContent() {
  const { phase, setPhase, setGameMode, setRoomCode } = useTabotStore();
  const [creatingRoom, setCreatingRoom] = useState(false);
  const { toast } = useToast();
  const mounted = useHydrated();

  // Start heartbeat when in diwaniya mode
  useHostHeartbeat();

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0810]">
        <div className="text-center flex-1 flex items-center justify-center">
          <div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="text-5xl mb-4"
            >
              ⚰️
            </motion.div>
            <p className="text-slate-500 text-sm">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state while creating room
  if (creatingRoom) {
    return (
      <div className="min-h-screen flex flex-col tabot-bg">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="text-5xl mb-4"
            >
              🏠
            </motion.div>
            <p className="text-slate-400 text-sm">جاري إنشاء الغرفة...</p>
          </div>
        </div>
      </div>
    );
  }

  // Landing phase
  if (phase === 'landing') {
    return (
      <main>
        <LandingPage onStartSetup={handleStartSetup} onStartDiwaniya={handleStartDiwaniya} />
      </main>
    );
  }

  // Setup phase
  if (phase === 'setup') {
    return (
      <main>
        <TeamSetup />
      </main>
    );
  }

  // Playing & Game Over phases
  return (
    <div className="flex flex-col min-h-screen tabot-bg text-white">
      <GameTopBar />
      <main className="flex-1">
        {phase === 'playing' && <GameBoard />}
        {phase === 'game_over' && <GameOver />}
      </main>
    </div>
  );
}
