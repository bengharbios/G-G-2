'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bomb, SkipForward, Copy, Users, Trophy, ArrowLeft } from 'lucide-react';

// ============================================================
// Landing Page — المجازفة 2
// ============================================================
interface LandingPageProps {
  onStartLocal: () => void;
  onStartDiwaniya: () => void;
  onJoinSpectator: (code: string, name: string) => void;
}

export default function LandingPage({ onStartLocal, onStartDiwaniya, onJoinSpectator }: LandingPageProps) {
  const [showRules, setShowRules] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');

  const handleJoin = () => {
    if (joinCode.trim() && joinName.trim()) {
      onJoinSpectator(joinCode.trim(), joinName.trim());
    }
  };

  return (
    <div className="flex flex-col items-center px-4 py-8 min-h-[70vh]">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-300 to-amber-400 mb-2">
          🎴 المجازفة 2
        </h1>
        <p className="text-sm text-slate-400">كاشف البطاقات — تجنب تكرار الأرقام!</p>
      </motion.div>

      {/* Mode Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md space-y-3 mb-6"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartLocal}
          className="w-full py-4 rounded-2xl font-bold text-sm bg-gradient-to-l from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600 text-white transition-all cursor-pointer flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20"
        >
          <Users className="w-5 h-5" />
          العراب — لعب محلي
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartDiwaniya}
          className="w-full py-4 rounded-2xl font-bold text-sm bg-gradient-to-l from-rose-600 to-pink-700 hover:from-rose-500 hover:to-pink-600 text-white transition-all cursor-pointer flex items-center justify-center gap-3 shadow-lg shadow-rose-500/20"
        >
          <Copy className="w-5 h-5" />
          الديوانية — مشاهدة جماعية
        </motion.button>
      </motion.div>

      {/* Join by Code */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="w-full max-w-md bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4 mb-6"
      >
        <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4 text-rose-400" />
          الانضمام بكود المشاهدة
        </h3>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="الكود"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500/50 text-center font-mono tracking-widest"
            dir="ltr"
          />
          <input
            type="text"
            placeholder="اسمك"
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            maxLength={20}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500/50 text-center"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleJoin}
            disabled={!joinCode.trim() || !joinName.trim()}
            className="w-full py-2.5 rounded-xl font-bold text-sm bg-gradient-to-l from-orange-600 to-amber-700 hover:from-orange-500 hover:to-amber-600 text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            انضم ▶
          </motion.button>
        </div>
      </motion.div>

      {/* Rules Toggle */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => setShowRules(!showRules)}
        className="text-sm text-slate-400 hover:text-orange-400 transition-colors cursor-pointer mb-4 flex items-center gap-1"
      >
        {showRules ? '▲ إخفاء' : '▼'} كيف تلعب؟
      </motion.button>

      {/* Rules */}
      {showRules && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="w-full max-w-md bg-slate-800/40 border border-slate-700/30 rounded-2xl p-5 text-sm"
        >
          <h3 className="font-bold text-orange-400 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            قوانين اللعبة
          </h3>
          <div className="space-y-3 text-slate-300">
            <div>
              <h4 className="font-bold text-slate-200 mb-1">🎴 البطاقات</h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                <li>45 بطاقة رقم (1-9 × 5 ألوان) + بطاقات خاصة قابلة للتخصيص</li>
                <li>5 ألوان: 🔴 أحمر، 🔵 أزرق، 🟢 أخضر، 🟡 أصفر، 🟣 بنفسجي</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-200 mb-1">🎯 الهدف</h4>
              <p className="text-xs text-slate-400">أول لاعب يصل للنقاط المحددة (50/60/70/100) يفوز!</p>
            </div>
            <div>
              <h4 className="font-bold text-slate-200 mb-1">⚙️ آليات اللعب</h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                <li>اختر بطاقة → تُضاف لرصيدك المؤقت</li>
                <li>يمكنك <span className="text-amber-400 font-bold">حفظ النقاط</span> في أي لحظة من زر الحفظ</li>
                <li>⚠️ إذا تكرر <span className="text-red-400 font-bold">نفس الرقم</span> بلون مختلف → خسرت كل رصيد الجولة!</li>
                <li>✅ نفس اللون برقم مختلف → <span className="text-emerald-400 font-bold">آمن</span>، أكمل اللعب!</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-200 mb-1">🃏 البطاقات الخاصة</h4>
              <p className="text-[10px] text-slate-500 mb-2">يمكنك تخصيص عدد كل نوع قبل بدء اللعبة!</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                <li className="flex items-center gap-1"><Bomb className="w-3 h-3 text-red-400" /> <b>💣 قنبلة</b> — خسر كل رصيد الجولة</li>
                <li className="flex items-center gap-1"><SkipForward className="w-3 h-3 text-slate-400" /> <b>⏭️ تخطي</b> — انتهى دورك</li>
                <li className="flex items-center gap-1"><span className="text-yellow-400">✨</span> <b className="text-yellow-400">مضاعف ×2</b> — رصيد الجولة × 2، لا تؤثر على المطابقة</li>
                <li className="flex items-center gap-1"><span className="text-amber-400">🔥</span> <b className="text-amber-400">مضاعف ×3</b> — رصيد الجولة × 3، لا تؤثر على المطابقة</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
