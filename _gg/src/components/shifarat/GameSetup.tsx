'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Clock, Tag, Users, Check, Eye, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ALL_CATEGORIES } from '@/lib/shifarat-words';
import HowToPlay from './HowToPlay';
import type { TeamColor } from '@/lib/shifarat-types';

interface GameSetupProps {
  onStart: (settings: {
    team1Name: string;
    team2Name: string;
    timer: number;
    categories: string[];
    firstTeam: TeamColor;
    redSpymaster?: string;
    blueSpymaster?: string;
  }) => void;
  onBack: () => void;
}

const TIMER_OPTIONS = [30, 60, 90, 120, 0]; // 0 = unlimited

export default function GameSetup({ onStart, onBack }: GameSetupProps) {
  const [team1Name, setTeam1Name] = useState('الفريق الأحمر');
  const [team2Name, setTeam2Name] = useState('الفريق الأزرق');
  const [timer, setTimer] = useState(60);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    ALL_CATEGORIES.map((c) => c.id)
  );
  const [firstTeam, setFirstTeam] = useState<TeamColor>('red');
  const [redSpymaster, setRedSpymaster] = useState('');
  const [blueSpymaster, setBlueSpymaster] = useState('');
  const [error, setError] = useState('');
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catId)) {
        if (prev.length <= 1) {
          setError('يجب اختيار فئة واحدة على الأقل');
          return prev;
        }
        setError('');
        return prev.filter((id) => id !== catId);
      }
      setError('');
      return [...prev, catId];
    });
  };

  const toggleAllCategories = () => {
    if (selectedCategories.length === ALL_CATEGORIES.length) {
      setError('');
      setSelectedCategories([]);
    } else {
      setError('');
      setSelectedCategories(ALL_CATEGORIES.map((c) => c.id));
    }
  };

  const handleStart = () => {
    if (!team1Name.trim() || !team2Name.trim()) {
      setError('يجب إدخال أسماء الفريقين');
      return;
    }
    if (team1Name.trim() === team2Name.trim()) {
      setError('يجب أن تكون أسماء الفريقين مختلفة');
      return;
    }
    if (selectedCategories.length === 0) {
      setError('يجب اختيار فئة واحدة على الأقل');
      return;
    }
    setError('');
    onStart({
      team1Name: team1Name.trim(),
      team2Name: team2Name.trim(),
      timer,
      categories: selectedCategories,
      firstTeam,
      redSpymaster: redSpymaster.trim() || undefined,
      blueSpymaster: blueSpymaster.trim() || undefined,
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-6 px-3 sm:px-4"
      dir="rtl"
      style={{
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
      }}
    >
      {/* Decorative dots */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              backgroundColor: `rgba(16, 185, 129, ${Math.random() * 0.2 + 0.05})`,
              animation: `pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-auto space-y-4"
      >
        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="text-2xl sm:text-3xl font-black text-emerald-400 mb-1">
            🎯 إعداد اللعبة
          </h1>
          <p className="text-xs text-slate-400">العب مع أصحابك على جهاز واحد</p>
        </div>

        {/* Top actions */}
        <div className="flex items-center justify-between">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-slate-500 hover:text-slate-300 gap-1 text-xs -mt-2"
          >
            <ArrowLeft className="w-4 h-4" />
            رجوع
          </Button>
          <Button
            onClick={() => setShowHowToPlay(true)}
            variant="ghost"
            className="text-emerald-500 hover:text-emerald-400 gap-1 text-xs -mt-2"
          >
            <HelpCircle className="w-4 h-4" />
            كيف تلعب؟
          </Button>
        </div>

        {/* Team Names + Spymasters */}
        <div
          className="rounded-xl p-4 space-y-3"
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(51, 65, 85, 0.5)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-200">أسماء الفرق</h2>
          </div>

          {/* Red Team */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
              <label className="text-xs text-red-300 font-bold">الفريق الأحمر</label>
            </div>
            <Input
              value={team1Name}
              onChange={(e) => { setTeam1Name(e.target.value); setError(''); }}
              placeholder="اسم الفريق الأحمر..."
              className="bg-slate-800/50 border-slate-600/50 text-slate-200 placeholder:text-slate-500 text-right h-11"
              dir="rtl"
              maxLength={20}
            />
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-red-400/60 flex-shrink-0" />
              <Input
                value={redSpymaster}
                onChange={(e) => setRedSpymaster(e.target.value)}
                placeholder="اسم الجاسوس (اختياري)..."
                className="bg-slate-800/30 border-slate-700/40 text-slate-300 placeholder:text-slate-600 text-right h-10 text-xs"
                dir="rtl"
                maxLength={20}
              />
            </div>
          </div>

          {/* Blue Team */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
              <label className="text-xs text-blue-300 font-bold">الفريق الأزرق</label>
            </div>
            <Input
              value={team2Name}
              onChange={(e) => { setTeam2Name(e.target.value); setError(''); }}
              placeholder="اسم الفريق الأزرق..."
              className="bg-slate-800/50 border-slate-600/50 text-slate-200 placeholder:text-slate-500 text-right h-11"
              dir="rtl"
              maxLength={20}
            />
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-blue-400/60 flex-shrink-0" />
              <Input
                value={blueSpymaster}
                onChange={(e) => setBlueSpymaster(e.target.value)}
                placeholder="اسم الجاسوس (اختياري)..."
                className="bg-slate-800/30 border-slate-700/40 text-slate-300 placeholder:text-slate-600 text-right h-10 text-xs"
                dir="rtl"
                maxLength={20}
              />
            </div>
          </div>
        </div>

        {/* First Team Selector */}
        <div
          className="rounded-xl p-4"
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(51, 65, 85, 0.5)',
          }}
        >
          <h2 className="text-sm font-bold text-slate-200 mb-3">الفريق الذي يبدأ أولاً</h2>
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setFirstTeam('red')}
              className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${
                firstTeam === 'red'
                  ? 'bg-red-950/40 border-red-500/60 shadow-lg shadow-red-500/10'
                  : 'bg-slate-800/30 border-slate-700/40 hover:bg-slate-800/50'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-red-500 mx-auto mb-1.5" />
              <p className={`text-xs font-bold ${firstTeam === 'red' ? 'text-red-300' : 'text-slate-500'}`}>
                الفريق الأحمر
              </p>
              <p className="text-[9px] text-slate-600 mt-0.5">9 كلمات</p>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setFirstTeam('blue')}
              className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${
                firstTeam === 'blue'
                  ? 'bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-800/30 border-slate-700/40 hover:bg-slate-800/50'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 mx-auto mb-1.5" />
              <p className={`text-xs font-bold ${firstTeam === 'blue' ? 'text-blue-300' : 'text-slate-500'}`}>
                الفريق الأزرق
              </p>
              <p className="text-[9px] text-slate-600 mt-0.5">8 كلمات</p>
            </motion.button>
          </div>
        </div>

        {/* Timer */}
        <div
          className="rounded-xl p-4"
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(51, 65, 85, 0.5)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-200">الوقت (بالثانية)</h2>
            <span className="text-xs text-slate-500 mr-auto">
              {timer === 0 ? 'بدون وقت' : `${timer} ثانية`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TIMER_OPTIONS.map((t) => (
              <motion.button
                key={t}
                whileTap={{ scale: 0.92 }}
                onClick={() => setTimer(t)}
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all min-w-[52px] min-h-[44px]"
                style={{
                  background: timer === t
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.1))'
                    : 'rgba(30, 41, 59, 0.8)',
                  border: timer === t
                    ? '2px solid rgba(16, 185, 129, 0.5)'
                    : '2px solid rgba(51, 65, 85, 0.3)',
                  color: timer === t ? '#6ee7b7' : '#94a3b8',
                }}
              >
                {t === 0 ? '∞' : t}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div
          className="rounded-xl p-4"
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(51, 65, 85, 0.5)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-200">الفئات</h2>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={toggleAllCategories}
              className="mr-auto text-[10px] px-2 py-1 rounded-lg text-emerald-400 font-bold"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              {selectedCategories.length === ALL_CATEGORIES.length ? 'إلغاء الكل' : 'اختر الكل'}
            </motion.button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ALL_CATEGORIES.map((cat, i) => {
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => toggleCategory(cat.id)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px]"
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.1))'
                      : 'rgba(30, 41, 59, 0.8)',
                    border: isSelected
                      ? '2px solid rgba(16, 185, 129, 0.5)'
                      : '2px solid rgba(51, 65, 85, 0.3)',
                    color: isSelected ? '#6ee7b7' : '#94a3b8',
                  }}
                >
                  <span>{cat.emoji}</span>
                  <span className="truncate">{cat.name}</span>
                  {isSelected && <Check className="w-3 h-3 mr-auto text-emerald-400" />}
                </motion.button>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-500 mt-2 text-center">
            {selectedCategories.length} من {ALL_CATEGORIES.length} فئات محددة
          </p>
        </div>

        {/* Error */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-xs text-center"
          >
            ⚠️ {error}
          </motion.p>
        )}

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleStart}
            className="w-full font-bold text-base sm:text-lg py-6 transition-all duration-300 text-white"
            style={{
              background: 'linear-gradient(to left, #059669, #10b981)',
              borderRadius: '1rem',
              minHeight: '52px',
              boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
            }}
          >
            <Play className="w-5 h-5 ml-2" />
            ابدأ اللعبة 🔥
          </Button>
        </motion.div>
      </motion.div>

      {/* How to Play */}
      <HowToPlay open={showHowToPlay} onOpenChange={setShowHowToPlay} />
    </div>
  );
}
