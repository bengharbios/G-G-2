'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRisk2Store } from '@/lib/risk2-store';
import LandingPage from '@/components/risk2/LandingPage';
import GameSetup from '@/components/risk2/GameSetup';
import GameBoard from '@/components/risk2/GameBoard';
import Risk2GameOver from '@/components/risk2/Risk2GameOver';
import { Button } from '@/components/ui/button';
import { Home as HomeIcon, RotateCcw, Eye, Copy, Check, Link2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
// Host Heartbeat Hook (Diwaniya mode)
// ============================================================
function useHostHeartbeat() {
  const { gameMode, roomCode } = useRisk2Store();

  useEffect(() => {
    if (gameMode !== 'diwaniya' || !roomCode) return;
    const sendHeartbeat = () => {
      fetch(`/api/risk2-room/${roomCode}/heartbeat`, { method: 'POST' }).catch(() => {});
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 5000);
    return () => clearInterval(interval);
  }, [gameMode, roomCode]);

  useEffect(() => {
    if (gameMode !== 'diwaniya' || !roomCode) return;
    const handleBeforeUnload = () => {
      fetch(`/api/risk2-room/${roomCode}`, { method: 'DELETE' }).catch(() => {});
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [gameMode, roomCode]);
}





// ============================================================
// GameTopBar
// ============================================================
function GameTopBar() {
  const router = useRouter();
  const { phase, resetGame, gameMode, roomCode } = useRisk2Store();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isGameOver = phase === 'game_over';

  const handleExit = () => {
    setLeaving(true);
    setTimeout(() => {
      resetGame();
      setLeaving(false);
      setShowExitDialog(false);
      router.push('/');
    }, 300);
  };

  const handleReset = () => {
    resetGame();
    setShowResetConfirm(false);
  };

  const copyText = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5">
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setShowExitDialog(true)}
              variant="ghost"
              className="text-slate-400 hover:text-red-400 hover:bg-red-950/30 gap-1.5 text-xs h-8 px-2"
            >
              <HomeIcon className="w-4 h-4" />
              <span className="hidden sm:inline">الرئيسية</span>
            </Button>

            {gameMode === 'diwaniya' && roomCode && (
              <span className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-400 px-2 py-1 rounded-lg bg-orange-950/30 border border-orange-500/30">
                📺 ديوانية
              </span>
            )}
          </div>

          {isGameOver && (
            <span className="text-[10px] sm:text-xs px-2 py-0.5 border border-orange-500/50 text-orange-300 rounded">
              🏁 انتهت
            </span>
          )}

          {!isGameOver && (
            <div className="relative">
              {!showResetConfirm ? (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-950/30 cursor-pointer"
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
                  <button onClick={handleReset} className="text-[10px] bg-red-900/60 text-red-300 px-1.5 py-0.5 rounded font-bold cursor-pointer">نعم</button>
                  <button onClick={() => setShowResetConfirm(false)} className="text-[10px] bg-slate-800/60 text-slate-400 px-1.5 py-0.5 rounded font-bold cursor-pointer">لا</button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Room Code Banner (Diwaniya) */}
      {gameMode === 'diwaniya' && roomCode && (
        <div className="bg-gradient-to-l from-orange-900/50 to-red-900/50 border-b border-orange-500/30 py-2 px-4">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-orange-300">📺 شارك هذا الكود مع اللاعبين:</p>
                <p className="text-xl sm:text-2xl font-mono font-bold text-white tracking-widest">{roomCode}</p>
              </div>
              <button
                onClick={() => copyText(roomCode, setCopiedCode)}
                className="flex items-center gap-1.5 text-xs bg-orange-800/50 text-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-700/50 transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? 'تم!' : 'نسخ الكود'}
              </button>
            </div>
            <button
              onClick={() => copyText(`${window.location.origin}/join/risk2/${roomCode}`, setCopiedLink)}
              className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs bg-emerald-800/30 text-emerald-200 px-3 py-2 rounded-lg hover:bg-emerald-700/30 transition-colors cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5" />
              {copiedLink ? '✅ تم نسخ الرابط!' : '🔗 نسخ رابط الانضمام'}
            </button>
          </div>
        </div>
      )}

      {/* Exit Dialog */}
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
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="text-5xl mb-3">🚪</div>
              <h3 className="text-lg font-bold text-slate-200 mb-2">الخروج من اللعبة؟</h3>
              <p className="text-sm text-slate-400 mb-6">سيتم إعادة تعيين اللعبة بالكامل.</p>
              <div className="flex gap-3">
                <Button onClick={() => setShowExitDialog(false)} variant="outline" disabled={leaving} className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 h-11">إلغاء</Button>
                <Button onClick={handleExit} disabled={leaving} className="flex-1 bg-gradient-to-l from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold h-11">
                  {leaving ? 'جاري...' : 'نعم'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// Main Page
// ============================================================
export default function Risk2Page() {
  const { phase, setPhase, resetGame, setGameMode } = useRisk2Store();

  return (
    <SubscriptionGuard gameSlug="risk2">
      <GameLayout gameSlug="risk2" gameName="المجازفة 2" gameEmoji="🎴" accentColor="orange">
        <Risk2Content />
      </GameLayout>
    </SubscriptionGuard>
  );
}

function Risk2Content() {
  const { phase, setPhase, resetGame, setGameMode } = useRisk2Store();
  const mounted = useHydrated();

  useHostHeartbeat();

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="text-center flex-1 flex items-center justify-center">
          <div>
            <div className="text-5xl mb-4">🎴</div>
            <p className="text-slate-400">جاري التحميل...</p>
          </div>
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
    <div className="flex flex-col min-h-screen bg-slate-950">
      <GameTopBar />
      <main className="flex-1">
        {phase === 'playing' && <GameBoard />}
        {phase === 'game_over' && <Risk2GameOver />}
      </main>
    </div>
  );
}
