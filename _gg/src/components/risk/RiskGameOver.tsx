'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRiskStore } from '@/lib/risk-store';
import type { RiskPlayer } from '@/lib/risk-types';
import {
  Trophy,
  RotateCcw,
  Home as HomeIcon,
  ScrollText,
  Shield,
  Bomb,
  FastForward,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ============================================================
// Confetti
// ============================================================
function Confetti() {
  const particles = useMemo(() => {
    const colors = ['#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#f97316', '#eab308', '#ec4899'];
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
          className="absolute"
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

// ============================================================
// Player Result Card
// ============================================================
function PlayerResultCard({
  player,
  isWinner,
  rank,
}: {
  player: RiskPlayer;
  isWinner: boolean;
  rank: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: isWinner ? 0 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + rank * 0.15 }}
      className={`rounded-xl border p-3 sm:p-4 bg-slate-900/40 border-slate-700/30 ${isWinner ? 'ring-2 ring-yellow-400/50' : 'opacity-80'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{player.emoji}</span>
          <div>
            <p className={`text-sm font-bold ${player.color}`}>
              {player.name}
            </p>
            <p className="text-[10px] text-slate-500">
              {isWinner ? '🏆 الفائز!' : `#${rank + 1}`}
            </p>
          </div>
        </div>
        <div className="text-left">
          <motion.p
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + rank * 0.15, type: 'spring' }}
            className="text-2xl sm:text-3xl font-black text-white"
          >
            {player.score}
          </motion.p>
          <p className="text-[10px] text-slate-500">نقطة</p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Main RiskGameOver Component
// ============================================================
export default function RiskGameOver() {
  const router = useRouter();
  const {
    players,
    gameLog,
    winner,
    targetScore,
    resetGame,
  } = useRiskStore();

  // Sort players by score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winnerPlayer = sortedPlayers[0];

  // Stats - count action types from game log
  const totalSaves = gameLog.filter(e => e.action.includes('حفظ')).length;
  const totalBombs = gameLog.filter(e => e.action.includes('قنبلة')).length;
  const totalSkips = gameLog.filter(e => e.action.includes('تخطي')).length;
  const totalMatches = gameLog.filter(e => e.action.includes('تطابق')).length;
  const totalPoints = players.reduce((sum, p) => sum + p.score, 0);

  const handlePlayAgain = () => {
    resetGame();
  };

  const handleHome = () => {
    resetGame();
    router.push('/');
  };

  const handleShare = () => {
    const text = `💣 المجازفة\n🏆 الفائز: ${winnerPlayer.name} (${winnerPlayer.score} نقطة)\nالهدف: ${targetScore}\n\n${players.map(p => `${p.emoji} ${p.name}: ${p.score}`).join('\n')}\n\nالعب الآن: ${window.location.origin}/risk`;
    navigator.clipboard.writeText(text).then(() => {
      // Could show toast
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-3 sm:p-4 risk-bg">
      {winner && <Confetti />}

      <div className="relative z-10 w-full max-w-sm sm:max-w-lg mx-auto py-6 sm:py-8">
        {/* Winner Banner */}
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
            🏆
          </motion.div>
          <h1
            className="text-3xl sm:text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-300"
          >
            {winnerPlayer ? `${winnerPlayer.name} فاز! 🎉` : 'انتهت اللعبة!'}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            وصل للهدف ({targetScore} نقطة) أولاً!
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="pt-3 sm:pt-4 text-center">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-xl sm:text-2xl font-black text-slate-200">{totalPoints}</p>
              <p className="text-[10px] sm:text-xs text-slate-500">مجموع</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="pt-3 sm:pt-4 text-center">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-xl sm:text-2xl font-black text-slate-200">{totalSaves}</p>
              <p className="text-[10px] sm:text-xs text-slate-500">حفظ</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="pt-3 sm:pt-4 text-center">
              <Bomb className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mx-auto mb-1" />
              <p className="text-xl sm:text-2xl font-black text-slate-200">{totalBombs}</p>
              <p className="text-[10px] sm:text-xs text-slate-500">قنبلة</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50">
            <CardContent className="pt-3 sm:pt-4 text-center">
              <FastForward className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 mx-auto mb-1" />
              <p className="text-xl sm:text-2xl font-black text-slate-200">{totalSkips + totalMatches}</p>
              <p className="text-[10px] sm:text-xs text-slate-500">خسارة</p>
            </CardContent>
          </Card>
        </div>

        {/* Players Results */}
        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
          {sortedPlayers.map((player, idx) => (
            <PlayerResultCard
              key={player.id}
              player={player}
              isWinner={idx === 0}
              rank={idx}
            />
          ))}
        </div>

        {/* Game Log */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-4 sm:mb-6">
          <CardContent className="pt-3 sm:pt-4">
            <h3 className="text-slate-200 font-bold mb-2 sm:mb-3 text-xs sm:text-sm flex items-center gap-2">
              <ScrollText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
              📜 سجل اللعبة
            </h3>
            <div className="space-y-1.5 sm:space-y-2 max-h-48 sm:max-h-56 overflow-y-auto risk-scrollbar">
              {gameLog.length === 0 ? (
                <p className="text-center text-slate-600 text-xs py-4">لا توجد تحركات...</p>
              ) : (
                gameLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-2 text-xs sm:text-sm"
                  >
                    <span className="text-slate-600 text-[10px] sm:text-xs mt-0.5 shrink-0 w-5 sm:w-6">
                      {entry.id}.
                    </span>
                    <span className="text-slate-300">
                      {entry.action}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 py-5 sm:py-6"
          >
            📤 مشاركة
          </Button>
          <Button
            onClick={handlePlayAgain}
            className="flex-1 bg-gradient-to-l from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-bold text-base sm:text-lg py-5 sm:py-6"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            مرة أخرى
          </Button>
          <Button
            onClick={handleHome}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800 py-5 sm:py-6"
          >
            <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            الرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}
