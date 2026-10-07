'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/lib/game-store';
import {
  MIN_PLAYERS,
  MAX_PLAYERS,
  getTeamComposition,
} from '@/lib/game-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Play, Info, Plus, Minus, Shield, Skull, ArrowLeft } from 'lucide-react';

interface GameSetupProps {
  onStartGame: () => void;
}

export default function GameSetup({ onStartGame }: GameSetupProps) {
  const startGame = useGameStore((s) => s.startGame);
  const [playerCount, setPlayerCount] = useState(MIN_PLAYERS);
  const [playerNames, setPlayerNames] = useState<string[]>(
    Array.from({ length: MIN_PLAYERS }, (_, i) => `اللاعب ${i + 1}`)
  );
  const [showRules, setShowRules] = useState(false);
  const [error, setError] = useState('');
  const [customMafiaCount, setCustomMafiaCount] = useState<number | undefined>(undefined);

  const composition = useMemo(
    () => getTeamComposition(playerCount, customMafiaCount),
    [playerCount, customMafiaCount]
  );

  const handleCountChange = (newCount: number) => {
    const clamped = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, newCount));
    setPlayerCount(clamped);
    setPlayerNames((prev) => {
      if (clamped > prev.length) {
        return [
          ...prev,
          ...Array.from(
            { length: clamped - prev.length },
            (_, i) => `اللاعب ${prev.length + i + 1}`
          ),
        ];
      }
      return prev.slice(0, clamped);
    });
    setError('');
  };

  const handleNameChange = (index: number, name: string) => {
    const updated = [...playerNames];
    updated[index] = name;
    setPlayerNames(updated);
    setError('');
  };

  const handleStart = () => {
    const trimmed = playerNames.map((n) => n.trim());

    if (trimmed.some((n) => n.length === 0)) {
      setError('يجب إدخال أسماء جميع اللاعبين');
      return;
    }

    const uniqueNames = new Set(trimmed);
    if (uniqueNames.size !== trimmed.length) {
      setError('يجب أن تكون الأسماء مختلفة');
      return;
    }

    startGame(trimmed, customMafiaCount);
    onStartGame();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 mafia-bg-night">
      {/* Stars background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
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
        className="relative z-10 w-full max-w-sm sm:max-w-lg mx-auto"
      >
        {/* Back button */}
        <Button
          onClick={() => useGameStore.getState().resetGame()}
          variant="ghost"
          className="text-slate-500 hover:text-slate-300 mb-3 gap-1 text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          رجوع
        </Button>

        {/* Game Title */}
        <div className="text-center mb-4 sm:mb-6">
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
            {playerCount} لاعب • {composition.mafiaCount} مافيا •{' '}
            {composition.citizenCount} مواطن صالح 🔥
          </p>
        </div>

        {/* Player Count Selector */}
        <Card className="bg-slate-900/80 border-slate-700/50 mb-3 sm:mb-4">
          <CardContent className="pt-4">
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              <div
                onClick={() => handleCountChange(playerCount - 1)}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-900/50 border border-red-500/50 flex items-center justify-center cursor-pointer hover:bg-red-800/50 transition-colors"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    handleCountChange(playerCount - 1);
                }}
              >
                <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-red-300" />
              </div>

              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-black text-slate-100">
                  {playerCount}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-500">
                  عدد اللاعبين
                </div>
              </div>

              <div
                onClick={() => handleCountChange(playerCount + 1)}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-900/50 border border-green-500/50 flex items-center justify-center cursor-pointer hover:bg-green-800/50 transition-colors"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    handleCountChange(playerCount + 1);
                }}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-green-300" />
              </div>
            </div>

            {/* Team Composition Display */}
            <AnimatePresence mode="wait">
              <motion.div
                key={playerCount}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.3 }}
                className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-3"
              >
                {/* Mafia Team */}
                <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-2.5 sm:p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Skull className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                    <span className="text-red-300 font-bold text-xs sm:text-sm">
                      فريق المافيا ({composition.mafiaCount})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {composition.mafiaRoles.map((role, i) => (
                      <div
                        key={`${role.type}-${i}`}
                        className="text-[10px] sm:text-xs text-slate-400"
                      >
                        {role.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Citizen Team */}
                <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-2.5 sm:p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                    <span className="text-blue-300 font-bold text-xs sm:text-sm">
                      فريق الصالحين ({composition.citizenCount})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {composition.citizenSpecialRoles.map((role) => (
                      <div
                        key={role.type}
                        className="text-[10px] sm:text-xs text-slate-400"
                      >
                        {role.name}
                      </div>
                    ))}
                    {composition.plainCitizens > 0 && (
                      <div className="text-[10px] sm:text-xs text-slate-400">
                        👤 مواطن عادي ×{composition.plainCitizens}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Win conditions */}
            <div className="mt-3 sm:mt-4 flex items-center justify-between gap-2 text-[10px] sm:text-xs px-2">
              <p className="text-yellow-400/80 text-center">
                🏆 الصالحون يفوزون بإقصاء كل المافيا
              </p>
              <p className="text-red-400/80 text-center">
                💀 المافيا تفوز بتفوق عددي على المواطنين
              </p>
            </div>

            {/* Custom mafia count selector */}
            <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2">
              <span className="text-[10px] sm:text-xs text-slate-400">عدد المافيا:</span>
              {([undefined, 2, 3, 4] as const).map((count) => (
                <motion.button
                  key={count ?? 'auto'}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    setCustomMafiaCount(count);
                    setError('');
                  }}
                  className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all ${
                    (customMafiaCount === count)
                      ? 'bg-red-900/60 text-red-200 border-2 border-red-500/50'
                      : 'bg-slate-800/60 text-slate-400 border-2 border-slate-700/50 hover:bg-slate-700/60 hover:text-slate-300'
                  }`}
                >
                  {count === undefined ? 'تلقائي' : `${count} مافيا`}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rules Toggle */}
        <div className="flex justify-center mb-3 sm:mb-4">
          <Button
            variant="ghost"
            onClick={() => setShowRules(!showRules)}
            className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 gap-2 text-sm"
          >
            <Info className="w-4 h-4" />
            {showRules ? 'إخفاء القوانين' : 'عرض القوانين'}
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
              className="overflow-hidden mb-3 sm:mb-4"
            >
              <Card className="bg-slate-900/80 border-slate-700/50 mb-3">
                <CardHeader className="pb-3">
                  <CardTitle className="text-yellow-400 text-base sm:text-lg">
                    📜 القوانين
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs sm:text-sm text-slate-300 space-y-3">
                  <div>
                    <h4 className="font-bold text-red-400 mb-1">
                      الجانية (فريق المافيا):
                    </h4>
                    <ul className="space-y-1 text-slate-400 pr-4">
                      <li>
                        🕴️{' '}
                        <strong className="text-slate-200">
                          شيخ المافيا:
                        </strong>{' '}
                        يختار ضحية كل ليلة
                      </li>
                      <li>
                        🤫{' '}
                        <strong className="text-slate-200">
                          مافيا التسكيت:
                        </strong>{' '}
                        يسكت شخصاً كل ليلة
                      </li>
                      <li>
                        🔪{' '}
                        <strong className="text-slate-200">
                          مافيا عادي:
                        </strong>{' '}
                        يشارك القرارات
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-400 mb-1">
                      الصالحين (فريق المواطنين):
                    </h4>
                    <ul className="space-y-1 text-slate-400 pr-4">
                      <li>
                        🏛️{' '}
                        <strong className="text-slate-200">
                          العمده:
                        </strong>{' '}
                        يكشف بطاقته بأمان، صوته ٣ أصوات
                      </li>
                      {composition.citizenSpecialRoles.some(
                        (r) => r.type === 'good_son'
                      ) && (
                        <li>
                          👦{' '}
                          <strong className="text-slate-200">
                            الولد الصالح:
                          </strong>{' '}
                          يُخرج أحداً معه عند الإقصاء
                        </li>
                      )}
                      <li>
                        🏥{' '}
                        <strong className="text-slate-200">
                          الطبيب:
                        </strong>{' '}
                        ينقذ الضحية إذا خمّن صح
                      </li>
                      {composition.citizenSpecialRoles.some(
                        (r) => r.type === 'sniper'
                      ) && (
                        <li>
                          🎯{' '}
                          <strong className="text-slate-200">
                            القناص:
                          </strong>{' '}
                          رصاصة واحدة، يقتل معه إذا أخطأ
                        </li>
                      )}
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-slate-700/50">
                    <p className="text-yellow-400/80 text-xs sm:text-sm">
                      🏆 المواطنون يفوزون بإقصاء كل المافيا
                    </p>
                    <p className="text-red-400/80 text-xs sm:text-sm">
                      💀 المافيا تفوز بتبقية{' '}
                      {composition.mafiaCount} مواطنين أو أقل
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player Names */}
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm sm:text-base">
              <span className="text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                أسماء اللاعبين
              </span>
              <Badge
                variant="secondary"
                className="bg-yellow-500/20 text-yellow-400 text-xs"
              >
                {playerCount} لاعب
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 sm:max-h-72 overflow-y-auto mafia-scrollbar pl-2">
              {playerNames.map((name, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="flex items-center gap-2"
                >
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 border border-slate-600/50 flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-400 shrink-0">
                    {index + 1}
                  </span>
                  <Input
                    value={name}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    placeholder={`اسم اللاعب ${index + 1}`}
                    className="bg-slate-800/50 border-slate-600/50 text-slate-200 placeholder:text-slate-500 text-right text-sm h-11"
                    dir="rtl"
                  />
                </motion.div>
              ))}
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-xs sm:text-sm mt-3 text-center"
              >
                ⚠️ {error}
              </motion.p>
            )}

            <Button
              onClick={handleStart}
              className="w-full mt-4 sm:mt-6 bg-gradient-to-l from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold text-base sm:text-lg py-5 sm:py-6 transition-all duration-300 pulse-glow-red"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              ابدأ اللعبة 🔥
            </Button>
          </CardContent>
        </Card>

      </motion.div>
    </div>
  );
}
