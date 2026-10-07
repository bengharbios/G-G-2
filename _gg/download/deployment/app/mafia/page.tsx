'use client';

import { useSyncExternalStore, useState, useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/game-store';
import LandingPage from '@/components/mafia/LandingPage';
import GameSetup from '@/components/mafia/GameSetup';
import DiwaniyaSetup from '@/components/mafia/DiwaniyaSetup';
import CardDistribution from '@/components/mafia/CardDistribution';
import NightPhase from '@/components/mafia/NightPhase';
import DayPhase from '@/components/mafia/DayPhase';
import GameOver from '@/components/mafia/GameOver';
import GameFooter from '@/components/mafia/GameFooter';
import GameIntroCard from '@/components/mafia/GameIntroCard';
import WelcomePopup from '@/components/mafia/WelcomePopup';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import { Home as HomeIcon, RotateCcw, X } from 'lucide-react';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import GameLayout from '@/components/shared/GameLayout';

// ============================================================
// HOST HEARTBEAT HOOK - keeps hostLastSeen alive in Diwaniya mode
// ============================================================
function useHostHeartbeat() {
  const { roomCode, gameMode } = useGameStore();

  useEffect(() => {
    if (gameMode !== 'diwaniya' || !roomCode) return;

    // Send heartbeat immediately
    const sendHeartbeat = () => {
      fetch(`/api/room/${roomCode}/heartbeat`, {
        method: 'POST',
      }).catch(() => {
        // silent
      });
    };

    sendHeartbeat();

    // Send heartbeat every 5 seconds
    const interval = setInterval(sendHeartbeat, 5000);

    return () => clearInterval(interval);
  }, [gameMode, roomCode]);

  // End session when host closes tab/navigates away (Diwaniya mode)
  useEffect(() => {
    if (gameMode !== 'diwaniya' || !roomCode) return;

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliability during page unload
      const baseUrl = window.location.origin;
      navigator.sendBeacon(
        `${baseUrl}/api/room/${roomCode}`,
        JSON.stringify({ _method: 'DELETE' })
      );
      // Also try fetch as backup
      try {
        fetch(`/api/room/${roomCode}`, { method: 'DELETE' });
      } catch {
        // ignore
      }
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
    <div className="bg-gradient-to-l from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-2.5 sm:p-3 mx-3 sm:mx-4 mt-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] sm:text-xs text-indigo-300">كود الغرفة - شاركه مع اللاعبين:</p>
          <p className="text-xl sm:text-2xl font-mono font-bold text-white tracking-widest">{code}</p>
        </div>
        <button onClick={copy} className="text-xs bg-indigo-800/50 text-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-700/50">
          {copied ? '✅ تم!' : '📋 نسخ'}
        </button>
      </div>
    </div>
  );
}





// Persistent top navigation bar during gameplay
function GameTopBar() {
  const { phase, gameMode, roomCode, hostName, resetGame } = useGameStore();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const isInGame = phase !== 'setup';
  const isGameOver = phase === 'game_over';

  const handleExit = async () => {
    setLeaving(true);
    if (roomCode && gameMode === 'diwaniya') {
      try {
        await fetch(`/api/room/${roomCode}`, { method: 'DELETE' });
      } catch {
        // ignore
      }
    }
    resetGame();
    setLeaving(false);
    setShowExitDialog(false);
  };

  const handleReset = () => {
    resetGame();
    setShowResetConfirm(false);
  };

  const PHASE_LABELS: Record<string, string> = {
    card_distribution: '🃏 توزيع البطاقات',
    night_start: '🌙 التغميضة',
    night_mafia_wake: '👾 المافيا تستيقظ',
    night_boss_kill: '🔪 شيخ المافيا',
    night_silencer: '🤫 التسكيت',
    night_mafia_sleep: '😴 المافيا تنام',
    night_medic: '🏥 الطبيب',
    night_sniper: '🎯 القناص',
    night_end: '🌅 انتهت الليل',
    day_announcements: '📢 أحداث الليل',
    day_mayor_reveal: '🏛️ كشف العمده',
    day_discussion: '💬 النقاش',
    day_voting: '🗳️ التصويت',
    day_elimination: '⚔️ الإقصاء',
    good_son_revenge: '👦 انتقام الولد الصالح',
    game_over: '🏁 انتهت اللعبة',
  };

  const phaseLabel = PHASE_LABELS[phase] || '';

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5">
          {/* Home / Exit button */}
          <Button
            onClick={() => setShowExitDialog(true)}
            variant="ghost"
            className="text-slate-400 hover:text-red-400 hover:bg-red-950/30 gap-1.5 text-xs h-8 px-2"
          >
            <HomeIcon className="w-4 h-4" />
            <span className="hidden sm:inline">الرئيسية</span>
          </Button>

          {/* Phase label */}
          <Badge
            variant="outline"
            className={`text-[10px] sm:text-xs px-2 py-0.5 ${
              phase?.startsWith('night')
                ? 'border-indigo-500/50 text-indigo-300'
                : isGameOver
                ? 'border-yellow-500/50 text-yellow-300'
                : 'border-yellow-500/50 text-yellow-400'
            }`}
          >
            {phaseLabel}
          </Badge>

          {/* Host name badge (Diwaniya) or reset (Godfather) */}
            {gameMode === 'diwaniya' && hostName ? (
              <div className="flex items-center gap-1 bg-amber-950/40 border border-amber-500/30 rounded-lg px-2 py-1">
                <span className="text-xs">🕴️</span>
                <span className="text-[10px] sm:text-xs font-bold text-amber-300 max-w-[80px] truncate">{hostName}</span>
              </div>
            ) : (
          <div className="relative">
            {!showResetConfirm && !isGameOver ? (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-950/30"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </motion.button>
            ) : showResetConfirm ? (
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
            ) : null}
          </div>
            )}
        </div>
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
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="text-5xl mb-3">🚪</div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">
                  الخروج من اللعبة؟
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  {gameMode === 'diwaniya'
                    ? 'إذا خرجت، سيتم إنهاء الجلسة وسيخرج جميع اللاعبين. هل تريد المتابعة؟'
                    : 'سيتم إعادة تعيين اللعبة بالكامل. هل تريد المتابعة؟'}
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
                    {leaving ? (
                      <span className="flex items-center gap-1">
                        جاري الخروج...
                      </span>
                    ) : (
                      'نعم، اخرج'
                    )}
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

export default function Home() {
  // Subscription guard wraps the entire page
  return (
    <SubscriptionGuard gameSlug="mafia">
      <GameLayout gameSlug="mafia" gameName="المافيا" gameEmoji="🕵️" accentColor="red">
        <HomeContent />
      </GameLayout>
    </SubscriptionGuard>
  );
}

function HomeContent() {
  const { phase, roomCode, gameMode } = useGameStore();
  const mounted = useHydrated();

  // Start host heartbeat in Diwaniya mode
  useHostHeartbeat();
  const [showGodfatherSetup, setShowGodfatherSetup] = useState(false);
  const [showDiwaniyaSetup, setShowDiwaniyaSetup] = useState(false);
  const [restoredFromPersist, setRestoredFromPersist] = useState(false);
  const [showGameIntro, setShowGameIntro] = useState(false);
  // Welcome popup: only show ONCE per device, check localStorage after mount
  const [showWelcome, setShowWelcome] = useState(false);

  // After mount, check if welcome was shown before
  useEffect(() => {
    if (!localStorage.getItem('mafia_welcome_shown')) {
      setShowWelcome(true);
    }
  }, []);

  // Game intro: only show ONCE per device (first game start ever)
  const [gameIntroDismissed, setGameIntroDismissed] = useState(false);
  useEffect(() => {
    if (localStorage.getItem('mafia_game_intro_shown')) {
      setGameIntroDismissed(true);
    }
  }, []);

  // Restore correct screen from persisted Zustand state after hydration
  useEffect(() => {
    if (!mounted || restoredFromPersist) return;
    setRestoredFromPersist(true);

    if (phase === 'setup') {
      if (gameMode === 'diwaniya' && roomCode) {
        // Host was in Diwaniya setup (waiting for players) - restore
        setShowDiwaniyaSetup(true);
      } else if (gameMode === 'godfather') {
        // Host was in Godfather setup (entering player names) - restore
        setShowGodfatherSetup(true);
      }
    }
  }, [mounted, phase, gameMode, roomCode, restoredFromPersist]);

  // Show intro card when game starts — but only ONCE per device ever
  useEffect(() => {
    if (phase === 'card_distribution' && !gameIntroDismissed && restoredFromPersist) {
      setShowGameIntro(true);
    }
  }, [phase, gameIntroDismissed, restoredFromPersist]);

  // Detect phase change from setup to card_distribution for new game starts
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (prevPhaseRef.current !== 'card_distribution' && phase === 'card_distribution' && !gameIntroDismissed) {
      setShowGameIntro(true);
    }
    prevPhaseRef.current = phase;
  }, [phase, gameIntroDismissed]);

  // Reset UI state when game is explicitly reset (not on page refresh)
  useEffect(() => {
    if (phase === 'setup' && !gameMode && !roomCode) {
      setShowGodfatherSetup(false);
      setShowDiwaniyaSetup(false);
      setShowGameIntro(false);
    }
  }, [phase, gameMode, roomCode]);

  // Dismiss welcome popup permanently
  const handleDismissWelcome = useCallback(() => {
    setShowWelcome(false);
    localStorage.setItem('mafia_welcome_shown', 'true');
  }, []);

  // Dismiss game intro permanently
  const handleDismissGameIntro = useCallback(() => {
    setShowGameIntro(false);
    localStorage.setItem('mafia_game_intro_shown', 'true');
  }, []);

  // Hide welcome when user starts a mode
  const handleStartGodfather = useCallback(() => {
    if (showWelcome) {
      setShowWelcome(false);
      localStorage.setItem('mafia_welcome_shown', 'true');
    }
    setShowGodfatherSetup(true);
  }, [showWelcome]);

  const handleStartDiwaniya = useCallback(() => {
    if (showWelcome) {
      setShowWelcome(false);
      localStorage.setItem('mafia_welcome_shown', 'true');
    }
    setShowDiwaniyaSetup(true);
  }, [showWelcome]);

  const handleGodfatherSetupDone = useCallback(() => {
    // startGame is called from GameSetup itself
  }, []);

  const handleDiwaniyaSetupDone = useCallback(() => {
    // startGame is called from DiwaniyaSetup itself
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a1a]">
        <div className="text-center flex-1 flex items-center justify-center">
          <div>
            <div className="text-5xl mb-4">🕵️</div>
            <p className="text-slate-400">جاري التحميل...</p>
          </div>
        </div>
        <BrandedFooter />
      </div>
    );
  }

  // ============================
  // SETUP PHASE (with footer)
  // ============================
  if (phase === 'setup') {
    // Landing page (mode selection + player join)
    if (!showGodfatherSetup && !showDiwaniyaSetup) {
      return (
        <div>
          <main>
            <LandingPage onStartGodfather={handleStartGodfather} onStartDiwaniya={handleStartDiwaniya} />
          </main>
          <WelcomePopup show={showWelcome} onDismiss={handleDismissWelcome} />
        </div>
      );
    }

    // Godfather setup (local player names entry)
    if (showGodfatherSetup) {
      return (
        <div>
          <main>
            <GameSetup onStartGame={handleGodfatherSetupDone} />
          </main>
        </div>
      );
    }

    // Diwaniya setup (create room, wait for players)
    if (showDiwaniyaSetup) {
      return (
        <div>
          <main>
            <DiwaniyaSetup onStartGame={handleDiwaniyaSetupDone} />
          </main>
        </div>
      );
    }
  }

  // ============================
  // GAME PHASES (both modes share these)
  // ============================
  return (
    <div className="flex flex-col min-h-screen">
      {/* Game intro popup card */}
      <GameIntroCard
        show={showGameIntro}
        onDismiss={handleDismissGameIntro}
        gameMode={gameMode}
      />

      {/* Persistent top navigation bar */}
      <GameTopBar />

      <main className="flex-1 flex flex-col">
        {phase === 'card_distribution' && (
          <>
            {roomCode && <RoomCodeBanner code={roomCode} />}
            <CardDistribution />
          </>
        )}

        {[
          'night_start',
          'night_mafia_wake',
          'night_boss_kill',
          'night_silencer',
          'night_mafia_sleep',
          'night_medic',
          'night_sniper',
          'night_end',
        ].includes(phase) && (
          <>
            {roomCode && <RoomCodeBanner code={roomCode} />}
            <NightPhase />
          </>
        )}

        {[
          'day_announcements',
          'day_mayor_reveal',
          'day_discussion',
          'day_voting',
          'day_elimination',
          'good_son_revenge',
        ].includes(phase) && (
          <>
            {roomCode && <RoomCodeBanner code={roomCode} />}
            <DayPhase />
          </>
        )}

        {phase === 'game_over' && (
          <>
            {roomCode && <RoomCodeBanner code={roomCode} />}
            <GameOver />
          </>
        )}
      </main>
      <GameFooter />
    </div>
  );
}
