'use client';

import { useSyncExternalStore, useState, useCallback, useEffect, useRef } from 'react';
import { useShifaratStore } from '@/lib/shifarat-store';
import LandingPage from '@/components/shifarat/LandingPage';
import GameSetup from '@/components/shifarat/GameSetup';
import DiwaniyaSetup from '@/components/shifarat/DiwaniyaSetup';
import PlayingPhase from '@/components/shifarat/PlayingPhase';
import GameOver from '@/components/shifarat/GameOver';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import { Home as HomeIcon, RotateCcw, Copy, Check } from 'lucide-react';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import GameLayout from '@/components/shared/GameLayout';

// ============================================================
// HOST HEARTBEAT HOOK - keeps hostLastSeen alive in Diwaniya mode
// ============================================================
function useHostHeartbeat() {
  const { roomCode, gameMode } = useShifaratStore();

  useEffect(() => {
    if (gameMode !== 'diwaniya' || !roomCode) return;

    const sendHeartbeat = () => {
      fetch(`/api/room/${roomCode}/heartbeat`, {
        method: 'POST',
      }).catch(() => {});
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 5000);
    return () => clearInterval(interval);
  }, [gameMode, roomCode]);

  useEffect(() => {
    if (gameMode !== 'diwaniya' || !roomCode) return;

    const handleBeforeUnload = () => {
      const baseUrl = window.location.origin;
      navigator.sendBeacon(
        `${baseUrl}/api/room/${roomCode}`,
        JSON.stringify({ _method: 'DELETE' })
      );
      try {
        fetch(`/api/room/${roomCode}`, { method: 'DELETE' });
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [gameMode, roomCode]);
}

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function RoomCodeBanner({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="bg-gradient-to-l from-emerald-900/50 to-teal-900/50 border border-emerald-500/30 rounded-xl p-2.5 sm:p-3 mx-3 sm:mx-4 mt-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] sm:text-xs text-emerald-300">كود الغرفة - شاركه مع اللاعبين:</p>
          <p className="text-xl sm:text-2xl font-mono font-bold text-white tracking-widest">{code}</p>
        </div>
        <button onClick={copy} className="text-xs bg-emerald-800/50 text-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-700/50 flex items-center gap-1">
          {copied ? <><Check size={14} /> تم!</> : <><Copy size={14} /> نسخ</>}
        </button>
      </div>
    </div>
  );
}

function GameTopBar() {
  const { phase, gameMode, roomCode, hostName, resetGame } = useShifaratStore();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const isInGame = phase !== 'setup';

  const handleExit = async () => {
    setLeaving(true);
    if (roomCode && gameMode === 'diwaniya') {
      try { await fetch(`/api/room/${roomCode}`, { method: 'DELETE' }); } catch {}
    }
    resetGame();
    setLeaving(false);
    setShowExitDialog(false);
  };

  const handleReset = () => {
    resetGame();
    setShowResetConfirm(false);
  };

  // Map new Codenames phases to labels
  const PHASE_LABELS: Record<string, string> = {
    setup: '⚙️ الإعداد',
    spymaster_view: '👁️ رؤية الجاسوس',
    clue_given: '💬 الدليل',
    team_guessing: '🎯 التخمين',
    turn_result: '📋 النتيجة',
    turn_switch: '🔄 تبديل الدور',
    game_over: '🏆 انتهت اللعبة',
  };

  const phaseLabel = PHASE_LABELS[phase] || '';

  const getPhaseColor = () => {
    switch (phase) {
      case 'spymaster_view': return 'border-purple-500/50 text-purple-300';
      case 'clue_given': return 'border-emerald-500/50 text-emerald-300';
      case 'team_guessing': return 'border-amber-500/50 text-amber-300';
      case 'turn_result': return 'border-blue-500/50 text-blue-300';
      case 'turn_switch': return 'border-slate-500/50 text-slate-400';
      case 'game_over': return 'border-yellow-500/50 text-yellow-300';
      default: return 'border-slate-500/50 text-slate-400';
    }
  };

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5">
          <Button onClick={() => setShowExitDialog(true)} variant="ghost"
            className="text-slate-400 hover:text-red-400 hover:bg-red-950/30 gap-1.5 text-xs h-8 px-2">
            <HomeIcon className="w-4 h-4" />
            <span className="hidden sm:inline">الرئيسية</span>
          </Button>
          <Badge variant="outline"
            className={`text-[10px] sm:text-xs px-2 py-0.5 ${getPhaseColor()}`}>
            {phaseLabel}
          </Badge>
          {gameMode === 'diwaniya' && hostName ? (
            <div className="flex items-center gap-1 bg-amber-950/40 border border-amber-500/30 rounded-lg px-2 py-1">
              <span className="text-xs">🕴️</span>
              <span className="text-[10px] sm:text-xs font-bold text-amber-300 max-w-[80px] truncate">{hostName}</span>
            </div>
          ) : (
            <div className="relative">
              {!showResetConfirm && isInGame ? (
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-950/30">
                  <RotateCcw className="w-3.5 h-3.5" />
                </motion.button>
              ) : showResetConfirm ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1">
                  <span className="text-[10px] text-red-400 font-bold">مؤكد؟</span>
                  <button onClick={handleReset} className="text-[10px] bg-red-900/60 text-red-300 px-1.5 py-0.5 rounded font-bold">نعم</button>
                  <button onClick={() => setShowResetConfirm(false)} className="text-[10px] bg-slate-800/60 text-slate-400 px-1.5 py-0.5 rounded font-bold">لا</button>
                </motion.div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showExitDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={() => setShowExitDialog(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="text-center">
                <div className="text-5xl mb-3">🚪</div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">الخروج من اللعبة؟</h3>
                <p className="text-sm text-slate-400 mb-6">
                  {gameMode === 'diwaniya' ? 'سيتم إنهاء الجلسة وسيخرج جميع اللاعبين.' : 'سيتم إعادة تعيين اللعبة بالكامل.'}
                </p>
                <div className="flex gap-3">
                  <Button onClick={() => setShowExitDialog(false)} variant="outline" disabled={leaving}
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 h-11">إلغاء</Button>
                  <Button onClick={handleExit} disabled={leaving}
                    className="flex-1 bg-gradient-to-l from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold h-11">
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
// MAIN PAGE EXPORT
// ============================================================
export default function ShifaratPage() {
  return (
    <SubscriptionGuard gameSlug="shifarat">
      <GameLayout gameSlug="shifarat" gameName="الشيفرات" gameEmoji="🎯" accentColor="emerald">
        <HomeContent />
      </GameLayout>
    </SubscriptionGuard>
  );
}

function HomeContent() {
  const {
    phase, roomCode, gameMode,
    resetGame,
  } = useShifaratStore();
  const mounted = useHydrated();
  useHostHeartbeat();

  const [showGodfatherSetup, setShowGodfatherSetup] = useState(false);
  const [showDiwaniyaSetup, setShowDiwaniyaSetup] = useState(false);
  const hasRestoredRef = useRef(false);

  // Restore the correct setup view from persisted state
  useEffect(() => {
    if (!mounted || hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    // Use a microtask to avoid the cascading render warning
    queueMicrotask(() => {
      if (phase === 'setup') {
        if (gameMode === 'diwaniya' && roomCode) setShowDiwaniyaSetup(true);
        else if (gameMode === 'godfather') setShowGodfatherSetup(true);
      }
    });
  }, [mounted, phase, gameMode, roomCode]);

  // Reset setup view when game is fully reset
  useEffect(() => {
    if (phase === 'setup' && !gameMode && !roomCode) {
      queueMicrotask(() => {
        setShowGodfatherSetup(false);
        setShowDiwaniyaSetup(false);
      });
    }
  }, [phase, gameMode, roomCode]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a1a]">
        <div className="text-center flex-1 flex items-center justify-center">
          <div>
            <div className="text-5xl mb-4">🎯</div>
            <p className="text-slate-400">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'setup') {
    if (!showGodfatherSetup && !showDiwaniyaSetup) {
      return (
        <main>
          <LandingPage onSelectMode={(mode) => {
            if (mode === 'godfather') setShowGodfatherSetup(true);
            else setShowDiwaniyaSetup(true);
          }} />
        </main>
      );
    }
    if (showGodfatherSetup) {
      const handleStart = (settings: {
        team1Name: string;
        team2Name: string;
        timer: number;
        categories: string[];
        firstTeam: 'red' | 'blue';
        redSpymaster?: string;
        blueSpymaster?: string;
      }) => {
        useShifaratStore.getState().startGame(
          settings.team1Name,
          settings.team2Name,
          settings.categories,
          settings.timer,
          settings.firstTeam,
          settings.redSpymaster,
          settings.blueSpymaster,
        );
        setShowGodfatherSetup(false);
      };
      return <main><GameSetup onStart={handleStart} onBack={() => setShowGodfatherSetup(false)} /></main>;
    }
    if (showDiwaniyaSetup) {
      const handleStart = (_code: string, settings: any) => {
        useShifaratStore.getState().startGame(
          settings.team1Name,
          settings.team2Name,
          settings.categories,
          settings.timer,
          settings.firstTeam,
          settings.redSpymaster,
          settings.blueSpymaster,
        );
        useShifaratStore.getState().setRoomCode(_code);
        useShifaratStore.getState().setGameMode('diwaniya');
        setShowDiwaniyaSetup(false);
      };
      return <main><DiwaniyaSetup onStart={handleStart} onBack={() => setShowDiwaniyaSetup(false)} /></main>;
    }
  }

  // In-game phases
  const isActiveGame = phase === 'spymaster_view' || phase === 'clue_given' || phase === 'team_guessing' || phase === 'turn_result' || phase === 'turn_switch';

  return (
    <div className="flex flex-col min-h-screen">
      <GameTopBar />
      <main className="flex-1 flex flex-col">
        {roomCode && <RoomCodeBanner code={roomCode} />}
        {isActiveGame && <PlayingPhase />}
        {phase === 'game_over' && <GameOver />}
      </main>
    </div>
  );
}
