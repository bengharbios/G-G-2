'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Users,
  MessageCircle,
  Hash,
  Skull,
  Shield,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HowToPlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS = [
  {
    icon: <Users className="w-6 h-6 text-red-400" />,
    title: 'فريقان',
    description: 'اللعبة بين فريقين: الأحمر والأزرق. كل فريق يتكون من جاسوس واحد (يرى الألوان) وبقية الأعضاء.',
    color: 'bg-red-950/30 border-red-500/20',
  },
  {
    icon: <Eye className="w-6 h-6 text-purple-400" />,
    title: 'الجاسوس (Spymaster)',
    description: 'الجاسوس هو الوحيد الذي يرى اللوحة الملونة. دوره إعطاء أدلة بكلمة واحدة + رقم للفريق.',
    color: 'bg-purple-950/30 border-purple-500/20',
  },
  {
    icon: <MessageCircle className="w-6 h-6 text-emerald-400" />,
    title: 'الدليل (Clue)',
    description: 'الجاسوس يعطي دليل = كلمة واحدة + رقم (من 1 إلى 9). الرقم يشير لعدد الكلمات المرتبطة بالدليل.',
    color: 'bg-emerald-950/30 border-emerald-500/20',
  },
  {
    icon: <Hash className="w-6 h-6 text-blue-400" />,
    title: 'التخمين',
    description: 'الفريق يخمن الكلمات على اللوحة بناءً على الدليل. يمكنهم التخمين (رقم + 1) مرة كحد أقصى.',
    color: 'bg-blue-950/30 border-blue-500/20',
  },
  {
    icon: <Check className="w-6 h-6 text-green-400" />,
    title: 'إذا صح ✅',
    description: 'إذا التخمين صحيح (كلمة من كلمات الفريق)، يمكن للفريق الاستمرار بالتخمين حتى ينفذ العدد.',
    color: 'bg-green-950/30 border-green-500/20',
  },
  {
    icon: <Shield className="w-6 h-6 text-slate-400" />,
    title: 'إذا خطأ ❌',
    description: 'إذا التخمين لكلمة الخصم أو كلمة محايدة، ينتهي دور الفريق فوراً وينتقل الدور للخصم.',
    color: 'bg-slate-900/30 border-slate-700/30',
  },
  {
    icon: <Skull className="w-6 h-6 text-gray-400" />,
    title: 'القاتل 💀',
    description: 'إذا اختار الفريق بطاقة القاتل بالخطأ، يخسر الفريق فوراً! انتبهوا!',
    color: 'bg-gray-950/30 border-gray-600/30',
  },
  {
    icon: <span className="text-2xl">🏆</span>,
    title: 'الفوز',
    description: 'الفريق الذي يكشف جميع كلماته أولاً يفوز! الفريق الأول (الأحمر) يحتاج 9 كلمات، والثاني يحتاج 8.',
    color: 'bg-amber-950/30 border-amber-500/20',
  },
];

export default function HowToPlay({ open, onOpenChange }: HowToPlayProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onOpenChange(false);
  };

  if (!open) return null;

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="text-center mb-5">
            <h2 className="text-xl font-black text-emerald-400 mb-1">كيف تلعب؟</h2>
            <p className="text-xs text-slate-400">قواعد لعبة الشيفرات (Codenames)</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? 'w-6 bg-emerald-500'
                    : i < currentStep
                    ? 'w-3 bg-emerald-500/50'
                    : 'w-3 bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Card Types Info */}
          <div className="mb-5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <p className="text-[10px] font-bold text-slate-400 mb-2">أنواع البطاقات على اللوحة:</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500/80" />
                <span className="text-[10px] text-red-300">أحمر (9)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500/80" />
                <span className="text-[10px] text-blue-300">أزرق (8)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-600/60" />
                <span className="text-[10px] text-slate-400">محايدة (7)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-900 flex items-center justify-center text-[8px]">💀</div>
                <span className="text-[10px] text-gray-400">القاتل (1)</span>
              </div>
            </div>
          </div>

          {/* Current Step */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className={`p-5 rounded-xl border ${step.color} mb-5`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800/60 flex items-center justify-center">
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{step.title}</h3>
                  <span className="text-[10px] text-slate-500">{currentStep + 1}/{STEPS.length}</span>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{step.description}</p>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              onClick={prevStep}
              disabled={currentStep === 0}
              variant="ghost"
              className="text-slate-400 hover:text-slate-200 gap-1 h-10 px-3 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
              السابق
            </Button>

            {isLastStep ? (
              <Button
                onClick={handleClose}
                className="font-bold text-sm px-6 h-10 text-white"
                style={{
                  background: 'linear-gradient(to left, #059669, #10b981)',
                  borderRadius: '0.5rem',
                }}
              >
                فهمت! ✅
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                className="font-bold text-sm px-6 h-10 text-white"
                style={{
                  background: 'linear-gradient(to left, #059669, #10b981)',
                  borderRadius: '0.5rem',
                }}
              >
                التالي
                <ChevronLeft className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
