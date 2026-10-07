'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface GameWalkthroughProps {
  open: boolean;
  onClose: () => void;
}

// ============================================================
// WALKTHROUGH STEPS DATA
// ============================================================

const WALKTHROUGH_STEPS = [
  {
    id: 1,
    title: 'هذه هي اللوحة',
    subtitle: '25 بطاقة مخفية',
    description: 'اللعبة تبدأ بلوحة 25 بطاقة، كل بطاقة عليها كلمة عربية. الفريقان لا يعرفان ما وراء كل بطاقة.',
    emoji: '🃏',
    type: 'board-hidden' as const,
  },
  {
    id: 2,
    title: 'الجاسوس يرى الألوان',
    subtitle: 'فقط الجاسوس يعرف السر!',
    description: 'كل فريق عنده جاسوس واحد فقط — هو الوحيد اللي يشوف الألوان المخفية: أحمر، أزرق، محايدة، والقاتل 💀',
    emoji: '👁️',
    type: 'board-revealed' as const,
  },
  {
    id: 3,
    title: 'الجاسوس يعطي دليل',
    subtitle: 'كلمة واحدة + رقم',
    description: 'الجاسوس يفكر في كلمة تربط أكبر عدد من كلمات فريقه ويعطيها مع رقم (مثلاً: "حيوان — 2").',
    emoji: '💬',
    type: 'clue-given' as const,
  },
  {
    id: 4,
    title: 'الفريق يخمن الكلمات',
    subtitle: 'من عند الرقم + 1',
    description: 'الفريق يناقش ويختار الكلمات اللي يظن أنها مرتبطة بالدليل. يمكنهم التخمين (الرقم + 1) مرة كحد أقصى.',
    emoji: '🎯',
    type: 'guessing' as const,
  },
  {
    id: 5,
    title: 'صحيح؟ خطأ؟',
    subtitle: 'النتيجة تحدد المصير',
    description: 'إذا التخمين صحيح → استمروا! إذا خطأ أو محايدة → انتهى الدور. وإذا كشفتم القاتل 💀 → خسارة فورية!',
    emoji: '✅❌',
    type: 'result' as const,
  },
];

// ============================================================
// MINI BOARD COMPONENTS FOR WALKTHROUGH
// ============================================================

const BOARD_COLORS: ('red' | 'blue' | 'neutral' | 'assassin')[] = [
  'red', 'neutral', 'blue', 'red', 'neutral',
  'blue', 'red', 'neutral', 'assassin', 'blue',
  'neutral', 'blue', 'red', 'neutral', 'red',
  'red', 'neutral', 'blue', 'neutral', 'blue',
  'neutral', 'red', 'neutral', 'blue', 'red',
];

const BOARD_WORDS = [
  'أسد', 'نجم', 'محيط', 'خيل', 'برتقال',
  'مسجد', 'سيف', 'ثلج', 'قاتل', 'صحراء',
  'قمر', 'ورد', 'جمل', 'ريح', 'نار',
  'شمس', 'واحة', 'جسر', 'سماء', 'نهر',
  'حديقة', 'برج', 'كتاب', 'درع', 'تاج',
];

