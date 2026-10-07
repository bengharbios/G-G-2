'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Globe, Play, HelpCircle, ChevronLeft, ChevronRight, Eye, MessageCircle, CheckCircle, XCircle, Skull } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import HowToPlay from './HowToPlay';
import GameWalkthrough from './GameWalkthrough';

interface LandingPageProps {
  onSelectMode: (mode: 'godfather' | 'diwaniya') => void;
  onQuickStart?: () => void;
}

// ============================================================
// MINI BOARD PREVIEW — shows a small 5x5 grid with colored cards
// ============================================================

const MINI_BOARD_COLORS: ('red' | 'blue' | 'neutral' | 'assassin')[] = [
  'red', 'neutral', 'blue', 'red', 'neutral',
  'blue', 'red', 'neutral', 'assassin', 'blue',
  'neutral', 'blue', 'red', 'neutral', 'red',
  'red', 'neutral', 'blue', 'neutral', 'blue',
  'neutral', 'red', 'neutral', 'blue', 'red',
];

const MINI_WORDS = [
  'شمس', 'قمر', 'بحر', 'جبل', 'نهر',
  'سماء', 'تراب', 'هواء', 'ماء', 'رمل',
  'ورد', 'شجر', 'ثلج', 'غيوم', 'ريح',
  'صحراء', 'واحة', 'كهف', 'جسر', 'طريق',
  'حديقة', 'برج', 'سيف', 'درع', 'تاج',
];

