'use client';

import { useSyncExternalStore, useState, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  X,
  Crown,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Trophy,
  RotateCcw,
  HelpCircle,
  Play,
  Volume2,
  VolumeX,
  Waves,
  Swords,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import { allBaharHarbQuestions, BaharHarbQuestion } from '@/lib/baharharb-questions';

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
// Sound effects (Web Audio API)
// ============================================================
function useSoundEffects(enabled: boolean) {
  const getCtx = useCallback(() => {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }, []);

  const playReveal = useCallback(() => {
    if (!enabled) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }, [enabled, getCtx]);

  const playScore = useCallback(() => {
    if (!enabled) return;
    try {
      const ctx = getCtx();
      const notes = [523, 659, 784];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.3);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.3);
      });
    } catch {}
  }, [enabled, getCtx]);

  const playWin = useCallback(() => {
    if (!enabled) return;
    try {
      const ctx = getCtx();
      const notes = [523, 659, 784, 1047, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.3);
      });
    } catch {}
  }, [enabled, getCtx]);

  return { playReveal, playScore, playWin };
}

// ============================================================
// Question deduplication (localStorage)
// ============================================================
function getUsedQuestionIds(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem('baharharb-used-questions');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function markQuestionsAsUsed(ids: number[]) {
  const used = getUsedQuestionIds();
  ids.forEach((id) => used.add(id));
  const arr = Array.from(used).slice(-500);
  try {
    localStorage.setItem('baharharb-used-questions', JSON.stringify(arr));
  } catch {}
}

function selectRandomQuestions(count: number): BaharHarbQuestion[] {
  const usedIds = getUsedQuestionIds();
  const available = allBaharHarbQuestions.filter((q) => !usedIds.has(q.id));

  // Shuffle available
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  // If not enough unused questions, fill with random from all
  if (selected.length < count) {
    const remaining = count - selected.length;
    const allShuffled = [...allBaharHarbQuestions].sort(() => Math.random() - 0.5);
    for (let i = 0; i < allShuffled.length && selected.length < count; i++) {
      if (!selected.find((s) => s.id === allShuffled[i].id)) {
        selected.push(allShuffled[i]);
      }
    }
  }

  // Mark as used
  markQuestionsAsUsed(selected.map((q) => q.id));
  return selected;
}

// ============================================================
// Game types
// ============================================================
type GamePhase = 'landing' | 'settings' | 'playing' | 'gameOver';

interface GameState {
  phase: GamePhase;
  mode: 'godfather' | null;
  team1Name: string;
  team2Name: string;
  playMode: 'teams' | 'individuals';
  totalQuestions: number;
  currentQuestionIndex: number;
  questions: BaharHarbQuestion[];
  team1Score: number;
  team2Score: number;
  showClue1: boolean;
  showClue2: boolean;
  showAnswer1: boolean;
  showAnswer2: boolean;
}

const INITIAL_STATE: GameState = {
  phase: 'landing',
  mode: null,
  team1Name: 'الفريق الأول',
  team2Name: 'الفريق الثاني',
  playMode: 'teams',
  totalQuestions: 10,
  currentQuestionIndex: 0,
  questions: [],
  team1Score: 0,
  team2Score: 0,
  showClue1: false,
  showClue2: false,
  showAnswer1: false,
  showAnswer2: false,
};

// ============================================================
// BrandedHeader
// ============================================================
function BrandedHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-teal-900/30 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <img
              src="/platform-logo.png"
              alt=""
              className="w-6 h-6 rounded-md object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<span class="text-white text-xs font-black">غ</span>';
              }}
            />
          </div>
          <span className="text-sm font-bold text-slate-400">الرئيسية</span>
        </a>
        <h1 className="text-lg font-bold text-slate-200">{title}</h1>
      </div>
    </header>
  );
}

