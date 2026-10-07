'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Info, ChevronDown } from 'lucide-react';
import { OUTCOME_CONFIG, DOOR_DISTRIBUTION, DoorOutcome } from '@/lib/tabot-types';

interface TabotLandingProps {
  onStart: () => void;
}

const FLOATING_EMOJIS = ['🪦', '⚰️', '👻', '🦇', '🕷️', '💀', '🌙', '🕯️'];

// Count each outcome for the rules card
function countOutcomes() {
  const counts: Record<DoorOutcome, number> = {} as Record<DoorOutcome, number>;
  DOOR_DISTRIBUTION.forEach((o) => {
    counts[o] = (counts[o] || 0) + 1;
  });
  return counts;
}

export default function TabotLanding({ onStart }: TabotLandingProps) {
  const [showRules, setShowRules] = useState(false);
  const [showOutcomes, setShowOutcomes] = useState(false);

  const outcomeCounts = useMemo(() => countOutcomes(), []);
  const floatingEmojis = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        emoji: FLOATING_EMOJIS[i % FLOATING_EMOJIS.length],
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 10 + Math.random() * 16,
        delay: Math.random() * 5,
        duration: 2 + Math.random() * 4,
      })),
    []
  );

  return (
    <div className="relative min-h-screen flex flex-col items-center px-4 py-8 tabot-bg overflow-hidden" dir="rtl">
      {/* ─── Floating Horror Emojis ─── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className="absolute star-twinkle"
            style={{
              fontSize: `${item.size}px`,
              top: `${item.y}%`,
              left: `${item.x}%`,
              animationDelay: `${item.delay}s`,
              animationDuration: `${item.duration}s`,
              opacity: 0.08,
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* ─── Main Content ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center gap-8 flex-1 justify-center"
      >
        {/* ─── Hero Section ─── */}
        <div className="flex flex-col items-center gap-4">
          {/* Coffin with Glowing Ring */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="relative"
          >
            {/* Glowing Ring */}
            <div className="absolute inset-0 -m-4 rounded-full bg-gradient-to-br from-purple-500/30 via-amber-500/20 to-purple-500/30 blur-xl animate-pulse" />
            <div className="absolute inset-0 -m-2 rounded-full border-2 border-purple-500/30 animate-pulse" />

            {/* Coffin Emoji */}
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="text-7xl sm:text-8xl relative z-10"
            >
              ⚰️
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 bg-gradient-to-l from-purple-400 via-amber-300 to-purple-400 bg-clip-text text-transparent leading-relaxed">
              الهروب من التابوت
            </h1>
            <p className="text-slate-400 text-sm sm:text-base font-medium">
              حظك بين الأبواب... اختر باباً وانتظر قدرك!
            </p>
          </motion.div>
        </div>

        {/* ─── CTA Button ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="w-full max-w-xs"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStart}
            className="w-full py-4 px-8 rounded-2xl bg-gradient-to-l from-purple-600 via-purple-700 to-amber-700 hover:from-purple-500 hover:via-purple-600 hover:to-amber-600 text-white font-black text-lg sm:text-xl shadow-2xl shadow-purple-900/50 transition-all duration-300 pulse-glow-purple"
          >
            ⚰️ ابدأ اللعبة
          </motion.button>
        </motion.div>

        {/* ─── Rules Toggle ─── */}
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-2">
            <Button
              variant="ghost"
              onClick={() => setShowRules(!showRules)}
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-400/10 gap-2 text-sm"
            >
              <Info className="w-4 h-4" />
              {showRules ? 'إخفاء القوانين' : '📜 عرض القوانين'}
            </Button>
          </div>

          {/* ─── Rules Card ─── */}
          <AnimatePresence>
            {showRules && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="overflow-hidden"
              >
                <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-4 sm:p-5">
                  {/* How to play */}
                  <div className="mb-4">
                    <h4 className="font-bold text-purple-400 mb-2 text-sm">ℹ️ كيف تلعب:</h4>
                    <ul className="space-y-1.5 text-slate-400 text-xs sm:text-sm pr-3">
                      <li className="flex gap-2"><span>👥</span> فريقان يتنافسان (كل فريق بقائد ونائب وأعضاء)</li>
                      <li className="flex gap-2"><span>🎲</span> في البداية يُرمى النرد لتحديد الفريق البادئ</li>
                      <li className="flex gap-2"><span>👑</span> قائد كل فريق يختار من يفتح الباب من أعضائه</li>
                      <li className="flex gap-2"><span>🚪</span> 16 باب بنتائج مختلفة عند كل جولة</li>
                      <li className="flex gap-2"><span>🔄</span> دور الفريقين بالتناوب حتى ينتهي أحد الفريقين</li>
                    </ul>
                  </div>

                  {/* Roles */}
                  <div className="mb-4">
                    <h4 className="font-bold text-amber-400 mb-2 text-sm">👑 الأدوار:</h4>
                    <ul className="space-y-1 text-slate-400 text-xs sm:text-sm pr-3">
                      <li>👑 <strong className="text-slate-200">القائد:</strong> يختار من يفتح الباب كل جولة</li>
                      <li>⭐ <strong className="text-slate-200">النائب:</strong> يحل محل القائد إذا لم يختر</li>
                      <li>✅ <strong className="text-slate-200">العضو:</strong> يشارك في اللعب ويفتح الأبواب</li>
                      <li>👁️ <strong className="text-slate-200">الضيف:</strong> يشاهد فقط ولا يشارك</li>
                    </ul>
                  </div>

                  {/* Outcomes expandable */}
                  <button
                    onClick={() => setShowOutcomes(!showOutcomes)}
                    className="w-full flex items-center justify-between text-xs text-red-400/80 hover:text-red-400 transition-colors py-2 border-t border-slate-700/50"
                  >
                    <span className="font-bold">🚪 النتائج الممكنة خلف الأبواب (16 باب):</span>
                    <motion.div animate={{ rotate: showOutcomes ? 180 : 0 }} transition={{ duration: 0.3 }}>
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {showOutcomes && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 pt-3">
                          {(Object.keys(OUTCOME_CONFIG) as DoorOutcome[]).map((outcome) => {
                            const cfg = OUTCOME_CONFIG[outcome];
                            return (
                              <div
                                key={outcome}
                                className="flex items-start gap-2 text-xs text-slate-400 pr-2 py-1"
                              >
                                <span className="text-base shrink-0">{cfg.emoji}</span>
                                <span className="text-slate-300 font-bold shrink-0">{cfg.label}</span>
                                <span className="text-slate-600 shrink-0">×{outcomeCounts[outcome]}</span>
                                <span className="text-slate-500">— {cfg.description}</span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Win condition */}
                  <div className="pt-3 border-t border-slate-700/50 mt-2">
                    <p className="text-amber-400/80 text-xs mb-1">🏆 الفريق الذي يحبس أو يقتل جميع أعضاء الفريق الخصم يفوز!</p>
                    <p className="text-red-400/80 text-xs">💀 اللاعب المقتول لا يمكن إعادته أبداً، لكن المحبوس يمكن تحريره!</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ─── Footer ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="relative z-10 pb-4 text-center"
      >
        <p className="text-xs text-slate-600">
          ألعاب الغريب — برمجة الغريب
        </p>
      </motion.div>
    </div>
  );
}
