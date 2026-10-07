'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useRiskStore } from '@/lib/risk-store';
import { Plus, Minus, ChevronLeft, Users, Trophy } from 'lucide-react';
import { DEFAULT_PLAYER_NAMES, TARGET_SCORE_OPTIONS } from '@/lib/risk-types';
import type { RiskGameConfig } from '@/lib/risk-types';

const PLAYER_COUNT_OPTIONS = [2, 3, 4, 5, 6, 7, 8];

export default function GameSetup() {
  const { startGame } = useRiskStore();

  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(DEFAULT_PLAYER_NAMES);
  const [targetScore, setTargetScore] = useState(50);

  const updatePlayerName = (index: number, name: string) => {
    const updated = [...playerNames];
    updated[index] = name;
    setPlayerNames(updated);
  };

  const handleStart = () => {
    const config: RiskGameConfig = {
      targetScore,
      playerNames: playerNames.slice(0, playerCount),
    };
    startGame(config);
  };

  const playerNamesValid = playerNames.slice(0, playerCount).every(n => n.trim().length > 0);

  const PLAYER_COLORS = [
    { bg: 'bg-violet-950/40', border: 'border-violet-500/30', text: 'text-violet-300', dot: 'bg-violet-500' },
    { bg: 'bg-emerald-950/40', border: 'border-emerald-500/30', text: 'text-emerald-300', dot: 'bg-emerald-500' },
    { bg: 'bg-amber-950/40', border: 'border-amber-500/30', text: 'text-amber-300', dot: 'bg-amber-500' },
    { bg: 'bg-rose-950/40', border: 'border-rose-500/30', text: 'text-rose-300', dot: 'bg-rose-500' },
    { bg: 'bg-cyan-950/40', border: 'border-cyan-500/30', text: 'text-cyan-300', dot: 'bg-cyan-500' },
    { bg: 'bg-orange-950/40', border: 'border-orange-500/30', text: 'text-orange-300', dot: 'bg-orange-500' },
    { bg: 'bg-pink-950/40', border: 'border-pink-500/30', text: 'text-pink-300', dot: 'bg-pink-500' },
    { bg: 'bg-teal-950/40', border: 'border-teal-500/30', text: 'text-teal-300', dot: 'bg-teal-500' },
  ];

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
          <div className="text-4xl mb-2">💣</div>
          <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
            تجهيز المجازفة
          </h2>
          <p className="text-xs text-slate-400 mt-1">أعدّ اللاعبين واختر الهدف!</p>
        </motion.div>

        {/* Target Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-4 rounded-2xl border border-slate-700/40 bg-slate-900/60 p-4"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-400" />
            <p className="text-xs text-slate-400 font-bold">الهدف</p>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-center">
            {TARGET_SCORE_OPTIONS.map((score) => (
              <button
                key={score}
                onClick={() => setTargetScore(score)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer border ${
                  targetScore === score
                    ? 'border-amber-500 bg-amber-950/60 text-amber-200 shadow-lg shadow-amber-950/30'
                    : 'border-slate-700/40 bg-slate-800/40 text-slate-400 hover:border-amber-500/40'
                }`}
              >
                {score}
              </button>
            ))}
          </div>
          <p className="text-center text-[10px] text-slate-500 mt-2">
            أول لاعب يوصل لـ {targetScore} نقطة يفوز 🏆
          </p>
        </motion.div>

        {/* Player Count */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4 rounded-2xl border border-slate-700/40 bg-slate-900/60 p-4"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Users className="w-4 h-4 text-violet-400" />
            <p className="text-xs text-slate-400 font-bold">عدد اللاعبين</p>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {PLAYER_COUNT_OPTIONS.map((count) => (
              <button
                key={count}
                onClick={() => setPlayerCount(count)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-2 ${
                  playerCount === count
                    ? 'border-violet-500 bg-violet-950/60 text-violet-200 shadow-lg shadow-violet-950/30'
                    : 'border-slate-700/40 bg-slate-800/40 text-slate-400 hover:border-violet-500/40'
                }`}
              >
                <div className="text-sm sm:text-base">{count}</div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Player Names */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-4 space-y-2"
        >
          {Array.from({ length: playerCount }).map((_, idx) => {
            const color = PLAYER_COLORS[idx];
            return (
              <div key={idx} className={`rounded-xl border ${color.border} ${color.bg} p-3`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${color.dot}`} />
                  <span className={`text-xs font-bold ${color.text}`}>لاعب {idx + 1}</span>
                </div>
                <input
                  type="text"
                  value={playerNames[idx]}
                  onChange={(e) => updatePlayerName(idx, e.target.value)}
                  placeholder={DEFAULT_PLAYER_NAMES[idx]}
                  className="w-full bg-slate-800/60 border border-slate-700/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                  maxLength={20}
                />
              </div>
            );
          })}
        </motion.div>

        {/* Deck Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-4 rounded-2xl border border-slate-700/40 bg-slate-900/60 p-3"
        >
          <p className="text-xs text-slate-400 font-bold mb-2 text-center">🃏 محتوى مجموعة البطاقات</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            <span className="text-[10px] px-2 py-1 rounded-lg bg-red-950/30 border border-red-500/20 text-red-400">٤٥ رقم</span>
            <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-800/50 border border-slate-600/20 text-slate-400">💣 ×٢</span>
            <span className="text-[10px] px-2 py-1 rounded-lg bg-slate-800/50 border border-slate-600/20 text-slate-400">⏭️ ×١</span>
            <span className="text-[10px] px-2 py-1 rounded-lg bg-violet-950/30 border border-violet-500/20 text-violet-400">✨ ×٢</span>
            <span className="text-[10px] px-2 py-1 rounded-lg bg-amber-950/30 border border-amber-500/20 text-amber-400">🔥 ×٣</span>
          </div>
        </motion.div>

        {/* Start Button */}
        <motion.button
          whileHover={{ scale: playerNamesValid ? 1.02 : 1 }}
          whileTap={{ scale: playerNamesValid ? 0.98 : 1 }}
          onClick={handleStart}
          disabled={!playerNamesValid}
          className={`w-full rounded-2xl py-4 font-bold text-base sm:text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
            playerNamesValid
              ? 'bg-gradient-to-l from-violet-600 via-purple-600 to-violet-700 hover:from-violet-500 hover:via-purple-500 hover:to-violet-600 text-white shadow-lg shadow-violet-950/50'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>💣</span>
          <span>ابدأ المجازفة 🃏</span>
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        {!playerNamesValid && (
          <p className="text-center text-[10px] text-red-400/70 mt-2">
            تأكد من إدخال أسماء جميع اللاعبين
          </p>
        )}
      </motion.div>
    </div>
  );
}