// ============================================================
// BrandedFooter
// ============================================================
function BrandedFooter() {
  return (
    <footer className="text-center py-6 text-xs text-slate-600 border-t border-slate-800/30">
      <p>
        برمجة <span className="text-slate-400">الغريب</span> | برعاية{' '}
        <span className="text-slate-400">ANA VIP 100034</span>
      </p>
    </footer>
  );
}

// ============================================================
// GameTopBar
// ============================================================
function GameTopBar({ title, onHome }: { title: string; onHome: () => void }) {
  const [showExit, setShowExit] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-teal-900/30 px-4 py-2.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setShowExit(true)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 transition-colors px-2 py-1 rounded-lg hover:bg-rose-950/30"
          >
            <Home className="w-4 h-4" />
            <span className="text-xs hidden sm:inline">الرئيسية</span>
          </button>
          <span className="text-sm font-bold text-teal-300">{title}</span>
          <div className="w-16" />
        </div>
      </div>

      <AnimatePresence>
        {showExit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowExit(false)}
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
                <h3 className="text-lg font-bold text-slate-200 mb-2">الخروج من اللعبة؟</h3>
                <p className="text-sm text-slate-400 mb-6">سيتم فقدان تقدم اللعبة الحالية. هل تريد المتابعة؟</p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowExit(false)}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 h-11"
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={() => {
                      setShowExit(false);
                      onHome();
                    }}
                    className="flex-1 bg-gradient-to-l from-rose-700 to-rose-900 hover:from-rose-600 hover:to-rose-800 text-white font-bold h-11"
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
// Landing Page Component
// ============================================================
function LandingPage({ onStart }: { onStart: (mode: 'godfather') => void }) {
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Title Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <div className="text-7xl mb-4">🌊⚔️</div>
        <h1 className="text-3xl sm:text-4xl font-black mb-3">
          <span className="bg-gradient-to-l from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
            بحر و حرب
          </span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">لعبة ذكاء وكلمات عربية</p>
        <p className="text-slate-500 text-xs mt-2">600+ سؤال متنوع</p>
      </motion.div>

      {/* Mode Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-4 mb-6"
      >
        <button
          onClick={() => onStart('godfather')}
          className="w-full group relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/60 via-slate-900/80 to-slate-900/80 p-5 sm:p-6 text-right transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-amber-200 mb-1">العراب</h3>
              <p className="text-xs text-slate-400">الوضع المحلي - العراب يقرأ الدلائل والفرق تخمن</p>
            </div>
            <Play className="w-5 h-5 text-amber-500/50 group-hover:text-amber-400 transition-colors" />
          </div>
        </button>

        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-slate-900/80 z-10" />
          <div className="rounded-2xl border border-slate-700/30 bg-gradient-to-br from-slate-800/40 via-slate-900/60 to-slate-900/60 p-5 sm:p-6 text-right opacity-50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/40 to-indigo-600/40 flex items-center justify-center">
                <Users className="w-7 h-7 text-blue-300/50" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-blue-300/50">الديوانية</h3>
                  <Badge variant="outline" className="border-blue-500/40 text-blue-400 text-[10px] px-2 py-0">
                    قريباً
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">العب مع أصدقائك أونلاين</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Rules Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <button
          onClick={() => setShowRules(!showRules)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-700/50 bg-slate-800/40 text-slate-400 hover:text-slate-300 hover:bg-slate-800/60 transition-all"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <HelpCircle className="w-4 h-4" />
            كيف تلعب؟
          </span>
          <ChevronLeft
            className={cn('w-4 h-4 transition-transform', showRules && 'rotate-90')}
          />
        </button>

        <AnimatePresence>
          {showRules && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-4 rounded-xl border border-teal-900/30 bg-teal-950/20 space-y-3">
                <div className="flex gap-3">
                  <span className="text-xl">🌊</span>
                  <div>
                    <p className="text-sm font-bold text-teal-300">بحر (الدليل الأول)</p>
                    <p className="text-xs text-slate-400">العِراب يقرأ الدليل الأول للفريقين</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-xl">⚔️</span>
                  <div>
                    <p className="text-sm font-bold text-rose-300">حرب (الدليل الثاني)</p>
                    <p className="text-xs text-slate-400">العِراب يقرأ الدليل الثاني</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <p className="text-sm font-bold text-amber-300">الحلول</p>
                    <p className="text-xs text-slate-400">
                      كل دليل له إجابة - الإجابات تتشابه في الحروف! الفريق الذي يخمن الإجابة الصحيحة يحصل على نقطة
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-xl">🏆</span>
                  <div>
                    <p className="text-sm font-bold text-emerald-300">الفوز</p>
                    <p className="text-xs text-slate-400">
                      الفريق الأكثر نقاطاً في نهاية الأسئلة يفوز!
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ============================================================
// Settings Page Component
// ============================================================
function SettingsPage({
  onStart,
  onBack,
}: {
  onStart: (team1: string, team2: string, mode: 'teams' | 'individuals', count: number) => void;
  onBack: () => void;
}) {
  const [team1Name, setTeam1Name] = useState('الفريق الأول');
  const [team2Name, setTeam2Name] = useState('الفريق الثاني');
  const [playMode, setPlayMode] = useState<'teams' | 'individuals'>('teams');
  const [totalQuestions, setTotalQuestions] = useState(10);

  const questionOptions = [10, 15, 20, 30];

  const canStart = playMode === 'individuals' || (team1Name.trim() && team2Name.trim());

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
      >
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors text-sm"
        >
          <ChevronRight className="w-4 h-4" />
          العودة
        </button>

        {/* Title */}
        <div className="text-center">
          <div className="text-4xl mb-2">⚙️</div>
          <h2 className="text-xl font-bold text-slate-200">إعدادات اللعبة</h2>
        </div>

        {/* Play Mode Toggle */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 space-y-3">
          <label className="text-sm font-medium text-slate-300">نوع اللعب</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPlayMode('teams')}
              className={cn(
                'py-2.5 px-4 rounded-lg border text-sm font-medium transition-all',
                playMode === 'teams'
                  ? 'border-teal-500/60 bg-teal-950/40 text-teal-300'
                  : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600'
              )}
            >
              👥 فرق
            </button>
            <button
              onClick={() => setPlayMode('individuals')}
              className={cn(
                'py-2.5 px-4 rounded-lg border text-sm font-medium transition-all',
                playMode === 'individuals'
                  ? 'border-teal-500/60 bg-teal-950/40 text-teal-300'
                  : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600'
              )}
            >
              🧑 أفراد
            </button>
          </div>
        </div>

        {/* Team Names */}
        {playMode === 'teams' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 space-y-3">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-500" />
                اسم الفريق الأول
              </label>
              <Input
                value={team1Name}
                onChange={(e) => setTeam1Name(e.target.value)}
                placeholder="الفريق الأول"
                className="bg-slate-900/60 border-slate-700 text-slate-200 placeholder:text-slate-600 text-right"
                maxLength={20}
              />
            </div>
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 space-y-3">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                اسم الفريق الثاني
              </label>
              <Input
                value={team2Name}
                onChange={(e) => setTeam2Name(e.target.value)}
                placeholder="الفريق الثاني"
                className="bg-slate-900/60 border-slate-700 text-slate-200 placeholder:text-slate-600 text-right"
                maxLength={20}
              />
            </div>
          </motion.div>
        )}

        {/* Number of Questions */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 space-y-3">
          <label className="text-sm font-medium text-slate-300">عدد الأسئلة</label>
          <div className="grid grid-cols-4 gap-2">
            {questionOptions.map((count) => (
              <button
                key={count}
                onClick={() => setTotalQuestions(count)}
                className={cn(
                  'py-2.5 px-3 rounded-lg border text-sm font-bold transition-all',
                  totalQuestions === count
                    ? 'border-amber-500/60 bg-amber-950/40 text-amber-300 shadow-lg shadow-amber-500/10'
                    : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600'
                )}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={() => onStart(team1Name, team2Name, playMode, totalQuestions)}
          disabled={!canStart}
          className={cn(
            'w-full h-13 text-base font-bold transition-all',
            canStart
              ? 'bg-gradient-to-l from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white shadow-lg shadow-teal-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          )}
        >
          <Play className="w-5 h-5 ml-2" />
          ابدأ اللعبة
        </Button>
      </motion.div>
    </div>
  );
}

// ============================================================
// Game Board Component
// ============================================================
function GameBoard({
  state,
  dispatch,
  soundEnabled,
  onToggleSound,
}: {
  state: GameState;
  dispatch: (action: Partial<GameState>) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}) {
  const { playReveal, playScore, playWin } = useSoundEffects(soundEnabled);
  const question = state.questions[state.currentQuestionIndex];
  const progress = ((state.currentQuestionIndex + 1) / state.totalQuestions) * 100;
  const isLastQuestion = state.currentQuestionIndex === state.totalQuestions - 1;

  const handleRevealClue1 = useCallback(() => {
    if (!state.showClue1) {
      playReveal();
    }
    dispatch({ showClue1: true });
  }, [state.showClue1, dispatch, playReveal]);

  const handleRevealClue2 = useCallback(() => {
    if (!state.showClue2) {
      playReveal();
    }
    dispatch({ showClue2: true });
  }, [state.showClue2, dispatch, playReveal]);

  const handleRevealAnswer1 = useCallback(() => {
    if (!state.showAnswer1) {
      playReveal();
    }
    dispatch({ showAnswer1: true });
  }, [state.showAnswer1, dispatch, playReveal]);

  const handleRevealAnswer2 = useCallback(() => {
    if (!state.showAnswer2) {
      playReveal();
    }
    dispatch({ showAnswer2: true });
  }, [state.showAnswer2, dispatch, playReveal]);

  const handleTeam1Score = useCallback(() => {
    playScore();
    dispatch({ team1Score: state.team1Score + 1 });
  }, [state.team1Score, dispatch, playScore]);

  const handleTeam2Score = useCallback(() => {
    playScore();
    dispatch({ team2Score: state.team2Score + 1 });
  }, [state.team2Score, dispatch, playScore]);

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      playWin();
      dispatch({ phase: 'gameOver' });
    } else {
      dispatch({
        currentQuestionIndex: state.currentQuestionIndex + 1,
        showClue1: false,
        showClue2: false,
        showAnswer1: false,
        showAnswer2: false,
      });
    }
  }, [isLastQuestion, state.currentQuestionIndex, dispatch, playWin]);

  const handleBack = useCallback(() => {
    if (state.currentQuestionIndex > 0) {
      dispatch({
        currentQuestionIndex: state.currentQuestionIndex - 1,
        showClue1: false,
        showClue2: false,
        showAnswer1: false,
        showAnswer2: false,
      });
    }
  }, [state.currentQuestionIndex, dispatch]);

  if (!question) return null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-52px)]">
      {/* Progress Bar */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-500">
            السؤال {state.currentQuestionIndex + 1} من {state.totalQuestions}
          </span>
          <button onClick={onToggleSound} className="text-slate-500 hover:text-slate-300 transition-colors">
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-l from-teal-400 to-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Score Display */}
      <div className="px-4 py-3 flex items-center justify-center gap-4 sm:gap-8">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 bg-teal-950/50 border border-teal-800/40 rounded-xl px-3 sm:px-4 py-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
          <span className="text-xs sm:text-sm text-teal-300 font-medium max-w-[80px] sm:max-w-[120px] truncate">
            {state.team1Name}
          </span>
          <motion.span
            key={state.team1Score}
            initial={{ scale: 1.5 }}
            animate={{ scale: 1 }}
            className="text-lg sm:text-xl font-black text-teal-200 w-8 text-center"
          >
            {state.team1Score}
          </motion.span>
        </motion.div>

        <span className="text-slate-600 text-xs font-bold">VS</span>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 bg-rose-950/50 border border-rose-800/40 rounded-xl px-3 sm:px-4 py-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span className="text-xs sm:text-sm text-rose-300 font-medium max-w-[80px] sm:max-w-[120px] truncate">
            {state.team2Name}
          </span>
          <motion.span
            key={state.team2Score}
            initial={{ scale: 1.5 }}
            animate={{ scale: 1 }}
            className="text-lg sm:text-xl font-black text-rose-200 w-8 text-center"
          >
            {state.team2Score}
          </motion.span>
        </motion.div>
      </div>

      {/* Clue Cards */}
      <div className="flex-1 px-3 sm:px-4 pb-4 flex flex-col justify-center">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Sea Card (بحر) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`sea-${state.currentQuestionIndex}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col"
            >
              <Card className="border-teal-700/30 bg-gradient-to-b from-teal-950/60 to-slate-900/80 overflow-hidden">
                <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center min-h-[220px] sm:min-h-[280px] justify-between">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="wave-float">
                      <Waves className="w-5 h-5 text-teal-400" />
                    </div>
                    <span className="text-sm font-bold text-teal-300">🌊 بحر</span>
                  </div>

                  {/* Clue */}
                  <div className="flex-1 flex items-center justify-center w-full">
                    <AnimatePresence mode="wait">
                      {!state.showClue1 ? (
                        <motion.div key="hidden-clue1" exit={{ opacity: 0 }}>
                          <Button
                            onClick={handleRevealClue1}
                            size="sm"
                            className="bg-teal-800/40 hover:bg-teal-800/60 border border-teal-600/40 text-teal-300 gap-1.5 text-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            اعرض الدليل
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.p
                          key="clue1"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-sm sm:text-base font-medium text-slate-200 leading-relaxed"
                        >
                          {question.clues[0]}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Answer */}
                  <div className="w-full mt-3 pt-3 border-t border-teal-800/20">
                    <AnimatePresence mode="wait">
                      {!state.showAnswer1 ? (
                        <motion.div key="hidden-ans1" exit={{ opacity: 0 }} className="flex justify-center">
                          <Button
                            onClick={handleRevealAnswer1}
                            variant="ghost"
                            size="sm"
                            className="text-teal-500/70 hover:text-teal-400 hover:bg-teal-950/40 text-xs gap-1"
                          >
                            <EyeOff className="w-3 h-3" />
                            كشف الإجابة
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="ans1"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center"
                        >
                          <p className="text-base sm:text-lg font-black text-teal-200">{question.answers[0]}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* War Card (حرب) */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`war-${state.currentQuestionIndex}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col"
            >
              <Card className="border-rose-700/30 bg-gradient-to-b from-rose-950/50 to-slate-900/80 overflow-hidden">
                <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center min-h-[220px] sm:min-h-[280px] justify-between">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="sword-swing">
                      <Swords className="w-5 h-5 text-rose-400" />
                    </div>
                    <span className="text-sm font-bold text-rose-300">⚔️ حرب</span>
                  </div>

                  {/* Clue */}
                  <div className="flex-1 flex items-center justify-center w-full">
                    <AnimatePresence mode="wait">
                      {!state.showClue2 ? (
                        <motion.div key="hidden-clue2" exit={{ opacity: 0 }}>
                          <Button
                            onClick={handleRevealClue2}
                            size="sm"
                            className="bg-rose-800/40 hover:bg-rose-800/60 border border-rose-600/40 text-rose-300 gap-1.5 text-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            اعرض الدليل
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.p
                          key="clue2"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-sm sm:text-base font-medium text-slate-200 leading-relaxed"
                        >
                          {question.clues[1]}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Answer */}
                  <div className="w-full mt-3 pt-3 border-t border-rose-800/20">
                    <AnimatePresence mode="wait">
                      {!state.showAnswer2 ? (
                        <motion.div key="hidden-ans2" exit={{ opacity: 0 }} className="flex justify-center">
                          <Button
                            onClick={handleRevealAnswer2}
                            variant="ghost"
                            size="sm"
                            className="text-rose-500/70 hover:text-rose-400 hover:bg-rose-950/40 text-xs gap-1"
                          >
                            <EyeOff className="w-3 h-3" />
                            كشف الإجابة
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="ans2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center"
                        >
                          <p className="text-base sm:text-lg font-black text-rose-200">{question.answers[1]}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/50 px-3 sm:px-4 py-3 space-y-2">
        {/* Team Score Buttons */}
        {state.playMode === 'teams' && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleTeam1Score}
              className="bg-gradient-to-l from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white font-bold h-11 text-sm gap-2 shadow-lg shadow-teal-500/20"
            >
              <Check className="w-4 h-4" />
              {state.team1Name} صح ✅
            </Button>
            <Button
              onClick={handleTeam2Score}
              className="bg-gradient-to-l from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold h-11 text-sm gap-2 shadow-lg shadow-rose-500/20"
            >
              <Check className="w-4 h-4" />
              {state.team2Name} صح ✅
            </Button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleBack}
            disabled={state.currentQuestionIndex === 0}
            variant="outline"
            className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 h-10 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4 ml-1" />
            ⬅ العودة
          </Button>
          <Button
            onClick={handleNext}
            className="flex-[2] bg-gradient-to-l from-amber-600 to-yellow-700 hover:from-amber-500 hover:to-yellow-600 text-white font-bold h-10 gap-1.5 shadow-lg shadow-amber-500/20"
          >
            {isLastQuestion ? (
              <>🏁 إنهاء اللعبة</>
            ) : (
              <>
                السؤال التالي
                <ChevronLeft className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Game Over Component
// ============================================================
function GameOverPage({
  state,
  onPlayAgain,
  onHome,
}: {
  state: GameState;
  onPlayAgain: () => void;
  onHome: () => void;
}) {
  const { playWin } = useSoundEffects(true);

  useEffect(() => {
    const timer = setTimeout(() => playWin(), 300);
    return () => clearTimeout(timer);
  }, [playWin]);

  const team1Won = state.team1Score > state.team2Score;
  const team2Won = state.team2Score > state.team1Score;
  const draw = state.team1Score === state.team2Score;

  const winnerName = team1Won ? state.team1Name : team2Won ? state.team2Name : null;
  const winnerEmoji = team1Won ? '🌊' : team2Won ? '⚔️' : '🤝';

  return (
    <div className="px-4 py-6 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-52px)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="text-center w-full space-y-6"
      >
        {/* Trophy */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-7xl sm:text-8xl"
        >
          <Trophy className="w-20 h-20 sm:w-24 sm:h-24 text-amber-400 mx-auto drop-shadow-lg drop-shadow-amber-500/30" />
        </motion.div>

        {/* Winner Announcement */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-black mb-2">
            {draw ? (
              <span className="bg-gradient-to-l from-teal-300 to-rose-300 bg-clip-text text-transparent">
                تعادل!
              </span>
            ) : (
              <span className="bg-gradient-to-l from-amber-300 to-yellow-200 bg-clip-text text-transparent">
                {winnerName} 🎉
              </span>
            )}
          </h2>
          <p className="text-slate-400 text-sm">
            {draw ? 'نتيجة متعادلة - مباراة قوية!' : `فاز بنتيجة مبهرة!`}
          </p>
          <p className="text-4xl mt-2">{winnerEmoji}</p>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3 w-full">
          {/* Team 1 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={cn(
              'rounded-xl border p-4 flex items-center justify-between',
              team1Won
                ? 'border-amber-500/40 bg-amber-950/20 pulse-glow-gold'
                : 'border-slate-700/50 bg-slate-800/40'
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌊</span>
              <span className="text-sm font-medium text-slate-300">{state.team1Name}</span>
            </div>
            <span className={cn('text-2xl font-black', team1Won ? 'text-amber-300' : 'text-slate-400')}>
              {state.team1Score}
            </span>
          </motion.div>

          {/* VS */}
          <div className="text-center text-xs text-slate-600 font-bold">VS</div>

          {/* Team 2 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className={cn(
              'rounded-xl border p-4 flex items-center justify-between',
              team2Won
                ? 'border-amber-500/40 bg-amber-950/20 pulse-glow-gold'
                : 'border-slate-700/50 bg-slate-800/40'
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚔️</span>
              <span className="text-sm font-medium text-slate-300">{state.team2Name}</span>
            </div>
            <span className={cn('text-2xl font-black', team2Won ? 'text-amber-300' : 'text-slate-400')}>
              {state.team2Score}
            </span>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 w-full pt-2">
          <Button
            onClick={onPlayAgain}
            className="w-full h-12 bg-gradient-to-l from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white font-bold text-base gap-2 shadow-lg shadow-teal-500/20"
          >
            <RotateCcw className="w-4 h-4" />
            العب مرة أخرى
          </Button>
          <Button
            onClick={onHome}
            variant="outline"
            className="w-full h-11 border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            الصفحة الرئيسية
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// Main Page Component
// ============================================================
export default function BaharHarbPage() {
  const hydrated = useHydrated();
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const dispatch = useCallback((action: Partial<GameState>) => {
    setState((prev) => ({ ...prev, ...action }));
  }, []);

  const startGame = useCallback(
    (team1: string, team2: string, mode: 'teams' | 'individuals', count: number) => {
      const questions = selectRandomQuestions(count);
      setState({
        ...INITIAL_STATE,
        phase: 'playing',
        mode: 'godfather',
        team1Name: team1,
        team2Name: team2,
        playMode: mode,
        totalQuestions: count,
        questions,
      });
    },
    []
  );

  const resetToLanding = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const goHome = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return (
    <SubscriptionGuard gameSlug="baharharb">
      {!hydrated && (
        <div className="min-h-screen flex flex-col items-center justify-center baharharb-bg">
          <div className="text-center flex-1 flex items-center justify-center">
            <div>
              <div className="text-5xl mb-4">🌊⚔️</div>
              <p className="text-slate-400">جاري التحميل...</p>
            </div>
          </div>
          <BrandedFooter />
        </div>
      )}

      {hydrated && state.phase === 'landing' && (
        <div className="min-h-screen flex flex-col baharharb-bg">
          <BrandedHeader title="بحر و حرب" />
          <main className="flex-1">
            <LandingPage onStart={() => dispatch({ mode: 'godfather', phase: 'settings' })} />
          </main>
          <BrandedFooter />
        </div>
      )}

      {hydrated && state.phase === 'settings' && (
        <div className="min-h-screen flex flex-col baharharb-bg">
          <BrandedHeader title="بحر و حرب" />
          <main className="flex-1">
            <SettingsPage onStart={startGame} onBack={resetToLanding} />
          </main>
          <BrandedFooter />
        </div>
      )}

      {hydrated && state.phase === 'playing' && (
        <div className="min-h-screen flex flex-col baharharb-bg">
          <GameTopBar title={`سؤال ${state.currentQuestionIndex + 1}`} onHome={goHome} />
          <main className="flex-1 flex flex-col">
            <GameBoard
              state={state}
              dispatch={dispatch}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
            />
          </main>
        </div>
      )}

      {hydrated && state.phase === 'gameOver' && (
        <div className="min-h-screen flex flex-col baharharb-bg">
          <GameTopBar title="انتهت اللعبة" onHome={goHome} />
          <main className="flex-1">
            <GameOverPage state={state} onPlayAgain={resetToLanding} onHome={goHome} />
          </main>
          <BrandedFooter />
        </div>
      )}
    </SubscriptionGuard>
  );
}
