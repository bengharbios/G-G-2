'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { usePrisonStore } from '@/lib/prison-store';
import type { PrisonTeam, PrisonPlayer } from '@/lib/prison-types';
import { Plus, Minus, ChevronLeft } from 'lucide-react';

const GRID_OPTIONS = [
  { size: 9, label: '9 صغيرة', cols: 3, desc: 'سريعة' },
  { size: 16, label: '16 كبيرة', cols: 4, desc: 'متوسطة' },
  { size: 20, label: '20 عملاقة', cols: 5, desc: 'طويلة' },
] as const;

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function GameSetup() {
  const { alphaName, betaName, setTeamNames, setGridSize, setPlayers, startGame } = usePrisonStore();

  const [localAlphaName, setLocalAlphaName] = useState(alphaName);
  const [localBetaName, setLocalBetaName] = useState(betaName);
  const [selectedGridSize, setSelectedGridSize] = useState(16);
  const [alphaPlayers, setAlphaPlayers] = useState<string[]>(['', '']);
  const [betaPlayers, setBetaPlayers] = useState<string[]>(['', '']);

  const addPlayer = (team: 'alpha' | 'beta') => {
    if (team === 'alpha') {
      if (alphaPlayers.length >= 8) return;
      setAlphaPlayers([...alphaPlayers, '']);
    } else {
      if (betaPlayers.length >= 8) return;
      setBetaPlayers([...betaPlayers, '']);
    }
  };

  const removePlayer = (team: 'alpha' | 'beta', index: number) => {
    if (team === 'alpha') {
      if (alphaPlayers.length <= 2) return;
      setAlphaPlayers(alphaPlayers.filter((_, i) => i !== index));
    } else {
      if (betaPlayers.length <= 2) return;
      setBetaPlayers(betaPlayers.filter((_, i) => i !== index));
    }
  };

  const updatePlayerName = (team: 'alpha' | 'beta', index: number, name: string) => {
    if (team === 'alpha') {
      const updated = [...alphaPlayers];
      updated[index] = name;
      setAlphaPlayers(updated);
    } else {
      const updated = [...betaPlayers];
      updated[index] = name;
      setBetaPlayers(updated);
    }
  };

  const handleStart = () => {
    const t1Name = localAlphaName.trim() || 'فريق أ';
    const t2Name = localBetaName.trim() || 'فريق ب';

    const players: PrisonPlayer[] = [
      ...alphaPlayers.map((name, i) => ({
        id: generateId(),
        name: name.trim() || `لاعب ${i + 1}`,
        team: 'alpha' as PrisonTeam,
        status: 'active' as const,
        uniformCount: 0,
      })),
      ...betaPlayers.map((name, i) => ({
        id: generateId(),
        name: name.trim() || `لاعب ${i + 1}`,
        team: 'beta' as PrisonTeam,
        status: 'active' as const,
        uniformCount: 0,
      })),
    ];

    setTeamNames(t1Name, t2Name);
    setGridSize(selectedGridSize);
    setPlayers(players);
    startGame();
  };

  const allAlphaValid = alphaPlayers.every((name) => name.trim().length > 0);
  const allBetaValid = betaPlayers.every((name) => name.trim().length > 0);
  const isValid = allAlphaValid && allBetaValid;

  return (
    <div className="flex flex-col items-center px-4 py-6 sm:py-8" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm mx-auto"
      >
        {/* Title */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="text-center mb-6"
        >
          <div className="text-4xl mb-2">🔒</div>
          <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
            تجهيز السجن
          </h2>
          <p className="text-xs text-slate-400 mt-1">أعدّ الفرق واختر حجم الزنزانة!</p>
        </motion.div>

        {/* Team Names */}
        <div className="flex gap-3 mb-4">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1"
          >
            <label className="text-xs text-amber-400 mb-1 block font-bold">فريق أ</label>
            <input
              type="text"
              value={localAlphaName}
              onChange={(e) => setLocalAlphaName(e.target.value)}
              placeholder="فريق أ"
              className="w-full bg-slate-800/60 border border-amber-500/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
              maxLength={20}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1"
          >
            <label className="text-xs text-cyan-400 mb-1 block font-bold">فريق ب</label>
            <input
              type="text"
              value={localBetaName}
              onChange={(e) => setLocalBetaName(e.target.value)}
              placeholder="فريق ب"
              className="w-full bg-slate-800/60 border border-cyan-500/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              maxLength={20}
            />
          </motion.div>
        </div>

        {/* Grid Size Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-4 rounded-2xl border border-slate-700/40 bg-slate-900/60 p-4"
        >
          <p className="text-xs text-slate-400 font-bold mb-3 text-center">🏗️ حجم السجن</p>
          <div className="flex gap-2">
            {GRID_OPTIONS.map((opt) => (
              <button
                key={opt.size}
                onClick={() => setSelectedGridSize(opt.size)}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border-2 ${
                  selectedGridSize === opt.size
                    ? 'border-amber-500 bg-amber-950/60 text-amber-200 shadow-lg shadow-amber-950/30'
                    : 'border-slate-700/40 bg-slate-800/40 text-slate-400 hover:border-amber-500/40'
                }`}
              >
                <div className="text-sm sm:text-base">{opt.label}</div>
                <div className="text-[10px] mt-0.5 opacity-70">{opt.desc}</div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Alpha Team Players */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-3 rounded-2xl border-2 border-amber-500/30 bg-gradient-to-l from-amber-950/40 to-slate-900/80 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-900/50 border border-amber-500/30 flex items-center justify-center">
                <span className="text-sm">🟡</span>
              </div>
              <h3 className="font-bold text-amber-300 text-sm">{localAlphaName.trim() || 'فريق أ'}</h3>
            </div>
            <span className="text-[10px] text-slate-500">{alphaPlayers.length} لاعبين</span>
          </div>

          <div className="space-y-2">
            {alphaPlayers.map((name, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => updatePlayerName('alpha', idx, e.target.value)}
                  placeholder={`لاعب ${idx + 1}`}
                  className="flex-1 bg-slate-800/60 border border-amber-500/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                  maxLength={15}
                />
                {alphaPlayers.length > 2 && (
                  <button
                    onClick={() => removePlayer('alpha', idx)}
                    className="w-8 h-8 rounded-lg bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-900/50 transition-colors shrink-0 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {alphaPlayers.length < 8 && (
            <Button
              onClick={() => addPlayer('alpha')}
              variant="ghost"
              className="w-full mt-2 text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 gap-1 text-xs h-9"
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة لاعب
            </Button>
          )}
        </motion.div>

        {/* Beta Team Players */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6 rounded-2xl border-2 border-cyan-500/30 bg-gradient-to-l from-cyan-950/40 to-slate-900/80 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-900/50 border border-cyan-500/30 flex items-center justify-center">
                <span className="text-sm">🔵</span>
              </div>
              <h3 className="font-bold text-cyan-300 text-sm">{localBetaName.trim() || 'فريق ب'}</h3>
            </div>
            <span className="text-[10px] text-slate-500">{betaPlayers.length} لاعبين</span>
          </div>

          <div className="space-y-2">
            {betaPlayers.map((name, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => updatePlayerName('beta', idx, e.target.value)}
                  placeholder={`لاعب ${idx + 1}`}
                  className="flex-1 bg-slate-800/60 border border-cyan-500/20 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  maxLength={15}
                />
                {betaPlayers.length > 2 && (
                  <button
                    onClick={() => removePlayer('beta', idx)}
                    className="w-8 h-8 rounded-lg bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-900/50 transition-colors shrink-0 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {betaPlayers.length < 8 && (
            <Button
              onClick={() => addPlayer('beta')}
              variant="ghost"
              className="w-full mt-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30 gap-1 text-xs h-9"
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة لاعب
            </Button>
          )}
        </motion.div>

        {/* Start Button */}
        <motion.button
          whileHover={{ scale: isValid ? 1.02 : 1 }}
          whileTap={{ scale: isValid ? 0.98 : 1 }}
          onClick={handleStart}
          disabled={!isValid}
          className={`w-full rounded-2xl py-4 font-bold text-base sm:text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
            isValid
              ? 'bg-gradient-to-l from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:via-orange-500 hover:to-amber-600 text-white shadow-lg shadow-amber-950/50'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>🔒</span>
          <span>ابدأ اللعبة 🔑</span>
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        {/* Validation hint */}
        {!isValid && (
          <p className="text-center text-[10px] text-red-400/70 mt-2">
            يجب إدخال أسماء جميع اللاعبين (2 لكل فريق على الأقل)
          </p>
        )}
      </motion.div>
    </div>
  );
}