function WalkthroughBoard({ showColors, highlightCards, phase }: {
  showColors: boolean;
  highlightCards?: number[];
  phase: string;
}) {
  return (
    <div className="flex justify-center mb-4">
      <div className="grid grid-cols-5 gap-[3px] w-full max-w-[200px] sm:max-w-[240px]">
        {BOARD_COLORS.map((color, i) => {
          const isHighlighted = highlightCards?.includes(i);
          const isAssassin = color === 'assassin' && showColors;

          let bgColor = 'bg-slate-700/80';
          if (showColors) {
            if (color === 'red') bgColor = 'bg-red-500/70';
            else if (color === 'blue') bgColor = 'bg-blue-500/70';
            else if (color === 'assassin') bgColor = 'bg-gray-800';
            else bgColor = 'bg-slate-600/50';
          }

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: 1,
                scale: isHighlighted ? 1.1 : 1,
              }}
              transition={{ delay: i * 0.02, duration: 0.25 }}
              className={`aspect-square rounded-[3px] sm:rounded-md border flex flex-col items-center justify-center relative transition-all duration-300 ${
                isHighlighted
                  ? 'border-amber-400 shadow-lg shadow-amber-400/30'
                  : 'border-white/10'
              } ${bgColor}`}
            >
              <span className="text-[5px] sm:text-[7px] font-bold text-white/90 text-center leading-tight px-[1px]">
                {showColors ? BOARD_WORDS[i] : '؟'}
              </span>
              {isHighlighted && !showColors && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-amber-500 border border-amber-400 flex items-center justify-center"
                >
                  <span className="text-[6px] sm:text-[8px] text-white font-bold">✓</span>
                </motion.div>
              )}
              {isAssassin && (
                <span className="absolute -top-0.5 -left-0.5 text-[6px] sm:text-[8px]">💀</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// CLUE EXAMPLE COMPONENT
// ============================================================

function ClueExample() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-center"
    >
      <p className="text-[9px] sm:text-[10px] text-purple-300 mb-2 font-bold">
        🗣️ دليل الجاسوس
      </p>
      <div className="flex items-center justify-center gap-3">
        <motion.span
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl sm:text-2xl font-black text-white"
        >
          حيوان
        </motion.span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-2xl sm:text-3xl font-black text-slate-500"
        >
          —
        </motion.span>
        <motion.span
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="text-xl sm:text-2xl font-black text-emerald-400"
        >
          2
        </motion.span>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-[8px] sm:text-[9px] text-slate-400 mt-2"
      >
        يعني: هناك 2 كلمة من كلمات فريقنا مرتبطة بكلمة "حيوان"
      </motion.p>
    </motion.div>
  );
}

// ============================================================
// RESULT EXAMPLE COMPONENT
// ============================================================

function ResultExample() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 space-y-2"
    >
      {/* Correct */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30"
      >
        <span className="text-lg">✅</span>
        <div className="flex-1">
          <p className="text-[10px] sm:text-xs font-bold text-emerald-300">صحيح!</p>
          <p className="text-[8px] sm:text-[9px] text-slate-400">كلمة من فريقك — استمروا بالتخمين</p>
        </div>
      </motion.div>

      {/* Wrong */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/30 border border-red-500/30"
      >
        <span className="text-lg">❌</span>
        <div className="flex-1">
          <p className="text-[10px] sm:text-xs font-bold text-red-300">خطأ!</p>
          <p className="text-[8px] sm:text-[9px] text-slate-400">كلمة الخصم أو محايدة — انتهى الدور</p>
        </div>
      </motion.div>

      {/* Assassin */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-950/50 border border-gray-500/30"
      >
        <span className="text-lg">💀</span>
        <div className="flex-1">
          <p className="text-[10px] sm:text-xs font-bold text-gray-300">القاتل!</p>
          <p className="text-[8px] sm:text-[9px] text-slate-400">خسارة فورية — انتهت اللعبة!</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// MAIN GAMEWALKTHROUGH COMPONENT
// ============================================================

export default function GameWalkthrough({ open, onClose }: GameWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = WALKTHROUGH_STEPS.length;
  const step = WALKTHROUGH_STEPS[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  // Reset step when opened
  useEffect(() => {
    if (open) queueMicrotask(() => setCurrentStep(0));
  }, [open]);

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!open) return null;

  const renderStepContent = () => {
    switch (step.type) {
      case 'board-hidden':
        return (
          <WalkthroughBoard
            showColors={false}
            highlightCards={undefined}
            phase="hidden"
          />
        );
      case 'board-revealed':
        return (
          <>
            <WalkthroughBoard
              showColors={true}
              highlightCards={undefined}
              phase="revealed"
            />
            {/* Legend */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-red-500/70" />
                <span className="text-[8px] sm:text-[9px] text-red-300">أحمر (9)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-blue-500/70" />
                <span className="text-[8px] sm:text-[9px] text-blue-300">أزرق (8)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-slate-600/50" />
                <span className="text-[8px] sm:text-[9px] text-slate-400">محايدة (7)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-gray-800" />
                <span className="text-[8px] sm:text-[9px] text-gray-400">💀</span>
              </div>
            </div>
          </>
        );
      case 'clue-given':
        return (
          <>
            <WalkthroughBoard
              showColors={true}
              highlightCards={[0, 12]}
              phase="clue"
            />
            <ClueExample />
          </>
        );
      case 'guessing':
        return (
          <>
            <WalkthroughBoard
              showColors={false}
              highlightCards={[0, 12]}
              phase="guessing"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center p-3 rounded-xl bg-slate-800/40 border border-slate-700/30"
            >
              <p className="text-[9px] sm:text-[10px] text-slate-400 leading-relaxed">
                🤔 الفريق يناقش: <span className="text-amber-300 font-bold">&quot;حيوان — 2&quot;</span><br />
                يختارون: <span className="text-emerald-300 font-bold">أسد ✓</span> و <span className="text-emerald-300 font-bold">جمل ✓</span> ؟
              </p>
            </motion.div>
          </>
        );
      case 'result':
        return <ResultExample />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl max-h-[90vh] overflow-y-auto relative"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 left-3 w-7 h-7 rounded-full bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Header */}
          <div className="text-center mb-4">
            <div className="text-3xl sm:text-4xl mb-2">{step.emoji}</div>
            <h2 className="text-base sm:text-lg font-black text-white mb-0.5">
              {step.title}
            </h2>
            <p className="text-[10px] sm:text-xs text-emerald-400 font-bold">
              {step.subtitle}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {WALKTHROUGH_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? 'w-8 bg-emerald-500'
                    : i < currentStep
                    ? 'w-4 bg-emerald-500/40'
                    : 'w-4 bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Description */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-xs sm:text-sm text-slate-300 text-center leading-relaxed mb-4 px-2">
              {step.description}
            </p>

            {/* Step-specific content */}
            {renderStepContent()}
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4 gap-3">
            <Button
              onClick={prevStep}
              disabled={isFirstStep}
              variant="ghost"
              className="text-slate-400 hover:text-slate-200 gap-1 h-10 px-3 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
              السابق
            </Button>

            <div className="text-[9px] text-slate-500 font-bold">
              {currentStep + 1} / {totalSteps}
            </div>

            {isLastStep ? (
              <Button
                onClick={handleClose}
                className="font-bold text-sm px-5 h-10 text-white gap-1"
                style={{
                  background: 'linear-gradient(to left, #059669, #10b981)',
                  borderRadius: '0.5rem',
                }}
              >
                فهمت! 🎮
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                className="font-bold text-sm px-5 h-10 text-white gap-1"
                style={{
                  background: 'linear-gradient(to left, #059669, #10b981)',
                  borderRadius: '0.5rem',
                }}
              >
                التالي
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Skip button */}
          {!isLastStep && (
            <div className="text-center mt-3">
              <button
                onClick={handleClose}
                className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
              >
                تخطي الشرح
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
