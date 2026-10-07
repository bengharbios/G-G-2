'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Home, Info, Users, ChevronLeft, Zap, Swords } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LandingPageProps {
  onStartLocal: () => void;
  onStartDiwaniya?: () => void;
}

const FLOATING_EMOJIS = ['🥁', '⚔️', '🛡️', '💣', '🔥', '🎯', '🏹', '🎖️', '⚔️', '🥁'];

export default function LandingPage({ onStartLocal, onStartDiwaniya }: LandingPageProps) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<'classic' | 'diwaniya' | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinError, setJoinError] = useState('');
  const [showRules, setShowRules] = useState(false);

  const handleJoin = () => {
    if (!joinCode.trim()) {
      setJoinError('يجب إدخال كود الغرفة');
      return;
    }
    if (!joinName.trim()) {
      setJoinError('يجب إدخال اسمك');
      return;
    }
    setJoinError('');
    window.location.href = `/join/tobol/${joinCode.trim().toUpperCase()}?name=${encodeURIComponent(joinName.trim())}`;
  };

  const handleConfirmMode = () => {
    if (selectedMode === 'classic') {
      onStartLocal?.();
    } else if (selectedMode === 'diwaniya') {
      onStartDiwaniya?.();
    }
  };

  return (
    <div className="flex flex-col items-center py-6 sm:py-8 px-3 sm:px-4 tobol-bg relative" dir="rtl">
      {/* Floating war emojis */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {FLOATING_EMOJIS.map((emoji, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl sm:text-3xl opacity-20"
            style={{
              left: `${10 + (i * 9) % 80}%`,
              top: `${5 + (i * 13) % 70}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
              opacity: [0.1, 0.25, 0.1],
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut',
            }}
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto"
      >
        {/* Title */}
        <div className="text-center mb-6 sm:mb-8">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
            className="text-6xl sm:text-7xl mb-3 sm:mb-4"
          >
            🥁
          </motion.div>
          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-red-500 mb-2">
            طبول الحرب
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-bold">
            Tobol - War Drums ⚔️
          </p>
        </div>

        {/* ================================ */}
        {/* CREATE GAME (MODE SELECTION)       */}
        {/* ================================ */}
        <AnimatePresence mode="wait">
          {!selectedMode ? (
            <motion.div
              key="mode-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="bg-gradient-to-bl from-red-950/40 via-slate-900/80 to-slate-900/80 border-red-500/30 mb-4 sm:mb-6">
                <CardContent className="pt-5 sm:pt-6">
                  <div className="text-center mb-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring' }}
                      className="inline-flex items-center gap-2 mb-2"
                    >
                      <Zap className="w-5 h-5 text-red-400" />
                      <h2 className="text-lg sm:text-xl font-bold text-red-300">
                        إنشاء معركة جديدة
                      </h2>
                    </motion.div>
                    <p className="text-[10px] sm:text-xs text-slate-400">
                      اختر طريقة اللعب
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* العراب - Local Mode */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedMode('classic')}
                      className="w-full rounded-xl p-3 sm:p-4 border-2 border-red-500/30 bg-gradient-to-l from-red-950/50 to-red-950/30 hover:border-red-400/50 transition-all text-right cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-900/50 border border-red-500/30 flex items-center justify-center shrink-0">
                          <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-red-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-bold text-red-200 mb-0.5">
                            العراب
                          </h3>
                          <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed">
                            فريقين على جهاز واحد — العراب يتحكم باللعبة
                          </p>
                        </div>
                      </div>
                    </motion.button>

                    {/* الديوانية - Spectator Mode */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedMode('diwaniya')}
                      className="w-full rounded-xl p-3 sm:p-4 border-2 border-blue-500/30 bg-gradient-to-l from-blue-950/50 to-indigo-950/30 hover:border-blue-400/50 transition-all text-right cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center shrink-0">
                          <Home className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-bold text-blue-200 mb-0.5">
                            الديوانية
                          </h3>
                          <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed">
                            أنشئ غرفة وشارك الكود، المشاهدون يشاهدون المعركة
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="mode-confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, type: 'spring' }}
              className="mb-4 sm:mb-6"
            >
              <Card className={`bg-gradient-to-bl ${
                selectedMode === 'classic'
                  ? 'from-red-950/40 via-slate-900/80 to-slate-900/80 border-red-500/30'
                  : 'from-blue-950/40 via-slate-900/80 to-slate-900/80 border-blue-500/30'
              }`}>
                <CardContent className="pt-5 sm:pt-6">
                  <div className="text-center mb-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="text-4xl mb-2"
                    >
                      {selectedMode === 'classic' ? '🕴️' : '🏠'}
                    </motion.div>
                    <h2 className={`text-lg sm:text-xl font-bold ${
                      selectedMode === 'classic' ? 'text-red-300' : 'text-blue-300'
                    }`}>
                      {selectedMode === 'classic' ? 'العراب' : 'الديوانية'}
                    </h2>
                  </div>

                  {selectedMode === 'classic' && (
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Crown className="w-4 h-4 text-red-400 shrink-0" />
                        <span>أنت العراب — تتحكم بالمعركة بالكامل</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Swords className="w-4 h-4 text-red-400 shrink-0" />
                        <span>فريقين يلعبان على نفس الجهاز</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Zap className="w-4 h-4 text-red-400 shrink-0" />
                        <span>60 زر معركة و 64 بطاقة أسلحة</span>
                      </div>
                    </div>
                  )}

                  {selectedMode === 'diwaniya' && (
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Home className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>أنشئ غرفة واحصل على كود</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Users className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>شارك الكود مع المشاهدين ليشاهدوا المعركة</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Zap className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>بث مباشر بدون تدخل من المشاهدين</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setSelectedMode(null)}
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 py-4 text-sm"
                    >
                      رجوع
                    </Button>
                    <Button
                      onClick={handleConfirmMode}
                      className={`flex-1 font-bold text-base sm:text-lg py-5 transition-all duration-300 ${
                        selectedMode === 'classic'
                          ? 'bg-gradient-to-l from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white pulse-glow-red'
                          : 'bg-gradient-to-l from-blue-600 to-indigo-800 hover:from-blue-500 hover:to-indigo-700 text-white pulse-glow-blue'
                      }`}
                    >
                      متابعة
                      <ChevronLeft className="w-4 h-4 mr-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="flex-1 h-px bg-gradient-to-l from-slate-600 to-transparent" />
          <span className="text-xs text-slate-500 font-bold">أو</span>
          <div className="flex-1 h-px bg-gradient-to-r from-slate-600 to-transparent" />
        </div>

        {/* ================================ */}
        {/* JOIN ROOM (SPECTATOR)               */}
        {/* ================================ */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="bg-gradient-to-bl from-green-950/40 via-slate-900/80 to-slate-900/80 border-green-500/30 mb-4 sm:mb-6">
            <CardContent className="pt-5 sm:pt-6">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-green-400" />
                  <h2 className="text-lg sm:text-xl font-bold text-green-300">
                    دخول مشاهد
                  </h2>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400">
                  عندك كود الغرفة؟ شاهد المعركة مباشرة
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    كود الغرفة
                  </label>
                  <Input
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value.toUpperCase());
                      setJoinError('');
                    }}
                    placeholder="مثال: ABC123"
                    className="bg-slate-800/50 border-green-500/30 text-slate-200 placeholder:text-slate-500 text-center font-mono text-lg h-12 tracking-widest"
                    maxLength={6}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    اسمك
                  </label>
                  <Input
                    value={joinName}
                    onChange={(e) => {
                      setJoinName(e.target.value);
                      setJoinError('');
                    }}
                    placeholder="اسمك في المعركة..."
                    className="bg-slate-800/50 border-green-500/30 text-slate-200 placeholder:text-slate-500 text-right h-12"
                    dir="rtl"
                    maxLength={20}
                  />
                </div>

                {joinError && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-xs text-center"
                  >
                    ⚠️ {joinError}
                  </motion.p>
                )}

                <Button
                  onClick={handleJoin}
                  className="w-full bg-gradient-to-l from-green-600 to-emerald-800 hover:from-green-500 hover:to-emerald-700 text-white font-bold text-base sm:text-lg py-5 sm:py-6 transition-all duration-300 pulse-glow-blue"
                >
                  <Users className="w-5 h-5 ml-2" />
                  انضم للمشاهدة
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Rules Toggle */}
        <div className="flex justify-center mb-3">
          <Button
            variant="ghost"
            onClick={() => setShowRules(!showRules)}
            className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 gap-2 text-sm"
          >
            <Info className="w-4 h-4" />
            {showRules ? 'إخفاء القوانين' : '📜 عرض القوانين'}
          </Button>
        </div>

        {/* Rules */}
        <AnimatePresence>
          {showRules && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-3"
            >
              <Card className="bg-slate-900/80 border-slate-700/50">
                <CardContent className="pt-4 text-xs sm:text-sm text-slate-300 space-y-3">
                  <div>
                    <h4 className="font-bold text-red-400 mb-1">⚔️ الهجوم:</h4>
                    <ul className="space-y-1 text-slate-400 pr-4">
                      <li>🎯 عند اختيار زر تظهر بطاقة سلاح</li>
                      <li>💥 إذا كانت بطاقة هجوم — خصم نقاط من الفريق الخصم</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-orange-400 mb-1">💣 الفخ:</h4>
                    <ul className="space-y-1 text-slate-400 pr-4">
                      <li>⚠️ إذا كانت بطاقة فخ — خصم نقاط من فريقك أنت</li>
                      <li>😅 بطاقة فارغة — لا ضرر على أي فريق</li>
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-slate-700/50">
                    <p className="text-yellow-400/80 text-xs">🏆 الفريق الذي يبقى بنقاط أكثر يفوز</p>
                    <p className="text-slate-500 text-xs">60 زر معركة — 64 بطاقة سلاح مشوّشة</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}
