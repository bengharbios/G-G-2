'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, Flame, Gamepad2 } from 'lucide-react';

interface WelcomePopupProps {
  show: boolean;
  onDismiss: () => void;
}

export default function WelcomePopup({ show, onDismiss }: WelcomePopupProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 p-4"
          dir="rtl"
        >
          {/* Animated background particles */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: Math.random() * 4 + 2 + 'px',
                  height: Math.random() * 4 + 2 + 'px',
                  top: Math.random() * 100 + '%',
                  left: Math.random() * 100 + '%',
                  background: ['#fbbf24', '#f87171', '#818cf8', '#34d399', '#c084fc', '#fb923c'][Math.floor(Math.random() * 6)],
                }}
                animate={{
                  y: [0, -(Math.random() * 50 + 20)],
                  opacity: [0.2, 1, 0.2],
                  scale: [0.7, 1.3, 0.7],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.7, type: 'spring', bounce: 0.4 }}
            className="relative w-full max-w-sm sm:max-w-md mx-auto"
          >
            {/* Glow behind card */}
            <div className="absolute -inset-6 bg-gradient-to-br from-yellow-500/15 via-red-500/15 to-purple-500/15 rounded-[2rem] blur-2xl" />

            {/* Main card */}
            <div className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-yellow-500/40 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
              {/* Top gradient bar */}
              <div className="h-1.5 bg-gradient-to-l from-yellow-400 via-red-500 via-purple-500 to-indigo-500" />

              {/* Content */}
              <div className="p-6 sm:p-8">

                {/* Logo icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', bounce: 0.6 }}
                  className="text-center mb-4 sm:mb-5"
                >
                  <div className="inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-yellow-500/20 via-red-600/20 to-purple-600/20 border-2 border-yellow-500/30 shadow-lg shadow-yellow-500/10">
                    <span className="text-6xl sm:text-7xl">🕵️</span>
                  </div>
                </motion.div>

                {/* Main title */}
                <motion.h1
                  initial={{ y: 25, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl sm:text-4xl font-black text-center mb-3 leading-tight"
                >
                  <span className="bg-gradient-to-r from-yellow-300 via-red-400 to-purple-400 bg-clip-text text-transparent">
                    لعبة المافيا
                  </span>
                </motion.h1>

                {/* Enthusiastic welcome */}
                <motion.div
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-center mb-4 sm:mb-5 space-y-3"
                >
                  <p className="text-base sm:text-lg text-slate-100 leading-relaxed font-bold">
                    مرحباً بكم في عالم المافيا! 🔥
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    استعدوا لأقوى لعبة ذكاء وتكتيك! اكتشفوا المافيا قبل أن يكتشفكم... أو كونوا المافيا وسيطروا على المدينة! 🎭
                  </p>

                  {/* Motivational quote with fire */}
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 0.8 }}
                    >
                      <Flame className="w-5 h-5 text-orange-400" />
                    </motion.div>
                    <p className="text-yellow-400 text-xs sm:text-sm font-black italic">
                      "من يخاف لا ينتصر... ومن ينتصر لا يخاف!"
                    </p>
                    <motion.div
                      animate={{ rotate: [0, -15, 15, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 0.8 }}
                    >
                      <Flame className="w-5 h-5 text-orange-400" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center gap-2 mb-5 sm:mb-6"
                >
                  <div className="flex-1 h-px bg-gradient-to-l from-yellow-500/60 to-transparent" />
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/60 to-transparent" />
                </motion.div>

                {/* CTA button */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  <Button
                    onClick={onDismiss}
                    className="w-full bg-gradient-to-l from-yellow-600 via-amber-600 to-red-700 hover:from-yellow-500 hover:via-amber-500 hover:to-red-600 text-white font-black text-lg sm:text-xl py-6 sm:py-7 shadow-lg shadow-yellow-900/30 transition-all duration-300 pulse-glow-gold rounded-xl"
                  >
                    <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 ml-2" />
                    يلا نبدأ!
                  </Button>
                </motion.div>

                {/* Credits section */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="mt-5 sm:mt-6 pt-4 border-t border-slate-700/50"
                >
                  <div className="text-center space-y-2">
                    <p className="text-[10px] sm:text-xs text-slate-500 font-bold tracking-wide">
                      برمجة
                    </p>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-sm sm:text-base">💻</span>
                      <span className="text-sm sm:text-base font-black bg-gradient-to-l from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                        الغريب
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <span className="text-sm sm:text-base">🏠</span>
                      <span className="text-[10px] sm:text-xs text-slate-500 font-bold">
                        برعاية
                      </span>
                      <span className="text-sm sm:text-base font-black bg-gradient-to-l from-blue-400 via-purple-400 to-indigo-500 bg-clip-text text-transparent">
                        ANA VIP 100034
                      </span>
                    </div>

                    <motion.p
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="text-[11px] sm:text-xs text-yellow-500/80 font-bold mt-3"
                    >
                      يحيوكم ❤️
                    </motion.p>
                  </div>
                </motion.div>
              </div>

              {/* Bottom gradient bar */}
              <div className="h-1.5 bg-gradient-to-l from-indigo-500 via-purple-500 via-red-500 to-yellow-400" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
