'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePrisonStore } from '@/lib/prison-store';
import LandingPage from '@/components/prison/LandingPage';
import GameSetup from '@/components/prison/GameSetup';
import GameBoard from '@/components/prison/GameBoard';
import PrisonGameOver from '@/components/prison/PrisonGameOver';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const { gameMode, roomCode } = usePrisonStore();

  useEffect(() => {
    if (gameMode !== 'diwaniya' || !roomCode) return;

    const sendHeartbeat = () => {
      fetch(`/api/prison-room/${roomCode}/heartbeat`, {
        method: 'POST',
      }).catch(() => {});
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 5000);
    return () => clearInterval(interval);
  }, [gameMode, roomCode]);

  // Clean up room on tab close
  useEffect(() => {
    if (gameMode !== 'diwaniya' || !roomCode) return;

    const handleBeforeUnload = () => {
      const baseUrl = window.location.origin;
      navigator.sendBeacon(
        `${baseUrl}/api/prison-room/${roomCode}`,
        JSON.stringify({ _method: 'DELETE' })
      );
      try {
        fetch(`/api/prison-room/${roomCode}`, { method: 'DELETE' });
      } catch { /* ignore */ }
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
  const { phase, resetGame, gameMode, roomCode } = usePrisonStore();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [spectators, setSpectators] = useState<{ id: string; name: string; joinedAt: number }[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isGameOver = phase === 'game_over';

  // Poll spectators count for Diwaniya mode
  useEffect(() => {
    if (gameMode !== 'diwaniya' || !roomCode) return;
    const fetchViewers = () => {
      fetch(`/api/prison-room/${roomCode}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d?.room?.spectators) {
            setSpectators(d.room.spectators);
            setViewerCount(d.room.spectators.length);
          }
        })
        .catch(() => {});
    };
    fetchViewers();
    const iv = setInterval(fetchViewers, 5000);
    return () => clearInterval(iv);
  }, [gameMode, roomCode, showViewers]);

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

  const copyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }).catch(() => {
      // Fallback for non-HTTPS contexts
      const ta = document.createElement('textarea');
      ta.value = roomCode;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  const copyLink = () => {
    if (!roomCode) return;
    const link = `${window.location.origin}/join/prison/${roomCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = link;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
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

            {/* Viewers icon (Diwaniya mode) */}
            {gameMode === 'diwaniya' && roomCode && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowViewers(true)}
                className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-400 hover:text-cyan-400 transition-colors px-2 py-1 rounded-lg hover:bg-cyan-950/30 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{viewerCount}</span>
              </motion.button>
            )}
          </div>

          {/* Diwaniya host badge */}
          {gameMode === 'diwaniya' && !isGameOver && (
            <div className="flex items-center gap-1 bg-cyan-950/40 border border-cyan-500/30 rounded-lg px-2 py-1">
              <span className="text-xs">👁️</span>
              <span className="text-[10px] sm:text-xs font-bold text-cyan-300">ديوانية</span>
            </div>
          )}

          {isGameOver && (
            <Badge
              variant="outline"
              className="text-[10px] sm:text-xs px-2 py-0.5 border-amber-500/50 text-amber-300"
            >
              🏁 انتهت اللعبة
            </Badge>
          )}

          {/* Reset button */}
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
                  <button
                    onClick={handleReset}
                    className="text-[10px] bg-red-900/60 text-red-300 px-1.5 py-0.5 rounded font-bold cursor-pointer"
                  >
                    نعم
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="text-[10px] bg-slate-800/60 text-slate-400 px-1.5 py-0.5 rounded font-bold cursor-pointer"
                  >
                    لا
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Room Code Banner (Diwaniya) */}
      {gameMode === 'diwaniya' && roomCode && (
        <div className="bg-gradient-to-l from-amber-900/50 to-cyan-900/50 border-b border-amber-500/30 py-2 px-4">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs text-amber-300">📺 شارك هذا الكود مع المشاهدين:</p>
                <p className="text-xl sm:text-2xl font-mono font-bold text-white tracking-widest">{roomCode}</p>
              </div>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 text-xs bg-amber-800/50 text-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-700/50 transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? 'تم!' : 'نسخ الكود'}
              </button>
            </div>
            <button
              onClick={copyLink}
              className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs bg-cyan-800/30 text-cyan-200 px-3 py-2 rounded-lg hover:bg-cyan-700/30 transition-colors cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5" />
              {copiedLink ? '✅ تم نسخ الرابط!' : '🔗 نسخ رابط الانضمام'}
            </button>
          </div>
        </div>
      )}

      {/* Viewers Modal */}
      <AnimatePresence>
        {showViewers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowViewers(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  المشاهدون
                </h3>
                <button
                  onClick={() => setShowViewers(false)}
                  className="text-slate-500 hover:text-slate-300 text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {spectators.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2">👥</div>
                  <p className="text-slate-500 text-sm">لا يوجد مشاهدون حالياً</p>
                  <p className="text-slate-600 text-xs mt-1">شارك كود الغرفة ليصلك المشاهدون</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto prison-scrollbar">
                  {spectators.map((spec, idx) => (
                    <div
                      key={spec.id}
                      className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/30 rounded-xl px-3 py-2.5"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {spec.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-200 truncate">{spec.name}</p>
                        <p className="text-[10px] text-slate-500">
                          انضم منذ {Math.floor((Date.now() - spec.joinedAt) / 60000)} دقيقة
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-600 shrink-0">#{idx + 1}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 text-center">
                <p className="text-[10px] text-slate-600">
                  إجمالي المشاهدين: {spectators.length}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="text-5xl mb-3">🚪</div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">
                  الخروج من اللعبة؟
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  {gameMode === 'diwaniya'
                    ? 'سيتم إنهاء الجلسة وسيخرج جميع المشاهدين.'
                    : 'سيتم إعادة تعيين اللعبة بالكامل. هل تريد المتابعة؟'
                  }
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowExitDialog(false)}
                    variant="outline"
                    disabled={leaving}
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 h-11"
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleExit}
                    disabled={leaving}
                    className="flex-1 bg-gradient-to-l from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold h-11"
                  >
                    {leaving ? 'جاري الخروج...' : 'نعم، اخرج'}
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
// Main Page
// ============================================================
export default function PrisonPage() {
  const { phase, setPhase, resetGame, setGameMode } = usePrisonStore();

  return (
    <SubscriptionGuard gameSlug="prison">
      <GameLayout gameSlug="prison" gameName="السجن" gameEmoji="🔒" accentColor="amber">
        <PrisonContent />
      </GameLayout>
    </SubscriptionGuard>
  );
}

function PrisonContent() {
  const { phase, setPhase, resetGame, setGameMode } = usePrisonStore();
  const mounted = useHydrated();

  // Start host heartbeat in Diwaniya mode
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
    window.location.href = `/join/prison/${code}?name=${encodeURIComponent(name)}`;
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center prison-bg">
        <div className="text-center flex-1 flex items-center justify-center">
          <div>
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-slate-400">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // LANDING PAGE
  // ============================
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

  // ============================
  // SETUP PAGE
  // ============================
  if (phase === 'setup') {
    return (
      <main>
        <GameSetup />
      </main>
    );
  }

  // ============================
  // PLAYING / GAME OVER
  // ============================
  return (
    <div className="flex flex-col min-h-screen prison-bg">
      <GameTopBar />
      <main className="flex-1">
        {phase === 'playing' && <GameBoard />}
        {phase === 'game_over' && <PrisonGameOver />}
      </main>
    </div>
  );
}
