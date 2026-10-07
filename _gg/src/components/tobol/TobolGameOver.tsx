'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTobolStore } from '@/lib/tobol-store';
import {
  Trophy,
  RotateCcw,
  Swords,
  Target,
  Bomb,
  Zap,
  Shield,
} from 'lucide-react';

// Confetti particle component
function Confetti() {
  const particles = useMemo(() => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      size: 4 + Math.random() * 8,
      rotate: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: p.rotate + 720, opacity: 0 }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeIn',
          }}
          className="absolute confetti-piece"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

export default function TobolGameOver() {
  const { redName, blueName, redScore, blueScore, battleLog, clickedBtns, resetGame } = useTobolStore();

  const winner = redScore > blueScore ? 'red' : blueScore > redScore ? 'blue' : 'draw';
  const winnerName = winner === 'red' ? redName : winner === 'blue' ? blueName : 'تعادل!';
  const scoreDiff = Math.abs(redScore - blueScore);

  // Calculate stats from battle log
  const totalClicks = battleLog.length;
  const attacks = battleLog.filter(e => e.valueChange < 0 && e.message.includes('هجوم'));
  const traps = battleLog.filter(e => e.message.includes('فخ'));
  const emptyCards = battleLog.filter(e => e.message.includes('فارغة'));

  const redAttacks = battleLog.filter(e => e.team === 'red' && e.message.includes('هجوم'));
  const blueAttacks = battleLog.filter(e => e.team === 'blue' && e.message.includes('هجوم'));
  const redTraps = battleLog.filter(e => e.team === 'red' && e.message.includes('فخ'));
  const blueTraps = battleLog.filter(e => e.team === 'blue' && e.message.includes('فخ'));

  const redTotalDamage = redAttacks.reduce((s, e) => s + Math.abs(e.valueChange), 0);
  const blueTotalDamage = blueAttacks.reduce((s, e) => s + Math.abs(e.valueChange), 0);
  const redSelfDamage = redTraps.reduce((s, e) => s + Math.abs(e.valueChange), 0);
  const blueSelfDamage = blueTraps.reduce((s, e) => s + Math.abs(e.valueChange), 0);

  const loserTeam = winner === 'red' ? 'blue' : winner === 'blue' ? 'red' : null;

  return (
    <div className="min-h-screen flex flex-col items-center p-3 sm:p-4 tobol-bg">
      {/* Confetti for winner */}
      {winner !== 'draw' && <Confetti />}

      <div className="relative z-10 w-full max-w-sm sm:max-w-lg mx-auto py-6 sm:py-8">
        {/* Winner Banner — like Mafia */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10 }}
          className="text-center mb-6 sm:mb-8"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-7xl sm:text-8xl mb-3 sm:mb-4"
          >
            {winner === 'draw' ? '🤝' : '🏆'}
          </motion.div>
          <h1
            className={`text-3xl sm:text-4xl font-black mb-2 ${
              winner === 'red'
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-300'
                : winner === 'blue'
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300'
            }`}
          >
            {winner === 'draw'
              ? 'تعادل! 🤝'
              : `${winnerName} فاز! 🎉`
            }
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            {winner === 'draw'
              ? 'الفرقان متعادلان بالنقاط'
              : `فاز بالمعركة بفارق ${scoreDiff} نقطة`
            }
          </p>
        </motion.div>

        {/* Stats Grid — like Mafia */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="pt-3 sm:pt-4 text-center">
              <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 mx-auto mb-1" />
              <p className="text-xl sm:text-2xl font-black text-slate-200">{totalClicks}</p>
              <p className="text-[10px] sm:text-xs text-slate-500">تحركات</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="pt-3 sm:pt-4 text-center">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mx-auto mb-1" />
              <p className="text-xl sm:text-2xl font-black text-slate-200">{attacks.length}</p>
              <p className="text-[10px] sm:text-xs text-slate-500">هجمات</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="pt-3 sm:pt-4 text-center">
              <Bomb className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 mx-auto mb-1" />
              <p className="text-xl sm:text-2xl font-black text-slate-200">{traps.length}</p>
              <p className="text-[10px] sm:text-xs text-slate-500">فخاخ</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="pt-3 sm:pt-4 text-center">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 mx-auto mb-1" />
              <p className="text-xl sm:text-2xl font-black text-slate-200">{emptyCards.length}</p>
              <p className="text-[10px] sm:text-xs text-slate-500">فارغة</p>
            </CardContent>
          </Card>
        </div>

        {/* Teams Revealed — like Mafia's card reveal */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-3 sm:mb-4">
          <CardContent className="pt-3 sm:pt-4">
            <h3 className="text-slate-200 font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
              كشف نتائج الفرق
            </h3>

            {/* Red Team */}
            <div className="mb-3 sm:mb-4">
              <Badge className={`text-xs mb-2 ${winner === 'red' ? 'bg-red-900/50 text-red-300 border border-red-500/30' : 'bg-slate-800/50 text-slate-400 border border-slate-700/30'}`}>
                {winner === 'red' ? '🏆' : '💀'} {redName}
              </Badge>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="rounded-lg bg-slate-800/40 border border-slate-700/30 p-2 text-center">
                  <p className={`text-lg sm:text-xl font-black ${winner === 'red' ? 'text-red-300' : 'text-slate-400'}`}>{redScore}</p>
                  <p className="text-[10px] text-slate-500">النقاط</p>
                </div>
                <div className="rounded-lg bg-slate-800/40 border border-slate-700/30 p-2 text-center">
                  <p className="text-lg sm:text-xl font-black text-red-400">{redTotalDamage}</p>
                  <p className="text-[10px] text-slate-500">ضرر للخصم</p>
                </div>
                <div className="rounded-lg bg-slate-800/40 border border-slate-700/30 p-2 text-center">
                  <p className="text-lg sm:text-xl font-black text-orange-400">{redSelfDamage}</p>
                  <p className="text-[10px] text-slate-500">ضرر ذاتي</p>
                </div>
              </div>
            </div>

            {/* Blue Team */}
            <div>
              <Badge className={`text-xs mb-2 ${winner === 'blue' ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30' : 'bg-slate-800/50 text-slate-400 border border-slate-700/30'}`}>
                {winner === 'blue' ? '🏆' : '💀'} {blueName}
              </Badge>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="rounded-lg bg-slate-800/40 border border-slate-700/30 p-2 text-center">
                  <p className={`text-lg sm:text-xl font-black ${winner === 'blue' ? 'text-blue-300' : 'text-slate-400'}`}>{blueScore}</p>
                  <p className="text-[10px] text-slate-500">النقاط</p>
                </div>
                <div className="rounded-lg bg-slate-800/40 border border-slate-700/30 p-2 text-center">
                  <p className="text-lg sm:text-xl font-black text-blue-400">{blueTotalDamage}</p>
                  <p className="text-[10px] text-slate-500">ضرر للخصم</p>
                </div>
                <div className="rounded-lg bg-slate-800/40 border border-slate-700/30 p-2 text-center">
                  <p className="text-lg sm:text-xl font-black text-orange-400">{blueSelfDamage}</p>
                  <p className="text-[10px] text-slate-500">ضرر ذاتي</p>
                </div>
              </div>
            </div>

            {/* Score comparison bar */}
            {redScore + blueScore > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>{redName}</span>
                  <span>{blueName}</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden bg-slate-800">
                  <motion.div
                    initial={{ width: '50%' }}
                    animate={{ width: `${(redScore / (redScore + blueScore)) * 100}%` }}
                    transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                    className="bg-gradient-to-l from-red-500 to-red-700"
                  />
                  <motion.div
                    initial={{ width: '50%' }}
                    animate={{ width: `${(blueScore / (redScore + blueScore)) * 100}%` }}
                    transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                    className="bg-gradient-to-r from-blue-500 to-blue-700"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Battle Log — like Mafia's game log */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-4 sm:mb-6">
          <CardContent className="pt-3 sm:pt-4">
            <h3 className="text-slate-200 font-bold mb-2 sm:mb-3 text-xs sm:text-sm">
              📜 سجل المعركة
            </h3>
            <div className="space-y-1.5 sm:space-y-2 max-h-48 sm:max-h-56 overflow-y-auto tobol-scrollbar">
              {battleLog.length === 0 ? (
                <p className="text-center text-slate-600 text-xs py-4">لا توجد تحركات...</p>
              ) : (
                battleLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-2 text-xs sm:text-sm"
                  >
                    <span className="text-slate-600 text-[10px] sm:text-xs mt-0.5 shrink-0 w-5 sm:w-6">
                      {entry.id}.
                    </span>
                    <span
                      className={
                        entry.message.includes('هجوم')
                          ? entry.team === 'red' ? 'text-red-400' : 'text-blue-400'
                          : entry.message.includes('فخ')
                          ? 'text-orange-400'
                          : 'text-slate-400'
                      }
                    >
                      {entry.message}
                    </span>
                    {entry.valueChange !== 0 && (
                      <span className={`text-[10px] font-black shrink-0 ${entry.valueChange < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        ({entry.valueChange})
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Play Again — like Mafia */}
        <Button
          onClick={resetGame}
          className="w-full bg-gradient-to-l from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-amber-600 text-white font-bold text-base sm:text-lg py-5 sm:py-6 pulse-glow-gold"
        >
          <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          العب مرة أخرى
        </Button>
      </div>
    </div>
  );
}