function MiniBoardPreview({ showColors }: { showColors: boolean }) {
  return (
    <div className="grid grid-cols-5 gap-[3px] sm:gap-1">
      {MINI_BOARD_COLORS.map((color, i) => {
        const bgColor = showColors
          ? color === 'red'
            ? 'bg-red-500/70'
            : color === 'blue'
              ? 'bg-blue-500/70'
              : color === 'assassin'
                ? 'bg-gray-800'
                : 'bg-slate-600/50'
          : 'bg-slate-700/80';

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.025, duration: 0.3 }}
            className={`aspect-square rounded-[3px] sm:rounded-md border border-white/10 flex items-center justify-center ${bgColor} transition-all duration-500`}
          >
            <span className="text-[5px] sm:text-[7px] md:text-[8px] font-bold text-white/90 text-center leading-tight px-[1px]">
              {showColors ? MINI_WORDS[i] : '؟'}
            </span>
            {showColors && color === 'assassin' && (
              <span className="absolute text-[5px] sm:text-[7px]">💀</span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================================
// STEP INDICATOR — simple numbered game flow
// ============================================================

function GameStepsPreview() {
  const steps = [
    { num: 1, text: 'الجاسوس يرى الألوان', emoji: '👁️' },
    { num: 2, text: 'يعطي دليل: كلمة + رقم', emoji: '💬' },
    { num: 3, text: 'الفريق يخمن الكلمات', emoji: '🎯' },
    { num: 4, text: 'اكشف كل كلماتك أولاً!', emoji: '🏆' },
  ];

  return (
    <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <span className="text-xs sm:text-sm">{step.emoji}</span>
            <div>
              <span className="text-[8px] sm:text-[9px] text-emerald-400 font-bold">{step.num}</span>
              <p className="text-[7px] sm:text-[8px] text-slate-400 leading-tight">{step.text}</p>
            </div>
          </div>
          {i < steps.length - 1 && (
            <ChevronLeft className="w-3 h-3 text-slate-600 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MAIN LANDING PAGE
// ============================================================

export default function LandingPage({ onSelectMode, onQuickStart }: LandingPageProps) {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [boardRevealed, setBoardRevealed] = useState(false);

  // Check if walkthrough was already seen
  useEffect(() => {
    const seen = localStorage.getItem('shifarat-walkthrough-seen');
    if (!seen) {
      // Show walkthrough on first visit after a short delay
      const timer = setTimeout(() => setShowWalkthrough(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Toggle board colors animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBoardRevealed((prev) => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6"
      dir="rtl"
      style={{
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
      }}
    >
      {/* Decorative dots */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              backgroundColor: `rgba(16, 185, 129, ${Math.random() * 0.3 + 0.1})`,
              animation: `pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-5 sm:mb-7">
          <motion.div
            initial={{ scale: 0.3 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-5xl sm:text-6xl mb-2"
          >
            🎯
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-2xl sm:text-3xl font-black mb-1.5"
            style={{
              background: 'linear-gradient(to left, #34d399, #10b981, #6ee7b7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            لعبة الشيفرات
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-slate-400 text-xs sm:text-sm"
          >
            لمّح بكلمة واحدة فقط! 🧠
          </motion.p>
        </div>

        {/* ─── HOW TO PLAY BUTTON (prominent) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="mb-4"
        >
          <Button
            onClick={() => setShowHowToPlay(true)}
            variant="outline"
            className="w-full py-3 sm:py-3.5 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/30 hover:text-emerald-200 hover:border-emerald-500/60 gap-2 text-sm font-bold transition-all"
            style={{ borderRadius: '0.75rem' }}
          >
            <HelpCircle className="w-5 h-5" />
            كيف تلعب؟ — شرح القواعد بالتفصيل
          </Button>
        </motion.div>

        {/* ─── QUICK START BUTTON ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="mb-5 sm:mb-7"
        >
          <Button
            onClick={() => onQuickStart ? onQuickStart() : onSelectMode('godfather')}
            className="w-full py-4 text-white font-bold text-base sm:text-lg gap-2 transition-all duration-300"
            style={{
              background: 'linear-gradient(to left, #059669, #10b981)',
              borderRadius: '0.75rem',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
            }}
          >
            <Play className="w-5 h-5" />
            ابدأ سريعًا ⚡
          </Button>
        </motion.div>

        {/* ─── GAME EXPLANATION SECTION ─── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mb-5 sm:mb-7 p-3 sm:p-4 rounded-2xl border border-slate-700/40"
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          {/* Game steps flow */}
          <div className="mb-3">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 mb-2 text-center">
              🎮 سير اللعبة
            </p>
            <GameStepsPreview />
          </div>

          {/* Mini board preview */}
          <div className="flex items-center justify-center gap-3">
            <div className="w-full max-w-[180px] sm:max-w-[220px]">
              <MiniBoardPreview showColors={boardRevealed} />
            </div>
            <div className="text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={boardRevealed ? 'spymaster' : 'team'}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <Badge className={`text-[9px] sm:text-[10px] px-2 py-0.5 mb-1 ${
                    boardRevealed
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'bg-slate-700/50 text-slate-400 border-slate-600/30'
                  }`}>
                    {boardRevealed ? '👁️ رؤية الجاسوس' : '🔀 وجهة الفريق'}
                  </Badge>
                  <p className="text-[8px] sm:text-[9px] text-slate-500 leading-relaxed">
                    {boardRevealed
                      ? 'الجاسوس يرى الألوان المخفية'
                      : 'الفريق يرى الكلمات فقط'}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Legend */}
              <div className="mt-2 space-y-0.5">
                <div className="flex items-center gap-1.5 justify-center">
                  <div className="w-2.5 h-2.5 rounded-sm bg-red-500/70" />
                  <span className="text-[7px] sm:text-[8px] text-red-300">أحمر (9)</span>
                </div>
                <div className="flex items-center gap-1.5 justify-center">
                  <div className="w-2.5 h-2.5 rounded-sm bg-blue-500/70" />
                  <span className="text-[7px] sm:text-[8px] text-blue-300">أزرق (8)</span>
                </div>
                <div className="flex items-center gap-1.5 justify-center">
                  <div className="w-2.5 h-2.5 rounded-sm bg-slate-600/50" />
                  <span className="text-[7px] sm:text-[8px] text-slate-400">محايدة (7)</span>
                </div>
                <div className="flex items-center gap-1.5 justify-center">
                  <div className="w-2.5 h-2.5 rounded-sm bg-gray-800" />
                  <span className="text-[7px] sm:text-[8px] text-gray-400">💀 القاتل</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── MODE SELECTION CARDS ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Godfather Mode */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectMode('godfather')}
            className="cursor-pointer rounded-2xl p-4 sm:p-5 border-2 border-emerald-500/20 transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.3) 0%, rgba(15, 23, 42, 0.8) 100%)',
            }}
          >
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-3 mx-auto"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <span className="text-2xl sm:text-3xl">🎯</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-emerald-300 text-center mb-1.5">
              العب مع أصحابك
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-400 text-center leading-relaxed mb-3">
              العب على جهاز واحد — مرر الجهاز بين الفرق
            </p>
            {/* Numbered steps */}
            <div className="space-y-1.5 text-right">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold flex items-center justify-center mt-0.5">1</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400">سجّل أسماء الفريقين والجاسوسين</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold flex items-center justify-center mt-0.5">2</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400">الجاسوس يرى اللوحة ويعطي الدليل</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold flex items-center justify-center mt-0.5">3</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400">مرر الجهاز للفريق ليخمن</span>
              </div>
            </div>
            <div className="mt-3 text-center">
              <span className="text-[9px] text-emerald-500/60 font-bold px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5">
                وضع العراب
              </span>
            </div>
          </motion.div>

          {/* Diwaniya Mode */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectMode('diwaniya')}
            className="cursor-pointer rounded-2xl p-4 sm:p-5 border-2 border-emerald-500/20 transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.2) 0%, rgba(15, 23, 42, 0.8) 100%)',
            }}
          >
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-3 mx-auto"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <span className="text-2xl sm:text-3xl">🌐</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-emerald-300 text-center mb-1.5">
              الاعب أونلاين
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-400 text-center leading-relaxed mb-3">
              أنشئ غرفة وادعُ أصدقائك للعب من أجهزتهم
            </p>
            {/* Numbered steps */}
            <div className="space-y-1.5 text-right">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold flex items-center justify-center mt-0.5">1</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400">أنشئ غرفة وشارك الكود</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold flex items-center justify-center mt-0.5">2</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400">انضم الأصدقاء واختر الفرق</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold flex items-center justify-center mt-0.5">3</span>
                <span className="text-[9px] sm:text-[10px] text-slate-400">كل واحد يلعب من جهازه!</span>
              </div>
            </div>
            <div className="mt-3 text-center">
              <span className="text-[9px] text-emerald-500/60 font-bold px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5">
                وضع الديوانية
              </span>
            </div>
          </motion.div>
        </div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center text-[10px] text-slate-600 mt-6 sm:mt-8"
        >
          اختر طريقة اللعب للبدء
        </motion.p>
      </motion.div>

      {/* How to Play Modal */}
      <HowToPlay open={showHowToPlay} onOpenChange={setShowHowToPlay} />

      {/* First-time Walkthrough */}
      <GameWalkthrough
        open={showWalkthrough}
        onClose={() => {
          setShowWalkthrough(false);
          localStorage.setItem('shifarat-walkthrough-seen', 'true');
        }}
      />
    </div>
  );
}
