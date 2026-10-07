'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, Flame, Trophy } from 'lucide-react';

interface GameIntroCardProps {
  show: boolean;
  onDismiss: () => void;
  gameMode?: 'godfather' | 'diwaniya' | null;
}

export default function GameIntroCard({ show, onDismiss, gameMode }: GameIntroCardProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4"
          dir="rtl"
        >
          {/* Decorative particles */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: Math.random() * 4 + 2 + 'px',
                  height: Math.random() * 4 + 2 + 'px',
                  top: Math.random() * 100 + '%',
                  left: Math.random() * 100 + '%',
                  background: ['#fbbf24', '#f87171', '#818cf8', '#34d399', '#c084fc'][Math.floor(Math.random() * 5)],
                }}
                animate={{
                  y: [0, -(Math.random() * 40 + 20)],
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.2, 0.8],
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
            initial={{ scale: 0.6, opacity: 0, rotateY: -15 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 30 }}
            transition={{ duration: 0.7, type: 'spring', bounce: 0.3 }}
            className="relative w-full max-w-sm sm:max-w-md mx-auto"
          >
            {/* Glow effect behind card */}
            <div className="absolute -inset-4 bg-gradient-to-br from-yellow-500/20 via-red-500/20 to-purple-500/20 rounded-3xl blur-xl" />

            {/* Main card */}
            <div className="relative bg-gradient-to-bl from-slate-900 via-slate-900 to-slate-950 border-2 border-yellow-500/40 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-yellow-900/20">
              {/* Top decorative bar */}
              <div className="h-1.5 bg-gradient-to-l from-yellow-400 via-red-500 via-purple-500 to-indigo-500" />

              {/* Content */}
              <div className="p-6 sm:p-8">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: 'spring', bounce: 0.5 }}
                  className="text-center mb-4 sm:mb-5"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-yellow-500/20 to-red-600/20 border border-yellow-500/30">
                    <span className="text-5xl sm:text-6xl">🕵️</span>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-2xl sm:text-3xl font-black text-center mb-3"
                >
                  <span className="bg-gradient-to-r from-yellow-300 via-red-400 to-purple-400 bg-clip-text text-transparent">
                    🔥 المافيا تبدأ الآن! 🔥
                  </span>
                </motion.h2>

                {/* Enthusiastic message */}
                <motion.div
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-center mb-5 sm:mb-6 space-y-2.5"
                >
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-bold">
                    استعدوا للمغامرة الأكثر إثارة! 🎭
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {gameMode === 'diwaniya'
                      ? '🏠 الديوانية مستعدة لاستقبالكم... من يكشف المافيا ومن يسقط فريستها؟'
                      : '🕴️ العراب ينتظركم... عيونكم مفتوحة وقلوبكم يقظة!'}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    >
                      <Flame className="w-5 h-5 text-orange-400" />
                    </motion.div>
                    <p className="text-yellow-400 text-xs sm:text-sm font-black italic">
                      "اللي بيخاف يموت واقف... والشجاع يموت مجروح!"
                    </p>
                    <motion.div
                      animate={{ rotate: [0, -15, 15, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    >
                      <Flame className="w-5 h-5 text-orange-400" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Decorative divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.9 }}
                  className="flex items-center gap-2 mb-5 sm:mb-6"
                >
                  <div className="flex-1 h-px bg-gradient-to-l from-yellow-500/60 to-transparent" />
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/60 to-transparent" />
                </motion.div>

                {/* Start button */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  <Button
                    onClick={onDismiss}
                    className="w-full bg-gradient-to-l from-yellow-600 via-amber-600 to-red-700 hover:from-yellow-500 hover:via-amber-500 hover:to-red-600 text-white font-black text-lg sm:text-xl py-6 sm:py-7 shadow-lg shadow-yellow-900/30 transition-all duration-300 pulse-glow-gold rounded-xl"
                  >
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 ml-2" />
                    ابدأ اللعبة
                  </Button>
                </motion.div>

                {/* Credits */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3 }}
                  className="mt-5 sm:mt-6 pt-4 border-t border-slate-700/50"
                >
                  <div className="text-center space-y-1.5">
                    <p className="text-[10px] sm:text-xs text-slate-500 font-bold">
                      برمجة
                    </p>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-xs sm:text-sm">💻</span>
                      <span className="text-xs sm:text-sm font-black bg-gradient-to-l from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                        الغريب
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      <span className="text-xs sm:text-sm">🏠</span>
                      <span className="text-[10px] sm:text-xs text-slate-500 font-bold">
                        برعاية
                      </span>
                      <span className="text-xs sm:text-sm font-black bg-gradient-to-l from-blue-400 via-purple-400 to-indigo-500 bg-clip-text text-transparent">
                        ANA VIP 100034
                      </span>
                    </div>
                    <motion.p
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="text-[10px] sm:text-xs text-yellow-500/70 font-bold mt-2"
                    >
                      يحيوكم ❤️
                    </motion.p>
                  </div>
                </motion.div>
              </div>

              {/* Bottom decorative bar */}
              <div className="h-1.5 bg-gradient-to-l from-indigo-500 via-purple-500 via-red-500 to-yellow-400" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
