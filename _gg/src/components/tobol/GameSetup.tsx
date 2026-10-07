'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTobolStore } from '@/lib/tobol-store';
import type { Team } from '@/lib/tobol-types';
import { ChevronLeft, Swords } from 'lucide-react';

export default function GameSetup() {
  const { redName, blueName, redScore, blueScore, setTeamNames, setScores, startGame } = useTobolStore();

  const [localRedName, setLocalRedName] = useState(redName);
  const [localBlueName, setLocalBlueName] = useState(blueName);
  const [localRedScore, setLocalRedScore] = useState(redScore.toString());
  const [localBlueScore, setLocalBlueScore] = useState(blueScore.toString());
  const [firstTeam, setFirstTeam] = useState<Team>('red');

  const handleStart = () => {
    const t1Name = localRedName.trim() || 'الجيش الأحمر';
    const t2Name = localBlueName.trim() || 'الجيش الأزرق';
    const t1Score = parseInt(localRedScore) || 350;
    const t2Score = parseInt(localBlueScore) || 350;

    setTeamNames(t1Name, t2Name);
    setScores(t1Score, t2Score);
    startGame(firstTeam);
  };

  const isValid = localRedName.trim() && localBlueName.trim() && parseInt(localRedScore) > 0 && parseInt(localBlueScore) > 0;

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
          <div className="text-4xl mb-2">⚔️</div>
          <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400">
            تجهيز المعركة
          </h2>
          <p className="text-xs text-slate-400 mt-1">أعدّ الفرق واختر من يبدأ!</p>
        </motion.div>

        {/* Team 1 (Red) Setup */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4 rounded-2xl border-2 border-red-500/30 bg-gradient-to-l from-red-950/40 to-slate-900/80 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-900/50 border border-red-500/30 flex items-center justify-center">
              <span className="text-sm">🔴</span>
            </div>
            <h3 className="font-bold text-red-300 text-sm">الفريق الأحمر</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">اسم الفريق</label>
              <input
                type="text"
                value={localRedName}
                onChange={(e) => setLocalRedName(e.target.value)}
                placeholder="الجيش الأحمر"
                className="w-full bg-slate-800/60 border border-red-500/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500/50 transition-colors"
                maxLength={20}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">النقاط الأولية</label>
              <input
                type="number"
                value={localRedScore}
                onChange={(e) => setLocalRedScore(e.target.value)}
                placeholder="350"
                className="w-full bg-slate-800/60 border border-red-500/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500/50 transition-colors text-center"
                min={1}
                max={9999}
              />
            </div>
          </div>
        </motion.div>

        {/* VS Divider */}
        <div className="flex items-center justify-center my-3">
          <div className="h-px flex-1 bg-gradient-to-l from-slate-700 to-transparent" />
          <div className="px-3">
            <Swords className="w-5 h-5 text-slate-500" />
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
        </div>

        {/* Team 2 (Blue) Setup */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6 rounded-2xl border-2 border-blue-500/30 bg-gradient-to-l from-blue-950/40 to-slate-900/80 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-900/50 border border-blue-500/30 flex items-center justify-center">
              <span className="text-sm">🔵</span>
            </div>
            <h3 className="font-bold text-blue-300 text-sm">الفريق الأزرق</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">اسم الفريق</label>
              <input
                type="text"
                value={localBlueName}
                onChange={(e) => setLocalBlueName(e.target.value)}
                placeholder="الجيش الأزرق"
                className="w-full bg-slate-800/60 border border-blue-500/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                maxLength={20}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">النقاط الأولية</label>
              <input
                type="number"
                value={localBlueScore}
                onChange={(e) => setLocalBlueScore(e.target.value)}
                placeholder="350"
                className="w-full bg-slate-800/60 border border-blue-500/20 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors text-center"
                min={1}
                max={9999}
              />
            </div>
          </div>
        </motion.div>

        {/* Who Starts First */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6 rounded-2xl border border-slate-700/40 bg-slate-900/60 p-4"
        >
          <p className="text-xs text-slate-400 font-bold mb-3 text-center">🎯 من يبدأ أولاً؟</p>
          <div className="flex gap-3">
            <button
              onClick={() => setFirstTeam('red')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer border-2 ${
                firstTeam === 'red'
                  ? 'border-red-500 bg-red-950/60 text-red-200 shadow-lg shadow-red-950/30'
                  : 'border-slate-700/40 bg-slate-800/40 text-slate-400 hover:border-red-500/40'
              }`}
            >
              🔴 {localRedName.trim() || 'الأحمر'}
            </button>
            <button
              onClick={() => setFirstTeam('blue')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer border-2 ${
                firstTeam === 'blue'
                  ? 'border-blue-500 bg-blue-950/60 text-blue-200 shadow-lg shadow-blue-950/30'
                  : 'border-slate-700/40 bg-slate-800/40 text-slate-400 hover:border-blue-500/40'
              }`}
            >
              🔵 {localBlueName.trim() || 'الأزرق'}
            </button>
          </div>
        </motion.div>

        {/* Start Button */}
        <motion.button
          whileHover={{ scale: isValid ? 1.02 : 1 }}
          whileTap={{ scale: isValid ? 0.98 : 1 }}
          onClick={handleStart}
          disabled={!isValid}
          className={`w-full rounded-2xl py-4 font-bold text-base sm:text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
            isValid
              ? 'bg-gradient-to-l from-red-600 via-amber-600 to-red-700 hover:from-red-500 hover:via-amber-500 hover:to-red-600 text-white shadow-lg shadow-red-950/50'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>⚔️</span>
          <span>بدء الحرب 🔥</span>
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </div>
  );
}
