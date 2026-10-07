'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useGameStore } from '@/lib/game-store';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Home, Info, Users, ChevronLeft, Zap } from 'lucide-react';

interface LandingPageProps {
  onStartGodfather: () => void;
  onStartDiwaniya: () => void;
}

export default function LandingPage({ onStartGodfather, onStartDiwaniya }: LandingPageProps) {
  // Join (Player entry)
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinError, setJoinError] = useState('');

  // Mode selection
  const [selectedMode, setSelectedMode] = useState<'godfather' | 'diwaniya' | null>(null);

  // Rules
  const [showRules, setShowRules] = useState(false);

  const handleJoin = () => {
    if (!joinCode.trim()) {
      setJoinError('يجب إدخال كود اللعبة');
      return;
    }
    if (!joinName.trim()) {
      setJoinError('يجب إدخال اسمك');
      return;
    }
    setJoinError('');
    window.location.href = `/join/${joinCode.trim().toUpperCase()}?name=${encodeURIComponent(joinName.trim())}`;
  };

  const handleModeSelect = (mode: 'godfather' | 'diwaniya') => {
    setSelectedMode(mode);
  };

  const handleConfirmMode = () => {
    if (selectedMode === 'godfather') {
      useGameStore.getState().setGameMode('godfather');
      useGameStore.getState().setRoomCode(null);
      onStartGodfather();
    } else if (selectedMode === 'diwaniya') {
      useGameStore.getState().setGameMode('diwaniya');
      onStartDiwaniya();
    }
  };

  return (
    <div className="flex flex-col items-center py-6 sm:py-8 px-3 sm:px-4 mafia-bg-night" dir="rtl">
      {/* Stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white star-twinkle"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 3 + 's',
              animationDuration: Math.random() * 3 + 2 + 's',
            }}
          />
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
            🕴️
          </motion.div>
          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-300 to-red-400 mb-2">
            لعبة المافيا
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-bold">
            لعبة ورقية تفاعلية 🔥
          </p>
        </div>

        {/* ================================ */}
        {/* BUTTON 1: CREATE GAME (HOST)     */}
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
              <Card className="bg-gradient-to-bl from-amber-950/40 via-slate-900/80 to-slate-900/80 border-amber-500/30 mb-4 sm:mb-6">
                <CardContent className="pt-5 sm:pt-6">
                  <div className="text-center mb-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring' }}
                      className="inline-flex items-center gap-2 mb-2"
                    >
                      <Zap className="w-5 h-5 text-amber-400" />
                      <h2 className="text-lg sm:text-xl font-bold text-amber-300">
                        إنشاء لعبة جديدة
                      </h2>
                    </motion.div>
                    <p className="text-[10px] sm:text-xs text-slate-400">
                      اختر طريقة اللعب
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Godfather Mode */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleModeSelect('godfather')}
                      className="w-full rounded-xl p-3 sm:p-4 border-2 border-amber-500/30 bg-gradient-to-l from-amber-950/50 to-red-950/30 hover:border-amber-400/50 transition-all text-right cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-900/50 border border-amber-500/30 flex items-center justify-center shrink-0">
                          <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-bold text-amber-200 mb-0.5">
                            العراب
                          </h3>
                          <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed">
                            أدخل أسماء اللاعبين على جهازك وتحكم باللعبة كاملة
                          </p>
                        </div>
                      </div>
                    </motion.button>

                    {/* Diwaniya Mode */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleModeSelect('diwaniya')}
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
                            أنشئ غرفة وشارك الكود، اللاعبون ينضمون من أجهزتهم
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
                selectedMode === 'godfather'
                  ? 'from-amber-950/40 via-slate-900/80 to-slate-900/80 border-amber-500/30'
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
                      {selectedMode === 'godfather' ? '🕴️' : '🏠'}
                    </motion.div>
                    <h2 className={`text-lg sm:text-xl font-bold ${
                      selectedMode === 'godfather' ? 'text-amber-300' : 'text-blue-300'
                    }`}>
                      {selectedMode === 'godfather' ? 'العراب' : 'الديوانية'}
                    </h2>
                  </div>

                  {selectedMode === 'godfather' && (
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>أنت العراب - تدير اللعبة بالكامل</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Users className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>أدخل أسماء اللاعبين يدوياً</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>تحكم بكل المراحل: الليل، النهار، التصويت</span>
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
                        <span>شارك الكود مع الأصدقاء لينضموا</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Zap className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>وافق على الانضمام وابدأ اللعبة</span>
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
                        selectedMode === 'godfather'
                          ? 'bg-gradient-to-l from-amber-600 to-red-800 hover:from-amber-500 hover:to-red-700 text-white pulse-glow-gold'
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
        {/* BUTTON 2: JOIN GAME (PLAYER)     */}
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
                    دخول لاعب
                  </h2>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400">
                  عندك كود اللعبة؟ ادخل هنا
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    كود اللعبة
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
                    placeholder="اسمك في اللعبة..."
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
                  انضم للعبة
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
                    <h4 className="font-bold text-red-400 mb-1">فريق المافيا:</h4>
                    <ul className="space-y-1 text-slate-400 pr-4">
                      <li>🕴️ <strong className="text-slate-200">شيخ المافيا:</strong> يختار ضحية كل ليلة</li>
                      <li>🤫 <strong className="text-slate-200">مافيا التسكيت:</strong> يسكت شخصاً كل ليلة</li>
                      <li>🔪 <strong className="text-slate-200">مافيا عادي:</strong> يشارك القرارات</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-400 mb-1">فريق الصالحين:</h4>
                    <ul className="space-y-1 text-slate-400 pr-4">
                      <li>🏛️ <strong className="text-slate-200">العمده:</strong> يكشف بطاقته بأمان، صوته ٣ أصوات</li>
                      <li>👦 <strong className="text-slate-200">الولد الصالح:</strong> يُخرج أحداً معه عند الإقصاء</li>
                      <li>🏥 <strong className="text-slate-200">الطبيب:</strong> ينقذ الضحية إذا خمّن صح</li>
                      <li>🎯 <strong className="text-slate-200">القناص:</strong> رصاصة واحدة، يقتل معه إذا أخطأ</li>
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-slate-700/50">
                    <p className="text-yellow-400/80 text-xs">🏆 المواطنون يفوزون بإقصاء كل المافيا</p>
                    <p className="text-red-400/80 text-xs">💀 المافيا تفوز بتبقية عدد المافيا مواطنين أو أقل</p>
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
